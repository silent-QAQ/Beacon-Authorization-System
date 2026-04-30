import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthorizationCenter from './pages/AuthorizationCenter';
import Promotions from './pages/Promotions';
import Settings from './pages/Settings';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<AuthorizationCenter />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="authorization-center" element={<AuthorizationCenter />} />
          <Route path="promotions" element={<Promotions />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
