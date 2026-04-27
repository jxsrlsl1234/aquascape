'use client';

import { useState, useEffect } from 'react';
import GeometryPreview from './GeometryPreview';

interface Material {
  id: number;
  name: string;
  type: string;
  modelUrl: string;
  thumbnailUrl: string | null;
}

interface MaterialLibraryProps {
  onAddMaterial: (material: Material) => void;
}

const MATERIAL_TYPES = ['plant', 'fish', 'sand', 'stone', 'wood'];

const TYPE_LABELS: Record<string, string> = {
  plant: '水草',
  fish: '鱼类',
  sand: '底砂',
  stone: '石头',
  wood: '沉木',
};

// 判断是否使用几何体渲染
const useGeometry = (modelUrl: string) => {
  return modelUrl?.startsWith('geometry://') || modelUrl?.includes('github.com/mrdoob/three.js/master/examples');
};

export default function MaterialLibrary({ onAddMaterial }: MaterialLibraryProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedMaterial, setDraggedMaterial] = useState<Material | null>(null);
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/materials');
      const data = await response.json();

      if (Array.isArray(data)) {
        setMaterials(data);
      } else {
        console.error('API returned non-array data:', data);
        setMaterials([]);
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, material: Material) => {
    setDraggedMaterial(material);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/json', JSON.stringify(material));
  };

  const handleDragEnd = () => {
    setDraggedMaterial(null);
  };

  const toggleType = (type: string) => {
    setExpandedTypes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  // 按类型分组素材
  const materialsByType = MATERIAL_TYPES.reduce((acc, type) => {
    acc[type] = materials.filter((m) => m.type === type);
    return acc;
  }, {} as Record<string, Material[]>);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-black">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">素材库</h2>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">点击分类展开素材列表</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="text-center text-gray-500 dark:text-gray-500 py-4">加载中...</div>
        ) : materials.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-500 py-4">
            暂无素材<br />
            <span className="text-xs">去素材管理页添加</span>
          </div>
        ) : (
          <div className="space-y-3">
            {MATERIAL_TYPES.map((type) => {
              const typeMaterials = materialsByType[type];
              const isExpanded = expandedTypes.has(type);

              return (
                <div key={type} className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                  {/* 分类标题 */}
                  <button
                    onClick={() => toggleType(type)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-950 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-gray-300">{TYPE_LABELS[type]}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-500 bg-gray-200 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                        {typeMaterials.length}
                      </span>
                    </div>
                    <span className={`text-gray-500 dark:text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>

                  {/* 该分类的素材列表 */}
                  {isExpanded && (
                    <div className="p-3 bg-white dark:bg-black">
                      {typeMaterials.length === 0 ? (
                        <div className="text-center text-gray-500 dark:text-gray-500 py-2 text-sm">
                          该分类暂无素材
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {typeMaterials.map((material) => (
                            <div
                              key={material.id}
                              onClick={() => onAddMaterial(material)}
                              draggable
                              onDragStart={(e) => handleDragStart(e, material)}
                              onDragEnd={handleDragEnd}
                              className={`p-3 bg-gray-50 dark:bg-gray-950 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 cursor-pointer transition-colors group ${
                                draggedMaterial?.id === material.id ? 'opacity-50' : ''
                              }`}
                            >
                              <div className="flex gap-3">
                                {/* 预览图 */}
                                <div className="w-16 h-16 flex-shrink-0">
                                  {material.thumbnailUrl ? (
                                    <img
                                      src={material.thumbnailUrl}
                                      alt={material.name}
                                      className="w-full h-full object-cover rounded-lg"
                                    />
                                  ) : useGeometry(material.modelUrl) ? (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <GeometryPreview type={material.type} className="w-14 h-14" />
                                    </div>
                                  ) : (
                                    <div className="w-full h-full bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-500 text-xs">
                                      无预览
                                    </div>
                                  )}
                                </div>

                                {/* 信息 */}
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900 dark:text-gray-300 truncate">
                                    {material.name}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                    {TYPE_LABELS[material.type]}
                                  </div>
                                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    点击添加或拖拽
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
