import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { AxiosError } from 'axios';
import api from '../lib/api';
import { CircleAlert } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.success) {
        const { token, user } = response.data.data;
        login(token, user);
        navigate('/authorization-center');
      }
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setError(axiosErr.response?.data?.message || '登录失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">登录 Beacon Auth</h2>
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md flex items-center mb-4 text-sm">
          <CircleAlert className="w-4 h-4 mr-2" />{error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">邮箱地址</label>
          <input type="email" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
          <input type="password" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button type="submit" disabled={isLoading}
          className="w-full bg-emerald-600 text-white py-2 rounded-md hover:bg-emerald-700 transition disabled:opacity-50 font-medium">
          {isLoading ? '登录中...' : '立即登录'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-600">
        还没有账号？ <Link to="/register" className="text-emerald-600 hover:text-emerald-700 font-medium">立即注册</Link>
      </p>
    </div>
  );
};

export default Login;
