'use client';

import { useState } from 'react';
import ThemeToggle from './ThemeToggle';

interface MenuBarProps {
  onSaveVersion?: () => void;
  onVersionManage?: () => void;
  onMaterialManage?: () => void;
  onClearAll?: () => void;
}

interface MenuItem {
  label: string;
  action?: () => void;
  children?: MenuItem[];
  divider?: boolean;
}

export default function MenuBar({
  onSaveVersion,
  onVersionManage,
  onMaterialManage,
  onClearAll,
}: MenuBarProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const menus = [
    {
      label: '文件',
      items: [
        {
          label: '保存版本',
          action: onSaveVersion,
          shortcut: 'Ctrl+S',
        },
        {
          label: '管理版本',
          action: onVersionManage,
          shortcut: 'Ctrl+K',
        },
        { divider: true },
        {
          label: '清空鱼缸',
          action: onClearAll,
        },
      ],
    },
    {
      label: '素材',
      items: [
        {
          label: '素材库管理',
          action: onMaterialManage,
          shortcut: 'Ctrl+M',
        },
      ],
    },
    {
      label: '视图',
      items: [
        {
          label: '重置视角',
          action: () => console.log('Reset camera'),
        },
        {
          label: '显示网格',
          action: () => console.log('Toggle grid'),
        },
      ],
    },
    {
      label: '帮助',
      items: [
        {
          label: '快捷键',
          action: () => console.log('Shortcuts'),
        },
        {
          label: '关于',
          action: () => console.log('About'),
        },
      ],
    },
  ];

  return (
    <div className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-full mx-auto px-4">
        <div className="flex items-center h-10 space-x-1">
          {/* Logo */}
          <div className="flex items-center px-2 mr-4 text-blue-600">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
            </svg>
            <span className="font-bold text-sm">AquaCube</span>
          </div>

          {/* Menu Items */}
          {menus.map((menu, menuIndex) => (
            <div
              key={menu.label}
              className="relative"
              onMouseEnter={() => setActiveMenu(menu.label)}
              onMouseLeave={() => setActiveMenu(null)}
            >
              <button className="px-3 py-2 text-sm text-gray-900 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-900 rounded transition-colors">
                {menu.label}
              </button>

              {activeMenu === menu.label && (
                <div className="absolute top-full left-0 mt-0 w-48 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-md shadow-lg z-50">
                  {menu.items.map((item, itemIndex) => (
                    <div key={itemIndex}>
                      {item.divider ? (
                        <div className="border-t border-gray-200 dark:border-gray-800 my-1" />
                      ) : (
                        <button
                          onClick={() => {
                            item.action?.();
                            setActiveMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-sm text-gray-900 dark:text-gray-400 hover:text-white dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-900 text-left flex items-center justify-between transition-colors"
                        >
                          <span>{item.label}</span>
                          {item.shortcut && (
                            <span className="text-xs text-gray-500 dark:text-gray-500">{item.shortcut}</span>
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Theme Toggle */}
          <div className="ml-auto pl-4 border-l border-gray-200 dark:border-gray-800">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  );
}
