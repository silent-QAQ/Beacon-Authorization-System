import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { useTheme } from '../../context/ThemeContext';

const Layout: React.FC = () => {
  const { bgColor, contentColor } = useTheme();

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: bgColor !== 'transparent' ? bgColor : '#f3f4f6' }}>
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8" style={{ backgroundColor: contentColor !== 'transparent' ? contentColor : '#ffffff' }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
