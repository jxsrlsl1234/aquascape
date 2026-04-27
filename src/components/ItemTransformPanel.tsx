'use client';

import React from 'react';

interface ItemTransformPanelProps {
  item: {
    id: string;
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
    type: string;
  };
  aquariumDimensions: {
    length: number;
    width: number;
    height: number;
  };
  onUpdate: (itemId: string, updates: {
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: [number, number, number];
  }) => void;
  onClose: () => void;
}

export default function ItemTransformPanel({ item, aquariumDimensions, onUpdate, onClose }: ItemTransformPanelProps) {
  const handleRotationChange = (axis: 0 | 1 | 2, value: number) => {
    const newRotation: [number, number, number] = [...item.rotation];
    newRotation[axis] = value;
    onUpdate(item.id, { rotation: newRotation });
  };

  const handleScaleChange = (axis: 0 | 1 | 2, value: number) => {
    const newScale: [number, number, number] = [...item.scale];
    newScale[axis] = Math.max(0.1, Math.min(5, value));
    onUpdate(item.id, { scale: newScale });
  };

  const handlePositionChange = (axis: 0 | 1 | 2, value: number) => {
    const newPosition: [number, number, number] = [...item.position];
    newPosition[axis] = value;
    onUpdate(item.id, { position: newPosition });
  };

  const handleResetScale = () => {
    onUpdate(item.id, { scale: [1, 1, 1] });
  };

  const handleResetRotation = () => {
    onUpdate(item.id, { rotation: [0, 0, 0] });
  };

  const handleLockScale = () => {
    // 等比缩放：使用X轴的缩放值应用到所有轴
    const scaleValue = item.scale[0];
    onUpdate(item.id, { scale: [scaleValue, scaleValue, scaleValue] });
  };

  const handleFitToBottom = () => {
    // 将sand类元素贴合鱼缸底部
    // sand使用OctahedronGeometry(0.05)，半径为0.05米，未缩放高度为0.1米
    const { length, width, height } = aquariumDimensions;

    // 转换为米
    const lengthM = length / 100;
    const widthM = width / 100;
    const heightM = height / 100;
    const sandRadius = 0.05;

    // 计算贴合底部的缩放比例
    // 要求1：底沙的长宽与鱼缸底部的长宽一致
    // 几何体从-sandRadius到+sandRadius，宽度为2*sandRadius
    // 要覆盖长度lengthM，需要：scaleX * 2 * sandRadius = lengthM
    const scaleX = lengthM / (2 * sandRadius);
    const scaleZ = widthM / (2 * sandRadius);

    // 要求2：高度默认设置为鱼缸高度的 1/10
    // 几何体未缩放高度为0.1米（2 * sandRadius）
    // 要达到heightM / 10的高度，需要：scaleY * 0.1 = heightM / 10
    const scaleY = heightM;

    // 要求3：位置放置在鱼缸底部正上方，距离鱼缸底部高度0cm
    // 鱼缸底部位置：-heightM / 2
    // 几何体在未缩放时，底部在-sandRadius
    // 缩放后，底部在 -scaleY * sandRadius
    // 要让sand底部与鱼缸底部对齐，需要：positionY - scaleY * sandRadius = -heightM / 2
    const positionY = -heightM / 2 + scaleY * sandRadius;

    // 位置在鱼缸底部正上方（X=0, Z=0）
    onUpdate(item.id, {
      position: [0, positionY, 0],
      rotation: [0, 0, 0],
      scale: [scaleX, scaleY, scaleZ],
    });
  };

  return (
    <div className="fixed right-4 top-4 z-20 bg-white dark:bg-black p-5 rounded-xl shadow-lg w-72 border border-gray-200 dark:border-gray-800">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">素材变换</h3>
        <button
          onClick={onClose}
          className="text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white text-xl leading-none"
        >
          ×
        </button>
      </div>

      {/* Sand类元素专属：贴合鱼缸底部 */}
      {item.type === 'sand' && (
        <div className="mb-4">
          <button
            onClick={handleFitToBottom}
            className="w-full px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg transition-colors"
          >
            贴合鱼缸底部
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            自动调整尺寸以贴合鱼缸底部，并放置在鱼缸底部
          </p>
        </div>
      )}

      {/* 旋转控制 */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-400">旋转</h4>
          <button
            onClick={handleResetRotation}
            className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-950 text-gray-700 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-900 rounded transition-colors"
          >
            重置
          </button>
        </div>

        {/* 快捷旋转按钮（水平/垂直） */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => handleRotationChange(0, 0)}
            className="flex-1 py-1 text-xs bg-gray-100 dark:bg-gray-950 text-gray-700 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-900 rounded transition-colors"
            title="水平重置"
          >
            0°
          </button>
          <button
            onClick={() => handleRotationChange(1, 0)}
            className="flex-1 py-1 text-xs bg-gray-100 dark:bg-gray-950 text-gray-700 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-900 rounded transition-colors"
            title="垂直重置"
          >
            0°
          </button>
          <button
            onClick={() => handleRotationChange(0, Math.PI / 2)}
            className="flex-1 py-1 text-xs bg-gray-100 dark:bg-gray-950 text-gray-700 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-900 rounded transition-colors"
            title="旋转90°"
          >
            90°
          </button>
          <button
            onClick={() => handleRotationChange(0, Math.PI)}
            className="flex-1 py-1 text-xs bg-gray-100 dark:bg-gray-950 text-gray-700 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-900 rounded transition-colors"
            title="旋转180°"
          >
            180°
          </button>
          <button
            onClick={() => handleRotationChange(0, Math.PI * 1.5)}
            className="flex-1 py-1 text-xs bg-gray-100 dark:bg-gray-950 text-gray-700 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-900 rounded transition-colors"
            title="旋转270°"
          >
            270°
          </button>
        </div>

        <div className="space-y-3">
          {/* X轴旋转 */}
          <div>
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-500 mb-1">
              <span>水平旋转 (X)</span>
              <span>{(item.rotation[0] * 180 / Math.PI).toFixed(0)}°</span>
            </div>
            <input
              type="range"
              min={0}
              max={Math.PI * 2}
              step={0.01}
              value={item.rotation[0]}
              onChange={(e) => handleRotationChange(0, parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Y轴旋转 */}
          <div>
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-500 mb-1">
              <span>垂直旋转 (Y)</span>
              <span>{(item.rotation[1] * 180 / Math.PI).toFixed(0)}°</span>
            </div>
            <input
              type="range"
              min={0}
              max={Math.PI * 2}
              step={0.01}
              value={item.rotation[1]}
              onChange={(e) => handleRotationChange(1, parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Z轴旋转 */}
          <div>
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-500 mb-1">
              <span>深度旋转 (Z)</span>
              <span>{(item.rotation[2] * 180 / Math.PI).toFixed(0)}°</span>
            </div>
            <input
              type="range"
              min={0}
              max={Math.PI * 2}
              step={0.01}
              value={item.rotation[2]}
              onChange={(e) => handleRotationChange(2, parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 缩放控制 */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-400">缩放</h4>
          <div className="flex gap-2">
            <button
              onClick={handleLockScale}
              className="text-xs px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded transition-colors"
              title="等比缩放"
            >
              锁定
            </button>
            <button
              onClick={handleResetScale}
              className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-950 text-gray-700 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-900 rounded transition-colors"
            >
              重置
            </button>
          </div>
        </div>

        {/* 快捷缩放按钮 */}
        <div className="flex gap-2 mb-3">
          {[0.5, 0.75, 1, 1.5, 2].map(scale => (
            <button
              key={scale}
              onClick={() => onUpdate(item.id, { scale: [scale, scale, scale] })}
              className={`flex-1 py-1 text-xs rounded transition-colors ${
                item.scale[0] === scale
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-950 text-gray-700 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-900'
              }`}
            >
              {scale}x
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {/* X轴缩放 */}
          <div>
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-500 mb-1">
              <span>X 轴</span>
              <span>{item.scale[0].toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min={0.1}
              max={5}
              step={0.1}
              value={item.scale[0]}
              onChange={(e) => handleScaleChange(0, parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Y轴缩放 */}
          <div>
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-500 mb-1">
              <span>Y 轴</span>
              <span>{item.scale[1].toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min={0.1}
              max={5}
              step={0.1}
              value={item.scale[1]}
              onChange={(e) => handleScaleChange(1, parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Z轴缩放 */}
          <div>
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-500 mb-1">
              <span>Z 轴</span>
              <span>{item.scale[2].toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min={0.1}
              max={5}
              step={0.1}
              value={item.scale[2]}
              onChange={(e) => handleScaleChange(2, parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 位置控制 */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-400 mb-3">位置</h4>
        <div className="space-y-3">
          {/* X轴 - 左右 */}
          <div>
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-500 mb-1">
              <span>水平 (X)</span>
              <span>{item.position[0].toFixed(2)}m</span>
            </div>
            <input
              type="range"
              min={-5}
              max={5}
              step={0.05}
              value={item.position[0]}
              onChange={(e) => handlePositionChange(0, parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Y轴 - 深度 */}
          <div>
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-500 mb-1">
              <span>深度 (Y)</span>
              <span>{item.position[1].toFixed(2)}m</span>
            </div>
            <input
              type="range"
              min={-5}
              max={5}
              step={0.05}
              value={item.position[1]}
              onChange={(e) => handlePositionChange(1, parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Z轴 - 垂直 */}
          <div>
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-500 mb-1">
              <span>垂直 (Z)</span>
              <span>{item.position[2].toFixed(2)}m</span>
            </div>
            <input
              type="range"
              min={-5}
              max={5}
              step={0.05}
              value={item.position[2]}
              onChange={(e) => handlePositionChange(2, parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 快捷键提示 */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-500">
        <div className="font-semibold mb-1">快捷键:</div>
        <div>• 普通拖拽：移动水平+垂直</div>
        <div>• Shift+拖拽：移动深度</div>
        <div>• 滚轮：等比缩放</div>
        <div>• Delete/Backspace：删除素材</div>
      </div>
    </div>
  );
}
