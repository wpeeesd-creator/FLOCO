import React, { createContext, useContext } from 'react';

const lightTheme = {
  mode: 'light' as const,
  bg: '#F2F4F6', bgCard: '#FFFFFF', bgInput: '#F2F4F6',
  bgHeader: '#FFFFFF', bgButton: '#F2F4F6',
  text: '#191F28', textSecondary: '#8B95A1', textTertiary: '#B0B8C1',
  primary: '#3478F6', primaryLight: '#EEF4FF',
  red: '#F04452', redLight: '#FFF0F0',
  blue: '#2175F3', blueLight: '#F0F4FF',
  green: '#34C759', border: '#F2F4F6', borderStrong: '#E5E8EB',
  shadow: '#000000', overlay: '#00000050',
  stockBg: '#FFFFFF', stockCard: '#F8F9FA',
  stockText: '#191F28', stockBorder: '#E5E8EB',
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

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => (
  <ThemeContext.Provider value={{ theme: lightTheme, isDark: false, toggleTheme: () => {} }}>
    {children}
  </ThemeContext.Provider>
);
