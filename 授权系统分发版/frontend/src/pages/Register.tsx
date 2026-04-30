import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { AxiosError } from 'axios';
import api from '../lib/api';
import { CircleAlert, Send, Timer } from 'lucide-react';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendCode = async () => {
    if (!email) { setError('请输入邮箱地址'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('请输入有效的邮箱地址'); return; }
    setError('');
    setIsSendingCode(true);
    try {
      const response = await api.post('/auth/send-code', { email, type: 'register' });
      if (response.data.success) setCountdown(60);
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setError(axiosErr.response?.data?.message || '发送验证码失败');
    } finally { setIsSendingCode(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('两次输入的密码不一致'); return; }
    if (password.length < 6) { setError('密码长度至少为6位'); return; }
    if (!code) { setError('请输入验证码'); return; }
    setIsLoading(true);
    try {
      const response = await api.post('/auth/register', { username, email, password, code });
      if (response.data.success) {
        const { token, ...userData } = response.data.data;
        login(token, userData);
        navigate('/authorization-center');
      }
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setError(axiosErr.response?.data?.message || '注册失败');
    } finally { setIsLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">注册新账号</h2>
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md flex items-center mb-4 text-sm">
          <CircleAlert className="w-4 h-4 mr-2" />{error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
          <input type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">邮箱地址</label>
          <div className="flex gap-2">
            <input type="email" required className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={email} onChange={(e) => setEmail(e.target.value)} />
            <button type="button" onClick={handleSendCode} disabled={countdown > 0 || isSendingCode || !email}
              className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-md hover:bg-emerald-200 transition disabled:opacity-50 whitespace-nowrap min-w-[100px] font-medium text-sm flex items-center justify-center">
              {isSendingCode ? '发送中...' : countdown > 0 ? <><Timer className="w-3 h-3 mr-1" />{countdown}s</> : <><Send className="w-3 h-3 mr-1" />发送验证码</>}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">验证码</label>
          <input type="text" required placeholder="请输入6位验证码" maxLength={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={code} onChange={(e) => setCode(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
          <input type="password" required minLength={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">确认密码</label>
          <input type="password" required minLength={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </div>
        <button type="submit" disabled={isLoading}
          className="w-full bg-emerald-600 text-white py-2 rounded-md hover:bg-emerald-700 transition disabled:opacity-50 font-medium">
          {isLoading ? '注册中...' : '立即注册'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-600">
        已有账号？ <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-medium">直接登录</Link>
      </p>
    </div>
  );
};

export default Register;
