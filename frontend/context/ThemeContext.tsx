import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { LightColors, DarkColors, ThemeColors } from '../constants/Colors';
import { useMemo } from 'react';

export type ThemeType = 'light' | 'dark' | 'system';

interface ThemeContextProps {
  theme: ThemeType;
  activeTheme: 'light' | 'dark';
  colors: ThemeColors;
  isDark: boolean;
  setTheme: (theme: ThemeType) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeType>('system');

  useEffect(() => {
    const getSavedTheme = async () => {
      try {
        if (Platform.OS === 'web') {
          const savedTheme = localStorage.getItem('user-theme');
          if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
            setThemeState(savedTheme as ThemeType);
          }
          return;
        }
        const savedTheme = await SecureStore.getItemAsync('user-theme');
        if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
          setThemeState(savedTheme);
        }
      } catch (e) {
        console.log('Error reading theme', e);
      }
    };
    getSavedTheme();
  }, []);

  const setTheme = async (newTheme: ThemeType) => {
    setThemeState(newTheme);
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem('user-theme', newTheme);
        return;
      }
      await SecureStore.setItemAsync('user-theme', newTheme);
    } catch (e) {
      console.log('Error setting theme', e);
    }
  };

  const activeTheme = theme === 'system' 
    ? ((systemColorScheme === 'dark' || systemColorScheme === 'light') ? systemColorScheme : 'light') 
    : theme;
  const colors = activeTheme === 'dark' ? DarkColors : LightColors;
  const isDark = activeTheme === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, activeTheme, colors, isDark, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export function useThemeStyles<T>(getStyles: (colors: ThemeColors) => T): T {
  const { colors } = useTheme();
  return useMemo(() => getStyles(colors), [colors, getStyles]);
}
