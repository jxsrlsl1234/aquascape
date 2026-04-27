'use client';

interface PropertiesPanelProps {
  length: number;
  width: number;
  height: number;
  glassThickness: number;
  waterLevel: number;
  onLengthChange: (value: number) => void;
  onWidthChange: (value: number) => void;
  onHeightChange: (value: number) => void;
  onGlassThicknessChange: (value: number) => void;
  onWaterLevelChange: (value: number) => void;
}

export default function PropertiesPanel({
  length,
  width,
  height,
  glassThickness,
  waterLevel,
  onLengthChange,
  onWidthChange,
  onHeightChange,
  onGlassThicknessChange,
  onWaterLevelChange,
}: PropertiesPanelProps) {
  const volume = (length * width * height) / 1000; // 转换为升
  const waterPercentage = (waterLevel / height * 100).toFixed(0);

  return (
    <div className="w-72 bg-white dark:bg-black border-r border-gray-200 dark:border-gray-800 flex flex-col h-[calc(100vh-40px)]">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-gray-900 dark:text-white font-semibold text-sm">鱼缸属性</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 尺寸设置 */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wide">
            尺寸
          </h3>

          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1.5">
              长度 (cm)
            </label>
            <input
              type="number"
              value={length}
              onChange={(e) => onLengthChange(parseFloat(e.target.value) || 100)}
              min="30"
              max="1000"
              step="1"
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1.5">
              宽度 (cm)
            </label>
            <input
              type="number"
              value={width}
              onChange={(e) => onWidthChange(parseFloat(e.target.value) || 100)}
              min="30"
              max="1000"
              step="1"
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1.5">
              高度 (cm)
            </label>
            <input
              type="number"
              value={height}
              onChange={(e) => onHeightChange(parseFloat(e.target.value) || 100)}
              min="30"
              max="1000"
              step="1"
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* 水位设置 */}
        <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-800">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wide">
            水位
          </h3>

          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1.5">
              水面高度 (cm)
            </label>
            <input
              type="number"
              value={waterLevel}
              onChange={(e) => onWaterLevelChange(parseFloat(e.target.value) || 50)}
              min="10"
              max={height}
              step="1"
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent focus:outline-none transition-all"
            />
          </div>
          <div className="px-3 py-2 bg-gray-50 dark:bg-gray-950 rounded">
            <div className="flex justify-between text-xs text-gray-700 dark:text-gray-400">
              <span>水位百分比</span>
              <span className="text-blue-600 dark:text-blue-400 font-medium">{waterPercentage}%</span>
            </div>
            <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all"
                style={{ width: `${waterPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* 玻璃设置 */}
        <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-800">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wide">
            玻璃
          </h3>

          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1.5">
              玻璃厚度 (cm)
            </label>
            <input
              type="number"
              value={glassThickness}
              onChange={(e) => onGlassThicknessChange(parseFloat(e.target.value) || 1)}
              min="0.3"
              max="3"
              step="0.1"
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* 统计信息 */}
        <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-800">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wide">
            统计
          </h3>

          <div className="px-3 py-2 bg-gray-50 dark:bg-gray-950 rounded space-y-2">
            <div className="flex justify-between text-xs text-gray-700 dark:text-gray-400">
              <span>总体积</span>
              <span className="text-green-600 dark:text-green-400 font-medium">{volume.toFixed(2)} L</span>
            </div>
          </div>
        </div>

        {/* 快捷键提示 */}
        <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wide mb-3">
            操作提示
          </h3>
          <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-500">
            <div>• 左键拖动: 旋转视角/移动素材</div>
            <div>• 右键拖动: 平移视角</div>
            <div>• 滚轮: 缩放视角/缩放素材</div>
            <div>• Shift+拖动: 深度移动</div>
            <div>• 点击素材: 选中编辑</div>
          </div>
        </div>
      </div>
    </div>
  );
}
