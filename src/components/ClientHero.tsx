'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function ClientHero() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="pt-32 pb-20 px-6 bg-white dark:bg-black">
      <div className="max-w-[1440px] mx-auto">
        <div className="text-center space-y-8">
          <h1 className="text-gray-900 dark:text-white text-5xl md:text-7xl font-semibold tracking-tight">
            打造您的专属
            <span className="block mt-3 text-blue-600">
              梦幻水族箱
            </span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed">
            专业的3D鱼缸设计工具，支持自定义尺寸、真实物理材质、海量素材库，让您轻松创建令人惊叹的水族造景
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Link
              href={isAuthenticated ? '/aquarium' : '/login'}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full text-lg font-medium transition-colors"
            >
              立即开始
            </Link>
            <Link
              href="#features"
              className="border border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300 px-8 py-4 rounded-full text-lg font-medium transition-colors"
            >
              了解更多
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
