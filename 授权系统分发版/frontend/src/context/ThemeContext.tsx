import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  contentColor: string;
  bgColor: string;
  navColor: string;
  setContentColor: (color: string) => void;
  setBgColor: (color: string) => void;
  setNavColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [contentColor, setContentColorState] = useState<string>(() => localStorage.getItem('beacon-content-color') || 'transparent');
  const [bgColor, setBgColorState] = useState<string>(() => localStorage.getItem('beacon-bg-color') || '#f0f5ff');
  const [navColor, setNavColorState] = useState<string>(() => localStorage.getItem('beacon-nav-color') || '#0D9488');

  const setContentColor = (color: string) => {
    setContentColorState(color);
    localStorage.setItem('beacon-content-color', color);
  };
  const setBgColor = (color: string) => {
    setBgColorState(color);
    localStorage.setItem('beacon-bg-color', color);
  };
  const setNavColor = (color: string) => {
    setNavColorState(color);
    localStorage.setItem('beacon-nav-color', color);
  };

  useEffect(() => {
    if (bgColor && bgColor !== 'transparent') document.body.style.backgroundColor = bgColor;
    else document.body.style.backgroundColor = '';
  }, [bgColor]);

  return (
    <ThemeContext.Provider value={{ contentColor, bgColor, navColor, setContentColor, setBgColor, setNavColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
