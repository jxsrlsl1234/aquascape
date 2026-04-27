'use client';

import { useState } from 'react';

interface ItemEditorProps {
  item?: {
    id: string;
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
  };
  onUpdate: (itemId: string, updates: {
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: [number, number, number];
  }) => void;
  onClose: () => void;
}

export default function ItemEditor({ item, onUpdate, onClose }: ItemEditorProps) {
  if (!item) return null;

  const [position, setPosition] = useState(item.position);
  const [rotation, setRotation] = useState(item.rotation);
  const [scale, setScale] = useState(item.scale);

  const handleUpdate = () => {
    onUpdate(item.id, { position, rotation, scale });
  };

  return (
    <div className="fixed top-4 right-80 w-72 bg-white dark:bg-black rounded-xl shadow-lg p-6 z-20 border border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">编辑元素</h3>
        <button
          onClick={onClose}
          className="text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white text-2xl leading-none"
        >
          ×
        </button>
      </div>

      {/* 位置控制 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">位置</label>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-500 mb-1">X</label>
            <input
              type="number"
              step="0.1"
              value={position[0]}
              onChange={(e) => setPosition([parseFloat(e.target.value) || 0, position[1], position[2]])}
              className="w-full px-2 py-1 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded text-sm text-gray-900 dark:text-white"
              onBlur={handleUpdate}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-500 mb-1">Y</label>
            <input
              type="number"
              step="0.1"
              value={position[1]}
              onChange={(e) => setPosition([position[0], parseFloat(e.target.value) || 0, position[2]])}
              className="w-full px-2 py-1 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded text-sm text-gray-900 dark:text-white"
              onBlur={handleUpdate}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-500 mb-1">Z</label>
            <input
              type="number"
              step="0.1"
              value={position[2]}
              onChange={(e) => setPosition([position[0], position[1], parseFloat(e.target.value) || 0])}
              className="w-full px-2 py-1 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded text-sm text-gray-900 dark:text-white"
              onBlur={handleUpdate}
            />
          </div>
        </div>
      </div>

      {/* 旋转控制 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">旋转 (度)</label>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-500 mb-1">X</label>
            <input
              type="number"
              step="5"
              value={Math.round(rotation[0] * 180 / Math.PI)}
              onChange={(e) => setRotation([parseFloat(e.target.value) * Math.PI / 180, rotation[1], rotation[2]])}
              className="w-full px-2 py-1 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded text-sm text-gray-900 dark:text-white"
              onBlur={handleUpdate}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-500 mb-1">Y</label>
            <input
              type="number"
              step="5"
              value={Math.round(rotation[1] * 180 / Math.PI)}
              onChange={(e) => setRotation([rotation[0], parseFloat(e.target.value) * Math.PI / 180, rotation[2]])}
              className="w-full px-2 py-1 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded text-sm text-gray-900 dark:text-white"
              onBlur={handleUpdate}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-500 mb-1">Z</label>
            <input
              type="number"
              step="5"
              value={Math.round(rotation[2] * 180 / Math.PI)}
              onChange={(e) => setRotation([rotation[0], rotation[1], parseFloat(e.target.value) * Math.PI / 180])}
              className="w-full px-2 py-1 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded text-sm text-gray-900 dark:text-white"
              onBlur={handleUpdate}
            />
          </div>
        </div>
      </div>

      {/* 缩放控制 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">缩放</label>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-500 mb-1">X</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="10"
              value={scale[0]}
              onChange={(e) => setScale([parseFloat(e.target.value) || 1, scale[1], scale[2]])}
              className="w-full px-2 py-1 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded text-sm text-gray-900 dark:text-white"
              onBlur={handleUpdate}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-500 mb-1">Y</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="10"
              value={scale[1]}
              onChange={(e) => setScale([scale[0], parseFloat(e.target.value) || 1, scale[2]])}
              className="w-full px-2 py-1 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded text-sm text-gray-900 dark:text-white"
              onBlur={handleUpdate}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-500 mb-1">Z</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="10"
              value={scale[2]}
              onChange={(e) => setScale([scale[0], scale[1], parseFloat(e.target.value) || 1])}
              className="w-full px-2 py-1 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded text-sm text-gray-900 dark:text-white"
              onBlur={handleUpdate}
            />
          </div>
        </div>

        {/* 统一缩放 */}
        <div className="mt-2">
          <label className="block text-xs text-gray-500 dark:text-gray-500 mb-1">统一缩放</label>
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={scale[0]}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              setScale([value, value, value]);
              onUpdate(item.id, { scale: [value, value, value] });
            }}
            className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>

      {/* 快捷操作 */}
      <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
        <div className="text-xs text-gray-500 dark:text-gray-500 mb-2">快捷操作</div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              const newScale: [number, number, number] = [scale[0] * 0.9, scale[1] * 0.9, scale[2] * 0.9];
              setScale(newScale);
              onUpdate(item.id, { scale: newScale });
            }}
            className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-950 hover:bg-gray-200 dark:hover:bg-gray-900 rounded text-gray-700 dark:text-gray-500 transition-colors"
          >
            缩小 10%
          </button>
          <button
            onClick={() => {
              const newScale: [number, number, number] = [scale[0] * 1.1, scale[1] * 1.1, scale[2] * 1.1];
              setScale(newScale);
              onUpdate(item.id, { scale: newScale });
            }}
            className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-950 hover:bg-gray-200 dark:hover:bg-gray-900 rounded text-gray-700 dark:text-gray-500 transition-colors"
          >
            放大 10%
          </button>
          <button
            onClick={() => {
              setScale([1, 1, 1]);
              onUpdate(item.id, { scale: [1, 1, 1] });
            }}
            className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-950 hover:bg-gray-200 dark:hover:bg-gray-900 rounded text-gray-700 dark:text-gray-500 transition-colors"
          >
            重置大小
          </button>
          <button
            onClick={() => {
              setRotation([0, 0, 0]);
              onUpdate(item.id, { rotation: [0, 0, 0] });
            }}
            className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-950 hover:bg-gray-200 dark:hover:bg-gray-900 rounded text-gray-700 dark:text-gray-500 transition-colors"
          >
            重置旋转
          </button>
        </div>
      </div>
    </div>
  );
}
