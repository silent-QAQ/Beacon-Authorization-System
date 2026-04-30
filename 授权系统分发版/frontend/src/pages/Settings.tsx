import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { User, Lock, Mail, Save, AlertCircle, CheckCircle, Shield, Bell, MessageSquare, Heart, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { AxiosError } from 'axios';

const Settings: React.FC = () => {
  const { user, refreshUser, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [qqNotificationEnabled, setQqNotificationEnabled] = useState(false);
  const [qqNotificationGroupId, setQqNotificationGroupId] = useState<string | null>(null);
  const [qqNotifyMessage, setQqNotifyMessage] = useState(true);
  const [qqNotifyFollowUpdate, setQqNotifyFollowUpdate] = useState(true);
  const [qqNotifyFollowNew, setQqNotifyFollowNew] = useState(true);
  const [qqMessageDelivery, setQqMessageDelivery] = useState<string>('group');
  const [qqGroups, setQqGroups] = useState<Array<{ group_id: string; group_name: string }>>([]);
  const [loadingQqGroups, setLoadingQqGroups] = useState(false);
  const [savingQqSettings, setSavingQqSettings] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const getErrorMessage = (error: unknown, fallback: string) => { const e = error as AxiosError<{ message?: string }>; return e.response?.data?.message || fallback; };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate('/login');
    if (user) {
      setUsername(user.username);
      setQqNotificationEnabled(!!user.qq_notification_enabled);
      setQqNotificationGroupId(user.qq_notification_group_id);
      setQqNotifyMessage(!!user.qq_notify_message);
      setQqNotifyFollowUpdate(!!user.qq_notify_follow_update);
      setQqNotifyFollowNew(!!user.qq_notify_follow_new);
      setQqMessageDelivery(user.qq_message_delivery || 'group');
    }
  }, [user, isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    if (isAuthenticated && user?.qq_number) loadQQGroups();
  }, [isAuthenticated, user]);

  const loadQQGroups = async () => {
    try {
      setLoadingQqGroups(true);
      const resp = await api.get('/users/me/qq-groups');
      if (resp.data.success) setQqGroups(resp.data.data);
    } catch (error) { console.error(error); }
    finally { setLoadingQqGroups(false); }
  };

  const saveQQNotificationSettings = async () => {
    try {
      setSavingQqSettings(true); setMessage(null);
      await api.put('/users/me/qq-notifications', {
        qq_notification_enabled: qqNotificationEnabled, qq_notification_group_id: qqNotificationGroupId,
        qq_notify_message: qqNotifyMessage, qq_notify_follow_update: qqNotifyFollowUpdate,
        qq_notify_follow_new: qqNotifyFollowNew, qq_message_delivery: qqMessageDelivery,
      });
      setMessage({ type: 'success', text: 'QQ 通知设置保存成功' });
      await refreshUser();
    } catch (error) { setMessage({ type: 'error', text: getErrorMessage(error, '保存失败') }); }
    finally { setSavingQqSettings(false); }
  };

  useEffect(() => { let timer: NodeJS.Timeout; if (countdown > 0) timer = setTimeout(() => setCountdown(c => c - 1), 1000); return () => clearTimeout(timer); }, [countdown]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setMessage(null);
    try {
      const res = await api.put('/users/me/profile', { username });
      if (res.data.success) { setMessage({ type: 'success', text: '个人资料更新成功' }); await refreshUser(); }
    } catch (error: unknown) { setMessage({ type: 'error', text: getErrorMessage(error, '更新失败') }); }
    finally { setLoading(false); }
  };

  const handleSendCode = async () => {
    if (isSendingCode || countdown > 0) return;
    setIsSendingCode(true); setMessage(null);
    try { const res = await api.post('/users/me/password/code'); if (res.data.success) { setMessage({ type: 'success', text: '验证码已发送到您的邮箱' }); setCountdown(60); } }
    catch (error: unknown) { setMessage({ type: 'error', text: getErrorMessage(error, '发送验证码失败') }); }
    finally { setIsSendingCode(false); }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setMessage({ type: 'error', text: '两次输入的密码不一致' }); return; }
    setLoading(true); setMessage(null);
    try {
      const res = await api.put('/users/me/password', { code: emailCode, newPassword });
      if (res.data.success) { setMessage({ type: 'success', text: '密码修改成功' }); setOldPassword(''); setNewPassword(''); setConfirmPassword(''); setEmailCode(''); }
    } catch (error: unknown) { setMessage({ type: 'error', text: getErrorMessage(error, '密码修改失败') }); }
    finally { setLoading(false); }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-slate-500">加载中...</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-slate-800">账号设置</h2><p className="text-sm text-slate-500 mt-1">管理您的个人资料和安全设置</p></div>
      </div>
      {message && (
        <div className={`p-4 rounded-xl border ${message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'} flex items-center`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5 mr-2" /> : <AlertCircle className="w-5 h-5 mr-2" />}{message.text}
        </div>
      )}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 space-y-8">
          <div className="border-b border-slate-100 pb-8">
            <h3 className="text-lg font-bold text-slate-800 flex items-center mb-4"><Shield className="w-5 h-5 mr-2" />账号信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">用户 ID</label><div className="px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 text-slate-500 font-mono text-sm">{user?.id}</div></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">邮箱</label><div className="px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 text-slate-500 text-sm">{user?.email}</div></div>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="border-b border-slate-100 pb-8">
            <h3 className="text-lg font-bold text-slate-800 flex items-center mb-4"><User className="w-5 h-5 mr-2" />基本资料</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">用户名</label><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm" /></div>
              <div><button type="submit" disabled={loading} className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-bold rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"><Save className="w-4 h-4 mr-2" />保存修改</button></div>
            </div>
          </form>

          <form onSubmit={handleUpdatePassword} className="border-b border-slate-100 pb-8">
            <h3 className="text-lg font-bold text-slate-800 flex items-center mb-4"><Lock className="w-5 h-5 mr-2" />安全设置</h3>
            <div className="space-y-4 max-w-2xl">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">邮箱验证码</label>
                <div className="flex gap-2">
                  <input type="text" value={emailCode} onChange={(e) => setEmailCode(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm" placeholder="请输入验证码" />
                  <button type="button" onClick={handleSendCode} disabled={isSendingCode || countdown > 0}
                    className="inline-flex items-center px-4 py-2 border border-slate-200 text-sm font-bold rounded-lg text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50">
                    <Mail className="w-4 h-4 mr-2" />{countdown > 0 ? `${countdown}s 后重试` : '获取验证码'}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">新密码</label><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">确认新密码</label><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm" /></div>
              </div>
              <button type="submit" disabled={loading} className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-bold rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"><Save className="w-4 h-4 mr-2" />更新密码</button>
            </div>
          </form>

          <div className="border-b border-slate-100 pb-8">
            <h3 className="text-lg font-bold text-slate-800 flex items-center mb-4"><Shield className="w-5 h-5 mr-2" />QQ 绑定</h3>
            <div className="max-w-2xl space-y-4">
              {user?.qq_number ? (
                <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg p-4">
                  <div className="flex items-center"><div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm mr-3">QQ</div>
                    <div><p className="font-medium text-slate-800">{user.qq_number}</p><p className="text-xs text-slate-500">已绑定 QQ 号</p></div>
                  </div>
                  <button onClick={async () => { try { await api.delete('/users/me/qq'); setMessage({ type: 'success', text: '解绑成功' }); await refreshUser(); } catch (err) { setMessage({ type: 'error', text: getErrorMessage(err, '解绑失败') }); } }}
                    className="text-red-500 hover:text-red-700 text-sm font-medium border border-red-200 px-3 py-1.5 rounded-lg">解绑</button>
                </div>
              ) : (
                <form onSubmit={async (e) => { e.preventDefault(); const qqInput = (e.target as HTMLFormElement).qq_number as HTMLInputElement; const qqVal = qqInput.value.trim(); if (!qqVal) return; try { const res = await api.put('/users/me/qq', { qq_number: qqVal }); if (res.data.success) { setMessage({ type: 'success', text: 'QQ 绑定成功！' }); await refreshUser(); } } catch (err) { setMessage({ type: 'error', text: getErrorMessage(err, '绑定失败') }); } }}
                  className="flex gap-3 items-end">
                  <div className="flex-1"><label className="block text-sm font-medium text-slate-700 mb-1">QQ 号</label>
                    <input type="text" name="qq_number" pattern="\d{5,11}" title="请输入 5-11 位 QQ 号" placeholder="输入您的 QQ 号码"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm" /></div>
                  <button type="submit" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700">绑定</button>
                </form>
              )}
            </div>
          </div>

          {user?.qq_number && (
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center mb-4"><Bell className="w-5 h-5 mr-2" />QQ 通知设置</h3>
              <div className="max-w-2xl space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div><p className="font-medium text-slate-800">开启 QQ 通知</p><p className="text-xs text-slate-500">开启后，消息提醒会通过 QQ 机器人发送</p></div>
                  <button onClick={() => setQqNotificationEnabled(!qqNotificationEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${qqNotificationEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${qqNotificationEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                {qqNotificationEnabled && (
                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">消息投递方式</label>
                      <div className="flex gap-3">
                        <button type="button" onClick={() => setQqMessageDelivery('group')}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 text-sm font-medium ${qqMessageDelivery === 'group' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600'}`}>
                          群聊接收
                        </button>
                        <button type="button" onClick={() => setQqMessageDelivery('private')}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 text-sm font-medium ${qqMessageDelivery === 'private' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600'}`}>
                          私聊接收
                        </button>
                      </div>
                    </div>
                    {qqMessageDelivery === 'group' && (
                      <div><label className="block text-sm font-medium text-slate-700 mb-2">选择接收群</label>
                        {loadingQqGroups ? <div className="text-sm text-slate-500">加载群列表...</div> : qqGroups.length > 0 ? (
                          <select value={qqNotificationGroupId || ''} onChange={(e) => setQqNotificationGroupId(e.target.value || null)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm">
                            <option value="">请选择群</option>
                            {qqGroups.map(g => <option key={g.group_id} value={g.group_id}>{g.group_name} ({g.group_id})</option>)}
                          </select>
                        ) : <div className="text-sm text-slate-500">暂无可用群</div>}
                      </div>
                    )}
                    <div className="space-y-3">
                      {[
                        { icon: MessageSquare, label: '好友消息通知', val: qqNotifyMessage, set: setQqNotifyMessage },
                        { icon: Heart, label: '关注资源更新通知', val: qqNotifyFollowUpdate, set: setQqNotifyFollowUpdate },
                        { icon: Plus, label: '关注用户发布新资源通知', val: qqNotifyFollowNew, set: setQqNotifyFollowNew },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                          <div className="flex items-center"><item.icon className="w-4 h-4 mr-2 text-slate-600" /><span className="text-sm text-slate-700">{item.label}</span></div>
                          <button onClick={() => item.set(!item.val)}
                            className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${item.val ? 'bg-blue-600' : 'bg-slate-300'}`}>
                            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${item.val ? 'translate-x-5' : 'translate-x-1'}`} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button onClick={saveQQNotificationSettings} disabled={savingQqSettings}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-bold rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50">
                      <Save className="w-4 h-4 mr-2" />{savingQqSettings ? '保存中...' : '保存设置'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
