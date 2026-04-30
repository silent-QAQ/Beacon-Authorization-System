import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, LogOut, Settings, ShieldCheck } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-teal-700 text-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2 font-bold text-xl" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <ShieldCheck className="w-8 h-8" />
            <span>Beacon Auth</span>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <Link to="/authorization-center" className="hover:text-teal-200 transition font-medium">授权中心</Link>
            <Link to="/promotions" className="hover:text-teal-200 transition font-medium">推广统计</Link>

            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link to="/settings" className="hover:text-teal-200 transition">
                  <Settings className="w-5 h-5" />
                </Link>
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span className="font-medium">{user?.username}</span>
                </div>
                <button onClick={handleLogout} className="hover:text-red-300 transition">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/login" className="hover:text-teal-200 transition">登录</Link>
                <Link to="/register" className="bg-white text-teal-900 px-4 py-2 rounded-lg font-bold hover:bg-teal-50 transition">注册</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
