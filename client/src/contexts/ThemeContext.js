import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : true; // Default to dark mode
  });

  useEffect(() => {
    // Save theme preference to localStorage
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    
    // Update document class for global styling
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  // Cryptocurrency-focused color scheme
  const theme = {
    isDarkMode,
    toggleTheme,
    colors: {
      // Primary colors - Bitcoin/Crypto inspired
      primary: isDarkMode ? '#F7931A' : '#E8851C', // Bitcoin orange
      primaryHover: isDarkMode ? '#FF9F2A' : '#D67616',
      secondary: isDarkMode ? '#00D4AA' : '#00B894', // Crypto green
      secondaryHover: isDarkMode ? '#00E6B8' : '#00A085',
      
      // Background colors
      background: isDarkMode ? '#0F0F0F' : '#FFFFFF',
      backgroundSecondary: isDarkMode ? '#1A1A1A' : '#F8F9FA',
      backgroundTertiary: isDarkMode ? '#2A2A2A' : '#F1F3F4',
      
      // Text colors
      text: isDarkMode ? '#FFFFFF' : '#1A1A1A',
      textSecondary: isDarkMode ? '#B0B0B0' : '#6B7280',
      textMuted: isDarkMode ? '#808080' : '#9CA3AF',
      
      // Border colors
      border: isDarkMode ? '#333333' : '#E5E7EB',
      borderLight: isDarkMode ? '#404040' : '#F3F4F6',
      
      // Status colors
      success: isDarkMode ? '#10B981' : '#059669',
      warning: isDarkMode ? '#F59E0B' : '#D97706',
      error: isDarkMode ? '#EF4444' : '#DC2626',
      info: isDarkMode ? '#3B82F6' : '#2563EB',
      
      // Crypto-specific colors
      bitcoin: '#F7931A',
      ethereum: '#627EEA',
      profit: '#10B981',
      loss: '#EF4444',
      
      // Glass morphism
      glass: isDarkMode 
        ? 'rgba(15, 15, 15, 0.7)' 
        : 'rgba(255, 255, 255, 0.7)',
      glassBorder: isDarkMode 
        ? 'rgba(255, 255, 255, 0.1)' 
        : 'rgba(0, 0, 0, 0.1)',
    },
    
    // Utility classes
    classes: {
      card: isDarkMode 
        ? 'bg-gray-900 border-gray-700' 
        : 'bg-white border-gray-200',
      cardHover: isDarkMode 
        ? 'hover:bg-gray-800 hover:border-gray-600' 
        : 'hover:bg-gray-50 hover:border-gray-300',
      button: isDarkMode 
        ? 'bg-orange-600 hover:bg-orange-700 text-white' 
        : 'bg-orange-500 hover:bg-orange-600 text-white',
      buttonSecondary: isDarkMode 
        ? 'bg-gray-700 hover:bg-gray-600 text-white' 
        : 'bg-gray-200 hover:bg-gray-300 text-gray-900',
      input: isDarkMode 
        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500',
      glass: isDarkMode
        ? 'backdrop-blur-xl bg-black/70 border border-white/10'
        : 'backdrop-blur-xl bg-white/70 border border-black/10',
    }
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;