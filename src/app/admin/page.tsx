'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalAquariums: number;
  totalVersions: number;
  newUserTrend: Array<{ date: string; count: number }>;
  loginTrend: Array<{ date: string; count: number }>;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { admin, logout, token } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // 检查管理员登录状态
    if (!admin) {
      router.push('/admin/login');
      return;
    }

    fetchStats();
  }, [admin, router]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/stats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (data.success) {
        setStats(data.data);
      } else {
        setError(data.error || '获取数据失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      // 这里应该上传到对象存储，为了演示，我们使用Base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });

      // 保存配置
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          configKey: 'hero_image_url',
          configValue: base64,
          description: '首页Hero区域背景图片URL',
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert('图片上传成功！');
      } else {
        setError(data.error || '上传失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-2xl font-bold text-white">
                AquaCube
              </Link>
              <span className="text-gray-400">/</span>
              <span className="text-gray-300">后台管理</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-300">{admin?.name || '管理员'}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-all"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-800 text-red-400 rounded-lg">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <div className="text-gray-400 text-sm mb-2">用户总量</div>
            <div className="text-4xl font-bold text-white mb-2">{stats?.totalUsers || 0}</div>
            <div className="text-green-400 text-sm">总注册用户</div>
          </div>

          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <div className="text-gray-400 text-sm mb-2">活跃用户</div>
            <div className="text-4xl font-bold text-white mb-2">{stats?.activeUsers || 0}</div>
            <div className="text-blue-400 text-sm">最近7天</div>
          </div>

          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <div className="text-gray-400 text-sm mb-2">应用数</div>
            <div className="text-4xl font-bold text-white mb-2">{stats?.totalAquariums || 0}</div>
            <div className="text-purple-400 text-sm">鱼缸项目</div>
          </div>

          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <div className="text-gray-400 text-sm mb-2">版本数</div>
            <div className="text-4xl font-bold text-white mb-2">{stats?.totalVersions || 0}</div>
            <div className="text-orange-400 text-sm">项目版本</div>
          </div>
        </div>

        {/* Homepage Config */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 mb-8">
          <h2 className="text-xl font-semibold text-white mb-6">首页配置</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Hero背景图片
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="flex-1 text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:disabled:opacity-50 disabled:opacity-50"
                />
                {uploading && (
                  <span className="text-gray-400 text-sm">上传中...</span>
                )}
              </div>
              <p className="text-gray-500 text-xs mt-2">支持JPG、PNG等格式，建议尺寸16:9</p>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-6">快捷操作</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/"
              className="flex items-center gap-3 p-4 bg-gray-700 hover:bg-gray-600 rounded-xl transition-all"
            >
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-white">查看首页</span>
            </Link>
            <Link
              href="/aquarium"
              className="flex items-center gap-3 p-4 bg-gray-700 hover:bg-gray-600 rounded-xl transition-all"
            >
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span className="text-white">进入创作</span>
            </Link>
            <button
              onClick={fetchStats}
              className="flex items-center gap-3 p-4 bg-gray-700 hover:bg-gray-600 rounded-xl transition-all w-full"
            >
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-white">刷新数据</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
