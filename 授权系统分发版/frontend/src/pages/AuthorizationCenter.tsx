import React, { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { ShieldCheck, Plus, Server, User, Globe, AlertCircle, HelpCircle, X, Download, Code, Loader2, Trash2 } from 'lucide-react';
import type { AxiosError } from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Authorization {
  id: number;
  user_id: number;
  plugin_id: number;
  plugin_name: string;
  plugin_version: string;
  author_name: string;
  auth_code: string;
  ip_limit: number;
  port_limit: number;
  used_ips: string;
  used_ports: string;
  expires_at: string | null;
  created_at: string;
}

interface Plugin {
  id: number;
  name: string;
  is_paid: boolean;
}

const AuthorizationCenter: React.FC = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'my' | 'grant'>('my');
  const [myAuths, setMyAuths] = useState<Authorization[]>([]);
  const [loading, setLoading] = useState(true);
  const [myPlugins, setMyPlugins] = useState<Plugin[]>([]);
  const [selectedPluginId, setSelectedPluginId] = useState('');
  const [targetUsername, setTargetUsername] = useState('');
  const [ipLimit, setIpLimit] = useState(1);
  const [portLimit, setPortLimit] = useState(1);
  const [expiresIn, setExpiresIn] = useState(0);
  const [grantMessage, setGrantMessage] = useState({ type: '', text: '' });
  const [unbindingId, setUnbindingId] = useState<number | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const fetchMyAuthorizations = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/authorizations/my');
      if (res.data.success) setMyAuths(res.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [user]);

  const fetchMyPlugins = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await api.get('/plugins', { params: { author_id: user.id, is_paid: 'true', limit: 1000 } });
      if (res.data.success) setMyPlugins(res.data.data || []);
    } catch (err) { console.error('Failed to fetch user plugins:', err); }
  }, [user?.id]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { navigate('/login'); return; }
    fetchMyAuthorizations();
    fetchMyPlugins();
  }, [isAuthenticated, authLoading, navigate, fetchMyAuthorizations, fetchMyPlugins]);

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    setGrantMessage({ type: '', text: '' });
    try {
      const res = await api.post('/authorizations/grant', { pluginId: selectedPluginId, username: targetUsername, ipLimit, portLimit, expiresIn: expiresIn || null });
      if (res.data.success) {
        setGrantMessage({ type: 'success', text: `授权成功！授权码: ${res.data.auth_code}` });
        setTargetUsername('');
        fetchMyAuthorizations();
      }
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setGrantMessage({ type: 'error', text: axiosErr.response?.data?.message || '授权失败' });
    }
  };

  const handleUnbind = async (authorizationId: number, type: 'ip' | 'port', value: string) => {
    setUnbindingId(authorizationId);
    try {
      const res = await api.post('/authorizations/unbind', { authorizationId, type, value });
      if (res.data.success) fetchMyAuthorizations();
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      alert(axiosErr.response?.data?.message || '解绑失败');
    } finally { setUnbindingId(null); }
  };

  const parseUsage = (jsonStr: string) => {
    try { const arr = JSON.parse(jsonStr); return Array.isArray(arr) ? arr.length : 0; } catch { return 0; }
  };
  const parseList = (jsonStr: string) => {
    try { const arr = JSON.parse(jsonStr); return Array.isArray(arr) ? (arr as string[]) : []; } catch { return []; }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center">
          <ShieldCheck className="w-8 h-8 mr-3 text-emerald-600" />授权中心
        </h1>
        <button onClick={() => setShowHelp(true)}
          className="flex items-center text-emerald-600 hover:text-emerald-700 font-medium transition-colors bg-emerald-50 px-4 py-2 rounded-lg hover:bg-emerald-100">
          <HelpCircle className="w-5 h-5 mr-2" />使用指南
        </button>
      </div>

      <div className="flex space-x-4 mb-6 border-b border-gray-200">
        <button onClick={() => setActiveTab('my')}
          className={`pb-3 px-4 font-medium transition-colors relative ${activeTab === 'my' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}>我的授权</button>
        <button onClick={() => setActiveTab('grant')}
          className={`pb-3 px-4 font-medium transition-colors relative ${activeTab === 'grant' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}>授权管理</button>
      </div>

      {activeTab === 'my' ? (
        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-10 h-10 text-emerald-600 animate-spin" /></div>
          ) : myAuths.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <p className="text-gray-500">暂无授权记录</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myAuths.map((auth) => (
                <div key={auth.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">{auth.plugin_name}</h3>
                      <p className="text-sm text-gray-500">作者: {auth.author_name}</p>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full">已授权</span>
                  </div>
                  {auth.auth_code && (
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-xs text-amber-700 font-medium mb-1">🔑 授权码</p>
                      <p className="text-sm font-mono font-bold text-amber-800 tracking-wider select-all">{auth.auth_code}</p>
                      <p className="text-xs text-amber-500 mt-1">在 BeaconAuth 插件配置中使用此授权码</p>
                    </div>
                  )}
                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-gray-600 flex items-center"><Globe className="w-4 h-4 mr-2" /> IP 使用量</span>
                        <span className="font-medium">{parseUsage(auth.used_ips)} / {auth.ip_limit}</span>
                      </div>
                      {parseList(auth.used_ips).length > 0 && (
                        <div className="space-y-1 pl-6">
                          {parseList(auth.used_ips).map((ip) => (
                            <div key={ip} className="flex items-center justify-between bg-gray-50 rounded px-2 py-1">
                              <span className="text-xs text-gray-600 font-mono">{ip}</span>
                              <button onClick={() => handleUnbind(auth.id, 'ip', ip)} disabled={unbindingId === auth.id}
                                className="text-red-400 hover:text-red-600 transition-colors p-0.5 hover:bg-red-50 rounded disabled:opacity-50" title="解绑此 IP">
                                {unbindingId === auth.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-gray-600 flex items-center"><Server className="w-4 h-4 mr-2" /> 端口使用量</span>
                        <span className="font-medium">{parseUsage(auth.used_ports)} / {auth.port_limit}</span>
                      </div>
                      {parseList(auth.used_ports).length > 0 && (
                        <div className="space-y-1 pl-6">
                          {parseList(auth.used_ports).map((port) => (
                            <div key={port} className="flex items-center justify-between bg-gray-50 rounded px-2 py-1">
                              <span className="text-xs text-gray-600 font-mono">{port}</span>
                              <button onClick={() => handleUnbind(auth.id, 'port', port)} disabled={unbindingId === auth.id}
                                className="text-red-400 hover:text-red-600 transition-colors p-0.5 hover:bg-red-50 rounded disabled:opacity-50" title="解绑此端口">
                                {unbindingId === auth.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-1">
                    {auth.expires_at ? (
                      new Date(auth.expires_at) > new Date() ? (
                        <div className="text-xs text-amber-600 flex items-center"><AlertCircle className="w-3 h-3 mr-1" />剩余 {Math.ceil((new Date(auth.expires_at).getTime() - Date.now()) / 86400000)} 天（{new Date(auth.expires_at).toLocaleDateString()} 到期）</div>
                      ) : (
                        <div className="text-xs text-red-600 flex items-center font-medium"><AlertCircle className="w-3 h-3 mr-1" />已过期（{new Date(auth.expires_at).toLocaleDateString()}）</div>
                      )
                    ) : (
                      <div className="text-xs text-gray-400 flex items-center"><span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-1.5" />永久有效</div>
                    )}
                    <div className="text-xs text-gray-400">授权时间: {new Date(auth.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center"><Plus className="w-5 h-5 mr-2" />新增授权</h2>
            <form onSubmit={handleGrant} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">选择插件</label>
                <select required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={selectedPluginId} onChange={(e) => setSelectedPluginId(e.target.value)}>
                  <option value="">请选择...</option>
                  {myPlugins.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {myPlugins.length === 0 && <p className="text-xs text-gray-500 mt-2">您还没有发布任何插件。</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">授权用户</label>
                <input type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="请输入用户名" value={targetUsername} onChange={(e) => setTargetUsername(e.target.value)} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IP 数量</label>
                  <input type="number" min="1" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={ipLimit} onChange={(e) => setIpLimit(parseInt(e.target.value))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">端口数量</label>
                  <input type="number" min="1" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={portLimit} onChange={(e) => setPortLimit(parseInt(e.target.value))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">有效期</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    value={expiresIn} onChange={(e) => setExpiresIn(parseInt(e.target.value))}>
                    <option value={0}>永久</option>
                    <option value={7}>7 天</option><option value={15}>15 天</option><option value={30}>30 天</option>
                    <option value={60}>60 天</option><option value={90}>90 天</option><option value={180}>180 天</option><option value={365}>365 天</option>
                  </select>
                </div>
              </div>
              {grantMessage.text && (
                <div className={`p-3 rounded-md text-sm flex items-center ${grantMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  <AlertCircle className="w-4 h-4 mr-2" />{grantMessage.text}
                </div>
              )}
              <button type="submit" className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition font-medium">确认授权</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthorizationCenter;
