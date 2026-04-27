'use client';

import { useState, useRef, useEffect } from 'react';
import Aquarium3D from '@/components/Aquarium3D';
import MaterialLibrary from '@/components/MaterialLibrary';
import ItemTransformPanel from '@/components/ItemTransformPanel';
import MenuBar from '@/components/MenuBar';
import PropertiesPanel from '@/components/PropertiesPanel';
import { useTheme } from '@/contexts/ThemeContext';
import * as THREE from 'three';

interface AquariumItem {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  modelUrl: string;
  type: string;
  materialId: number;
}

interface ProjectVersion {
  id: number;
  name: string;
  length: number;
  width: number;
  height: number;
  glassThickness: number;
  waterLevel: number;
  items: AquariumItem[];
  createdAt: string;
}

export default function AquariumPage() {
  const { setTheme } = useTheme();
  const [length, setLength] = useState<number>(200); // 长度（厘米）
  const [width, setWidth] = useState<number>(100); // 宽度（厘米）
  const [height, setHeight] = useState<number>(150); // 高度（厘米）
  const [glassThickness, setGlassThickness] = useState<number>(1); // 玻璃厚度（厘米）
  const [waterLevel, setWaterLevel] = useState<number>(80); // 水面高度（厘米）
  const [items, setItems] = useState<AquariumItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [isDraggingItem, setIsDraggingItem] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // 强制设置创作页面为白天风格
  useEffect(() => {
    setTheme('light');
  }, [setTheme]);

  // 版本管理状态
  const [showVersionPanel, setShowVersionPanel] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [versionName, setVersionName] = useState('');
  const [versions, setVersions] = useState<ProjectVersion[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);

  const handleAddMaterial = (material: any) => {
    // 根据素材类型和鱼缸尺寸计算合适的默认大小
    let defaultScale: [number, number, number] = [1, 1, 1];
    const lengthM = length / 100; // 厘米转米
    const widthM = width / 100;
    const heightM = height / 100;

    switch (material.type) {
      case 'plant':
        // 水草：高度约为鱼缸高度的 40%
        defaultScale = [1, heightM * 0.4, 1];
        break;
      case 'fish':
        // 鱼类：大小约为鱼缸长度的 8%
        const fishSize = lengthM * 0.08;
        defaultScale = [fishSize * 10, fishSize * 10, fishSize * 10];
        break;
      case 'sand':
        // 底沙：较小的默认大小，用户会使用"贴合鱼缸底部"按钮
        defaultScale = [1, 1, 1];
        break;
      case 'stone':
        // 石头：大小约为鱼缸长度的 5-10%
        const stoneSize = lengthM * 0.07;
        defaultScale = [stoneSize * 7, stoneSize * 7, stoneSize * 7];
        break;
      case 'wood':
        // 沉木：长度约为鱼缸长度的 25%，高度约为长度的 20%
        const woodLength = lengthM * 0.25;
        defaultScale = [woodLength * 2.5, woodLength * 2.5, woodLength * 2.5];
        break;
      default:
        defaultScale = [1, 1, 1];
    }

    // 将新素材添加到默认位置（鱼缸正中心）
    const newItem: AquariumItem = {
      id: Date.now().toString(),
      position: [0, 0, 0], // 默认添加到鱼缸正中心
      rotation: [0, 0, 0],
      scale: defaultScale,
      modelUrl: material.modelUrl,
      type: material.type,
      materialId: material.id,
    };
    setItems([...items, newItem]);
    setSelectedItemId(newItem.id);
  };

  const handleItemUpdate = (itemId: string, updates: {
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: [number, number, number];
  }) => {
    setItems(items.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    ));
  };

  const handleItemSelect = (itemId: string) => {
    setSelectedItemId(itemId === '' ? '' : itemId);
  };

  const handleItemDelete = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
    if (selectedItemId === itemId) {
      setSelectedItemId('');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const materialJson = e.dataTransfer.getData('application/json');
    if (materialJson) {
      try {
        const material = JSON.parse(materialJson);
        // 计算鼠标在3D空间中的位置
        const dropPosition = calculateDropPosition(e.clientX, e.clientY);
        const newItem: AquariumItem = {
          id: Date.now().toString(),
          position: dropPosition,
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          modelUrl: material.modelUrl,
          type: material.type,
          materialId: material.id,
        };
        setItems([...items, newItem]);
        setSelectedItemId(newItem.id);
      } catch (error) {
        console.error('Failed to parse dropped material:', error);
      }
    }
  };

  const calculateDropPosition = (clientX: number, clientY: number): [number, number, number] => {
    // 简化的计算：基于容器尺寸估算3D空间位置
    if (!containerRef.current) {
      return [0, 0, 0];
    }

    const rect = containerRef.current.getBoundingClientRect();
    const normalizedX = (clientX - rect.left) / rect.width;
    const normalizedY = (clientY - rect.top) / rect.height;

    // 转换到3D空间坐标（简化版）
    const x = (normalizedX - 0.5) * length;
    const y = (0.5 - normalizedY) * height * 0.8;
    const z = 0; // 默认放在中间深度

    return [x, y, z];
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // 如果选中的是某个素材，开始拖拽
    if (selectedItemId && e.button === 0) {
      setIsDraggingItem(true);
      setDragStartPos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingItem && selectedItemId && dragStartPos) {
      const deltaX = (e.clientX - dragStartPos.x) * 0.003;
      const deltaY = (e.clientY - dragStartPos.y) * -0.003;

      const item = items.find(i => i.id === selectedItemId);
      if (item) {
        let newPosition: [number, number, number];

        // Shift+拖拽：移动Y轴（深度）
        if (e.shiftKey) {
          newPosition = [
            item.position[0],
            item.position[1] + deltaY,
            item.position[2],
          ];
        } else {
          // 普通拖拽：移动X轴（水平）和Z轴（垂直）
          newPosition = [
            item.position[0] + deltaX,
            item.position[1],
            item.position[2] + deltaY,
          ];
        }

        handleItemUpdate(selectedItemId, { position: newPosition });
        setDragStartPos({ x: e.clientX, y: e.clientY });
      }
    }
  };

  const handleMouseUp = () => {
    setIsDraggingItem(false);
    setDragStartPos(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (selectedItemId) {
      e.preventDefault();
      const item = items.find(i => i.id === selectedItemId);
      if (item) {
        const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale: [number, number, number] = [
          Math.max(0.1, Math.min(5, item.scale[0] * scaleFactor)),
          Math.max(0.1, Math.min(5, item.scale[1] * scaleFactor)),
          Math.max(0.1, Math.min(5, item.scale[2] * scaleFactor)),
        ];
        handleItemUpdate(selectedItemId, { scale: newScale });
      }
    }
  };

  const handleClearAll = () => {
    if (confirm('确定要清空所有元素吗？')) {
      setItems([]);
      setSelectedItemId('');
    }
  };

  // 版本管理函数
  const fetchVersions = async () => {
    try {
      setIsLoadingVersions(true);
      const response = await fetch('/api/project-versions');
      const data = await response.json();
      if (data.success) {
        setVersions(data.data);
      }
    } catch (error) {
      console.error('获取版本列表失败:', error);
      alert('获取版本列表失败');
    } finally {
      setIsLoadingVersions(false);
    }
  };

  const handleSaveVersion = async () => {
    if (!versionName.trim()) {
      alert('请输入版本名称');
      return;
    }

    try {
      const response = await fetch('/api/project-versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: versionName,
          length,
          width,
          height,
          glassThickness,
          waterLevel,
          items,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('保存成功！');
        setShowSaveDialog(false);
        setVersionName('');
        fetchVersions();
      } else {
        alert(data.error || '保存失败');
      }
    } catch (error) {
      console.error('保存版本失败:', error);
      alert('保存失败');
    }
  };

  const handleLoadVersion = async (version: ProjectVersion) => {
    if (!confirm(`确定要加载版本 "${version.name}" 吗？当前未保存的内容将丢失。`)) {
      return;
    }

    setLength(version.length);
    setWidth(version.width);
    setHeight(version.height);
    setGlassThickness(version.glassThickness);
    setWaterLevel(version.waterLevel);
    setItems(version.items);
    setSelectedItemId('');
    setShowVersionPanel(false);
  };

  const handleDeleteVersion = async (versionId: number) => {
    if (!confirm('确定要删除这个版本吗？')) {
      return;
    }

    try {
      const response = await fetch(`/api/project-versions/${versionId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        fetchVersions();
      } else {
        alert(data.error || '删除失败');
      }
    } catch (error) {
      console.error('删除版本失败:', error);
      alert('删除失败');
    }
  };

  // 打开版本面板时获取版本列表
  useEffect(() => {
    if (showVersionPanel) {
      fetchVersions();
    }
  }, [showVersionPanel]);

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-950" suppressHydrationWarning>
      {/* 菜单栏 */}
      <MenuBar
        onSaveVersion={() => setShowSaveDialog(true)}
        onVersionManage={() => setShowVersionPanel(true)}
        onMaterialManage={() => window.location.href = '/materials'}
        onClearAll={() => {
          if (confirm('确定要清空所有元素吗？')) {
            setItems([]);
            setSelectedItemId('');
          }
        }}
      />

      {/* 主内容区 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧属性面板 */}
        <PropertiesPanel
          length={length}
          width={width}
          height={height}
          glassThickness={glassThickness}
          waterLevel={waterLevel}
          onLengthChange={setLength}
          onWidthChange={setWidth}
          onHeightChange={setHeight}
          onGlassThicknessChange={setGlassThickness}
          onWaterLevelChange={setWaterLevel}
        />

        {/* 中间3D视图 */}
        <div
          ref={containerRef}
          className="flex-1 relative bg-gray-50 dark:bg-gray-950"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
        >
          {/* 选中状态指示器 */}
          {selectedItemId && (
            <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-md border ${
              selectedItemId === 'aquarium'
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
            }`}>
              <div className={`text-xs ${selectedItemId === 'aquarium' ? 'text-blue-700 dark:text-blue-400' : 'text-yellow-700 dark:text-yellow-400'}`}>
                {selectedItemId === 'aquarium' ? '已选中鱼缸 - 拖动旋转 / 滚轮缩放' : '已选中素材 - 拖拽移动 / 滚轮缩放'}
              </div>
            </div>
          )}

          {/* 选中鱼缸按钮 */}
          <button
            onClick={() => setSelectedItemId('aquarium')}
            className={`absolute top-4 right-4 px-4 py-2 text-sm rounded-md transition-colors ${
              selectedItemId === 'aquarium'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
            }`}
          >
            选中鱼缸
          </button>

          {/* 清空元素按钮 */}
          {items.length > 0 && (
            <button
              onClick={handleClearAll}
              className="absolute top-16 right-4 px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
            >
              清空元素
            </button>
          )}

          <Aquarium3D
            width={length / 100} // 厘米转米
            height={height / 100} // 厘米转米
            depth={width / 100} // 厘米转米
            glassThickness={glassThickness / 100} // 厘米转米
            waterLevel={waterLevel / 100} // 厘米转米
            items={items}
            onItemUpdate={handleItemUpdate}
            onItemSelect={handleItemSelect}
            onItemDelete={handleItemDelete}
            selectedItemId={selectedItemId}
          />
        </div>

        {/* 右侧素材库 */}
        <div className="w-80 border-l border-gray-200 dark:border-gray-800">
          <MaterialLibrary onAddMaterial={handleAddMaterial} />
        </div>
      </div>

      {/* 变换操作面板 - 选中素材时显示 */}
      {selectedItemId && selectedItemId !== 'aquarium' && (() => {
        const selectedItem = items.find(i => i.id === selectedItemId);
        if (selectedItem) {
          return (
            <ItemTransformPanel
              item={{
                id: selectedItem.id,
                position: selectedItem.position,
                rotation: selectedItem.rotation,
                scale: selectedItem.scale,
                type: selectedItem.type,
              }}
              aquariumDimensions={{
                length,
                width,
                height,
              }}
              onUpdate={handleItemUpdate}
              onClose={() => setSelectedItemId('')}
            />
          );
        }
        return null;
      })()}

      {/* 保存版本对话框 */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-96">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">保存版本</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                版本名称
              </label>
              <input
                type="text"
                value={versionName}
                onChange={(e) => setVersionName(e.target.value)}
                placeholder="输入版本名称"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                autoFocus
              />
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              将保存当前鱼缸配置和所有素材
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setVersionName('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveVersion}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 版本管理面板 */}
      {showVersionPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-[500px] max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">版本管理</h3>
              <button
                onClick={() => setShowVersionPanel(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {isLoadingVersions ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">加载中...</div>
              ) : versions.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  暂无保存的版本
                </div>
              ) : (
                <div className="space-y-3">
                  {versions.map((version) => (
                    <div
                      key={version.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800 dark:text-white mb-1">
                            {version.name}
                          </h4>
                          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                            <div>
                              尺寸: {version.length}cm × {version.width}cm × {version.height}cm
                            </div>
                            <div>
                              元素: {version.items.length} 个
                            </div>
                            <div>
                              保存时间: {new Date(version.createdAt).toLocaleString('zh-CN')}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <button
                            onClick={() => handleLoadVersion(version)}
                            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          >
                            加载
                          </button>
                          <button
                            onClick={() => handleDeleteVersion(version.id)}
                            className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
