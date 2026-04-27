'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';

export default function LoginPage() {
  const router = useRouter();
  const [loginType, setLoginType] = useState<'phone' | 'wechat'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 发送验证码
  const handleSendCode = async () => {
    if (!phone) {
      setError('请输入手机号');
      return;
    }
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      setError('手机号格式不正确');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();

      if (data.success) {
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        setError('');
      } else {
        setError(data.error || '发送验证码失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 手机号登录
  const handlePhoneLogin = async () => {
    if (!phone || !code) {
      setError('请输入手机号和验证码');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/phone-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        router.push('/aquarium');
      } else {
        setError(data.error || '登录失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 微信登录（模拟）
  const handleWechatLogin = () => {
    setLoading(true);
    setTimeout(async () => {
      try {
        const res = await fetch('/api/auth/wechat-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: 'mock_code',
            userInfo: {
              nickname: '微信用户',
              avatar: '',
            },
          }),
        });
        const data = await res.json();

        if (data.success) {
          localStorage.setItem('token', data.data.token);
          localStorage.setItem('user', JSON.stringify(data.data.user));
          router.push('/aquarium');
        } else {
          setError(data.error || '微信登录失败');
        }
      } catch (err) {
        setError('网络错误，请稍后重试');
      } finally {
        setLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 导航栏 */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="text-gray-900 dark:text-white text-xl font-semibold tracking-tight">
            AquaCube
          </Link>
          <ThemeToggle />
        </div>

        {/* 登录表单 */}
        <div className="bg-white dark:bg-black">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">
            登录
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            登录以开始创作
          </p>

          {/* 登录方式切换 */}
          <div className="flex mb-8 bg-gray-100 dark:bg-gray-900 rounded-full p-1">
            <button
              onClick={() => setLoginType('phone')}
              className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-colors ${
                loginType === 'phone'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              手机号登录
            </button>
            <button
              onClick={() => setLoginType('wechat')}
              className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-colors ${
                loginType === 'wechat'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              微信登录
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm border border-red-200 dark:border-red-900/30">
              {error}
            </div>
          )}

          {/* 手机号登录表单 */}
          {loginType === 'phone' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-2">
                  手机号
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="请输入手机号"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent dark:text-white placeholder-gray-500 transition-all"
                  maxLength={11}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-2">
                  验证码
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="请输入验证码"
                    className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent dark:text-white placeholder-gray-500 transition-all"
                    maxLength={6}
                  />
                  <button
                    onClick={handleSendCode}
                    disabled={countdown > 0 || loading}
                    className="px-6 py-3 bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[120px]"
                  >
                    {countdown > 0 ? `${countdown}s` : '获取验证码'}
                  </button>
                </div>
              </div>

              <button
                onClick={handlePhoneLogin}
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '登录中...' : '登录'}
              </button>
            </div>
          )}

          {/* 微信登录 */}
          {loginType === 'wechat' && (
            <div className="space-y-4">
              <button
                onClick={handleWechatLogin}
                disabled={loading}
                className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.5,13.5c-3.5,0-6.5-2.5-6.5-5.5c0-3,2.9-5.5,6.5-5.5s6.5,2.5,6.5,5.5C15,11,12,13.5,8.5,13.5z M8.5,3.5C4.9,3.5,2,5.6,2,8.3c0,1.5,0.8,2.8,2,3.8c0.1,0,0.1,0.1,0.1,0.2l-0.4,1.5l1.7-0.9c0.5,0.1,1.1,0.2,1.6,0.2c3.6,0,6.5-2.1,6.5-4.8S12.1,3.5,8.5,3.5z M18.5,14.5c-1,0-1.9-0.2-2.8-0.6l-1.9,1l0.5-1.8c-1.3-1.1-2.2-2.5-2.2-4.2c0-3,3.1-5.5,6.9-5.5c3.8,0,6.9,2.5,6.9,5.5S22.3,14.5,18.5,14.5z"/>
                </svg>
                {loading ? '登录中...' : '微信一键登录'}
              </button>
              
              <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                <p>点击上方按钮即可使用微信登录</p>
              </div>
            </div>
          )}

          {/* 返回首页 */}
          <div className="mt-8 text-center">
            <Link
              href="/"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              返回首页
            </Link>
          </div>
        </div>

        {/* 底部提示 */}
        <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-500">
          <p>登录即表示同意《用户协议》和《隐私政策》</p>
        </div>
      </div>
    </div>
  );
}
