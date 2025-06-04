'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setError('');
  //   setIsLoading(true);

  //   try {
  //     await login(username, password);
  //     router.push('/dashboard');
  //   } catch (err: any) {
  //     setError(err.response?.data?.message || '登录失败，请检查用户名和密码');
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };
  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setIsLoading(true);

  try {
    await login(username, password);
    router.push('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      // 增强错误处理，显示更详细的错误信息
      if (err.response) {
        // 服务器响应了请求，但状态码不是2xx
        setError(err.response.data?.message || `登录失败 (${err.response.status})`);
      } else if (err.request) {
        // 请求已发送但没有收到响应
        setError('无法连接到服务器，请检查网络连接或后端服务是否运行');
      } else {
        // 请求设置时出现问题
        setError(`登录请求错误: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-8 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center mb-6">登录 DietLens</h1>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="username" className="block text-gray-700 mb-2">
            用户名
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="password" className="block text-gray-700 mb-2">
            密码
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-emerald-600 text-white py-2 px-4 rounded hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50 disabled:opacity-50"
        >
          {isLoading ? '登录中...' : '登录'}
        </button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-gray-600">
          还没有账号？{' '}
          <Link href="/auth/register" className="text-emerald-600 hover:text-emerald-800">
            立即注册
          </Link>
        </p>
      </div>
    </div>
  );
}
