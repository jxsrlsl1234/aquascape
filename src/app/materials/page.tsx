'use client';

import { useState, useEffect } from 'react';
import GeometryPreview from '@/components/GeometryPreview';

interface Material {
  id: number;
  name: string;
  type: string;
  modelKey?: string;
  modelUrl?: string;
  thumbnailUrl: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

const MATERIAL_TYPES = ['plant', 'fish', 'sand', 'stone', 'wood'];

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);
  const [filter, setFilter] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'plant',
    modelKey: '',
    thumbnailUrl: '',
    description: '',
  });

  const [file, setFile] = useState<File | null>(null);
  const [useUpload, setUseUpload] = useState(true); // true=上传文件, false=手动填写

  useEffect(() => {
    fetchMaterials();
  }, [filter]);

  const fetchMaterials = async () => {
    try {
      const params = new URLSearchParams();
      if (filter) params.append('type', filter);

      const response = await fetch(`/api/materials?${params}`);
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

  const handleFileUpload = async (fileToUpload?: File | null) => {
    const fileToUse = fileToUpload || file;
    if (!fileToUse) return;

    setUploading(true);
    try {
      console.log('[Upload Client] Starting upload for file:', {
        name: fileToUse.name,
        size: fileToUse.size,
        type: fileToUse.type,
        sizeMB: (fileToUse.size / 1024 / 1024).toFixed(2) + 'MB'
      });

      // 计算分块数量（每块 4MB，小于 Vercel 的限制）
      const CHUNK_SIZE = 4 * 1024 * 1024; // 4MB
      const totalChunks = Math.ceil(fileToUse.size / CHUNK_SIZE);
      const fileId = crypto.randomUUID();

      console.log('[Upload Client] Splitting file into chunks:', {
        totalChunks,
        chunkSize: CHUNK_SIZE,
        fileId,
      });

      // 上传每个分块
      let lastResponse: Response | null = null;

      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, fileToUse.size);
        const chunk = fileToUse.slice(start, end);

        console.log(`[Upload Client] Uploading chunk ${chunkIndex + 1}/${totalChunks}`);

        const formData = new FormData();
        formData.append('file', chunk);
        formData.append('chunkIndex', chunkIndex.toString());
        formData.append('totalChunks', totalChunks.toString());
        formData.append('fileId', fileId);
        formData.append('fileName', fileToUse.name);

        const response = await fetch('/api/upload/chunk', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorJson = await response.json().catch(() => ({ error: 'Unknown error' }));
          const errorMsg = errorJson.error || errorJson.details || 'Unknown error';
          console.error(`[Upload Client] Chunk ${chunkIndex + 1}/${totalChunks} failed:`, errorMsg);
          throw new Error(`上传分块 ${chunkIndex + 1}/${totalChunks} 失败: ${errorMsg}`);
        }

        const result = await response.json();
        console.log(`[Upload Client] Chunk ${chunkIndex + 1}/${totalChunks} uploaded:`, result);

        if (result.status === 'complete') {
          // 所有分块上传完成
          console.log('[Upload Client] All chunks uploaded, file key:', result.key);

          setFormData((prev) => ({
            ...prev,
            modelKey: result.key,
          }));

          alert(`文件上传成功！\n文件名: ${fileToUse.name}\n文件大小: ${(fileToUse.size / 1024 / 1024).toFixed(2)}MB\n模型 Key 已自动生成`);
          return;
        }

        // 保存最后一个分块的响应
        if (chunkIndex === totalChunks - 1) {
          lastResponse = response;
        }
      }

      // 如果所有分块都上传了但最后一个分块返回的是 partial，等待并重试检查
      if (lastResponse) {
        console.log('[Upload Client] All chunks uploaded, waiting for merge...');

        // 等待服务器合并并轮询检查状态
        for (let retry = 0; retry < 10; retry++) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // 等待2秒

          // 通过检查最终文件是否存在来判断是否上传完成
          try {
            const checkResponse = await fetch(`/api/materials/check-upload?fileId=${fileId}`);
            if (checkResponse.ok) {
              const checkResult = await checkResponse.json();
              if (checkResult.status === 'complete') {
                console.log('[Upload Client] Upload confirmed, file key:', checkResult.key);

                setFormData((prev) => ({
                  ...prev,
                  modelKey: checkResult.key,
                }));

                alert(`文件上传成功！\n文件名: ${fileToUse.name}\n文件大小: ${(fileToUse.size / 1024 / 1024).toFixed(2)}MB\n模型 Key 已自动生成`);
                return;
              }
            }
          } catch (e) {
            console.error('[Upload Client] Check upload error:', e);
          }

          console.log(`[Upload Client] Retry ${retry + 1}/10...`);
        }
      }

      throw new Error('上传未完成，请重试');
    } catch (error) {
      console.error('[Upload Client] Error uploading file:', error);
      alert('文件上传失败：' + (error instanceof Error ? error.message : '未知错误'));
      setFile(null);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.modelKey) {
      alert('请先上传 3D 模型文件！');
      return;
    }

    try {
      const response = await fetch('/api/materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('素材创建成功！');
        setShowAddForm(false);
        setFormData({
          name: '',
          type: 'plant',
          modelKey: '',
          thumbnailUrl: '',
          description: '',
        });
        setFile(null);
        fetchMaterials();
      } else {
        alert('创建失败');
      }
    } catch (error) {
      console.error('Error creating material:', error);
      alert('创建失败');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;

    try {
      const response = await fetch(`/api/materials/${editing.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('更新成功！');
        setEditing(null);
        fetchMaterials();
      } else {
        alert('更新失败');
      }
    } catch (error) {
      console.error('Error updating material:', error);
      alert('更新失败');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个素材吗？')) return;

    try {
      const response = await fetch(`/api/materials/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('删除成功');
        fetchMaterials();
      } else {
        alert('删除失败');
      }
    } catch (error) {
      console.error('Error deleting material:', error);
      alert('删除失败');
    }
  };

  const handleEditClick = (material: Material) => {
    setEditing(material);
    setFormData({
      name: material.name,
      type: material.type,
      modelKey: material.modelKey || '',
      thumbnailUrl: material.thumbnailUrl || '',
      description: material.description || '',
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'plant',
      modelKey: '',
      thumbnailUrl: '',
      description: '',
    });
    setFile(null);
    setUseUpload(true);
  };

  // 判断是否使用几何体渲染
  const useGeometry = (modelKeyOrUrl: string) => {
    return modelKeyOrUrl?.startsWith('geometry://') || modelKeyOrUrl?.includes('github.com/mrdoob/three.js/master/examples');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-2xl text-gray-900 dark:text-white">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">素材库管理</h1>

        {/* 筛选和操作栏 */}
        <div className="mb-8 flex gap-4 items-center">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white"
          >
            <option value="">全部类型</option>
            {MATERIAL_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setShowAddForm(true);
              resetForm();
            }}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            添加素材
          </button>
        </div>

        {/* 添加素材弹窗 */}
        {showAddForm && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="bg-white dark:bg-black rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-800">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">添加新素材</h2>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      resetForm();
                    }}
                    className="text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white text-2xl"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* 模型来源选择 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                      模型来源 <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-4 mb-3">
                      <button
                        type="button"
                        onClick={() => {
                          setUseUpload(true);
                          setFormData({ ...formData, modelKey: '' });
                          setFile(null);
                        }}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          useUpload
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-950 text-gray-700 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-900'
                        }`}
                      >
                        上传文件
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUseUpload(false);
                          setFile(null);
                        }}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          !useUpload
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-950 text-gray-700 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-900'
                        }`}
                      >
                        手动填写 Key
                      </button>
                    </div>
                  </div>

                  {/* 上传模型文件 */}
                  {useUpload && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                        上传 3D 模型文件
                      </label>
                      <div className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg p-4">
                        <input
                          type="file"
                          accept=".glb,.gltf,.obj"
                          onChange={async (e) => {
                            const selectedFile = e.target.files?.[0] || null;
                            setFile(selectedFile);
                            if (selectedFile) {
                              // 选择文件后自动上传
                              await handleFileUpload(selectedFile);
                            }
                          }}
                          className="w-full"
                          disabled={uploading}
                        />
                        {uploading && (
                          <div className="mt-2 text-sm text-blue-600 dark:text-blue-400 animate-pulse">
                            正在上传模型，请稍候...
                          </div>
                        )}
                        {formData.modelKey && (
                          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg">
                            <div className="text-sm text-green-800 dark:text-green-600 font-medium">✓ 模型已上传</div>
                            <div className="text-xs text-green-700 dark:text-green-500 mt-1 font-mono break-all">
                              Key: {formData.modelKey}
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                        支持格式：.glb, .gltf, .obj。上传成功后模型 Key 会自动生成并保存。
                        <br />
                        <span className="text-yellow-600 dark:text-yellow-500">注意：系统会自动处理中文文件名，转换为安全格式存储。</span>
                      </p>
                    </div>
                  )}

                  {/* 手动填写模型 Key */}
                  {!useUpload && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                        模型 Key <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.modelKey}
                        onChange={(e) => setFormData({ ...formData, modelKey: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white"
                        placeholder="输入模型 Key 或 geometry:// 类型"
                        required
                      />
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
                        <strong>内置几何体示例：</strong>
                        <br />
                        <code className="bg-gray-100 dark:bg-gray-950 px-1 py-0.5 rounded text-xs">
                          geometry://cone-plant-1
                        </code>{' '}
                        （水草）
                        <br />
                        <code className="bg-gray-100 dark:bg-gray-950 px-1 py-0.5 rounded text-xs">
                          geometry://capsule-fish-1
                        </code>{' '}
                        （鱼类）
                        <br />
                        <code className="bg-gray-100 dark:bg-gray-950 px-1 py-0.5 rounded text-xs">
                          geometry://cylinder-wood-1
                        </code>{' '}
                        （沉木）
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                      名称 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                      类型 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white"
                      required
                    >
                      {MATERIAL_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                      缩略图 URL（可选）
                    </label>
                    <input
                      type="text"
                      value={formData.thumbnailUrl}
                      onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                      描述（可选）
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={!formData.name || !formData.modelKey}
                      className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      创建素材
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        resetForm();
                      }}
                      className="px-6 py-3 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-950 transition-colors"
                    >
                      取消
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* 编辑素材弹窗 */}
        {editing && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="bg-white dark:bg-black rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-800">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">编辑素材</h2>
                  <button
                    onClick={() => setEditing(null)}
                    className="text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white text-2xl"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleUpdate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                      名称
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                      类型
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white"
                      required
                    >
                      {MATERIAL_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                      模型 Key
                    </label>
                    <input
                      type="text"
                      value={formData.modelKey}
                      onChange={(e) => setFormData({ ...formData, modelKey: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white"
                      required
                    />
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                      如需更换模型，请上传新文件后会自动更新此字段
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                      缩略图 URL
                    </label>
                    <input
                      type="text"
                      value={formData.thumbnailUrl}
                      onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                      描述
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      保存修改
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(null)}
                      className="px-6 py-3 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-950 transition-colors"
                    >
                      取消
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* 素材列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {materials.map((material) => (
            <div
              key={material.id}
              className="bg-white dark:bg-black rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow"
            >
              {/* 预览区域 */}
              <div className="aspect-square bg-gray-50 dark:bg-gray-950 p-4">
                {material.thumbnailUrl ? (
                  <img
                    src={material.thumbnailUrl}
                    alt={material.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : useGeometry(material.modelKey || material.modelUrl || '') ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <GeometryPreview type={material.type} className="w-32 h-32" />
                  </div>
                ) : (
                  <div className="w-full h-full bg-gray-100 dark:bg-gray-900 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-600">
                    无预览
                  </div>
                )}
              </div>

              {/* 信息区域 */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{material.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-500 mb-2 capitalize">{material.type}</p>
                {material.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-500 mb-3 line-clamp-2">{material.description}</p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditClick(material)}
                    className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(material.id)}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {materials.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-500 text-lg">暂无素材</p>
            <p className="text-gray-400 dark:text-gray-600 mt-2">点击上方"添加素材"按钮创建第一个素材</p>
          </div>
        )}
      </div>
    </div>
  );
}
