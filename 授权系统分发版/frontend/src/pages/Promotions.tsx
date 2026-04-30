import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { BarChart3, ExternalLink, MousePointerClick, Calendar, TrendingUp } from 'lucide-react';

interface LinkStats { link_name: string; link_url: string; click_count: number; last_clicked: string; }
interface StatsData { total_clicks: number; today_clicks: number; week_clicks: number; links: LinkStats[]; }

const Promotions: React.FC = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/promotions/stats').then(res => { if (res.data.success) setStats(res.data.data); }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container mx-auto px-4 py-8"><div className="flex justify-center py-12"><div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" /></div></div>;

  const maxClicks = stats?.links?.length ? Math.max(...stats.links.map(l => l.click_count), 1) : 1;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-800 flex items-center mb-8"><BarChart3 className="w-8 h-8 mr-3 text-emerald-600" />推广效果统计</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-slate-500 font-medium">总点击次数</p><p className="text-3xl font-bold text-slate-800 mt-1">{stats?.total_clicks || 0}</p></div>
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center"><MousePointerClick className="w-6 h-6 text-emerald-600" /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-slate-500 font-medium">今日点击</p><p className="text-3xl font-bold text-slate-800 mt-1">{stats?.today_clicks || 0}</p></div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center"><Calendar className="w-6 h-6 text-blue-600" /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-slate-500 font-medium">本周点击</p><p className="text-3xl font-bold text-slate-800 mt-1">{stats?.week_clicks || 0}</p></div>
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center"><TrendingUp className="w-6 h-6 text-amber-600" /></div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100"><h2 className="text-lg font-bold text-slate-800">各链接点击详情</h2></div>
        {!stats?.links?.length ? (
          <div className="text-center py-12 text-slate-500"><p>暂无推广数据</p></div>
        ) : (
          <div className="divide-y divide-slate-100">
            {stats.links.map((link, i) => (
              <div key={i} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-400 w-6">{i + 1}</span>
                    <div>
                      <h3 className="font-semibold text-slate-800">{link.link_name}</h3>
                      <a href={link.link_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:text-blue-700 flex items-center gap-1 mt-0.5">
                        {link.link_url.length > 50 ? link.link_url.substring(0, 50) + '...' : link.link_url}<ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                  <div className="text-right"><p className="text-2xl font-bold text-slate-800">{link.click_count}</p><p className="text-xs text-slate-500">次点击</p></div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(link.click_count / maxClicks) * 100}%`, background: 'linear-gradient(90deg, #10b981, #059669)' }} />
                </div>
                {link.last_clicked && <p className="text-xs text-slate-400 mt-2">最近点击: {new Date(link.last_clicked).toLocaleString('zh-CN')}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Promotions;
