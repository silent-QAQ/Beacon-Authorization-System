import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';

interface FriendlyLink {
  id: number;
  name: string;
  url: string;
  description: string;
}

const Footer: React.FC = () => {
  const [friendlyLinks, setFriendlyLinks] = useState<FriendlyLink[]>([]);

  useEffect(() => {
    api.get('/friendly-links').then(res => setFriendlyLinks(res.data)).catch(() => {});
  }, []);

  const handleLinkClick = async (link: FriendlyLink) => {
    try { await api.post('/promotions/click', { link_name: link.name, link_url: link.url }); } catch {}
  };

  return (
    <footer className="bg-slate-900 text-slate-300 py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-white font-bold mb-3">Beacon Auth</h3>
            <p className="text-sm">Minecraft 插件授权验证系统</p>
          </div>
          <div>
            <h3 className="text-white font-bold mb-3">友情链接</h3>
            <ul className="space-y-1 text-sm">
              {friendlyLinks.map(link => (
                <li key={link.id}>
                  <a href={link.url} target="_blank" rel="noopener noreferrer"
                    className="hover:text-white transition-colors" onClick={() => handleLinkClick(link)}>
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-white font-bold mb-3">关于我们</h3>
            <ul className="space-y-1 text-sm">
              <li><Link to="/promotions" className="hover:text-white transition-colors">推广效果统计</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 mt-6 pt-6 text-center text-xs text-slate-500">
          &copy; {new Date().getFullYear()} Beacon Auth System
        </div>
      </div>
    </footer>
  );
};

export default Footer;
