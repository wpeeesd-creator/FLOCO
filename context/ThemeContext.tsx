import React, { createContext, useContext, useState } from 'react';

const lightTheme = {
  mode: 'light' as const,
  bg: '#F2F4F6', bgCard: '#FFFFFF', bgInput: '#F2F4F6',
  bgHeader: '#FFFFFF', bgButton: '#F2F4F6',
  text: '#191F28', textSecondary: '#8B95A1', textTertiary: '#B0B8C1',
  primary: '#0066FF', primaryLight: '#EBF2FF',
  red: '#F04452', redLight: '#FFF0F0',
  blue: '#2175F3', blueLight: '#F0F4FF',
  green: '#34C759', border: '#F2F4F6', borderStrong: '#E5E8EB',
  shadow: '#000000', overlay: '#00000050',
  stockBg: '#FFFFFF', stockCard: '#F8F9FA',
  stockText: '#191F28', stockBorder: '#E5E8EB',
};

const darkTheme = {
  mode: 'dark' as const,
  bg: '#0A0A0A', bgCard: '#111111', bgInput: '#1A1A1A',
  bgHeader: '#0A0A0A', bgButton: '#1A1A1A',
  text: '#FFFFFF', textSecondary: '#888888', textTertiary: '#444444',
  primary: '#0066FF', primaryLight: '#0A1A3A',
  red: '#FF4444', redLight: '#2A0A0A',
  blue: '#4488FF', blueLight: '#0A1A3A',
  green: '#34C759', border: '#1A1A1A', borderStrong: '#333333',
  shadow: '#000000', overlay: '#00000080',
  stockBg: '#0A0A0A', stockCard: '#111111',
  stockText: '#FFFFFF', stockBorder: '#222222',
};

export type Theme = typeof lightTheme;

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
  isDark: false,
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => setIsDark(prev => !prev);

  return (
    <ThemeContext.Provider value={{
      theme: isDark ? darkTheme : lightTheme,
      isDark,
      toggleTheme,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
