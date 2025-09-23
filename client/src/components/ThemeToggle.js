import React from 'react';
import { FiSun, FiMoon } from 'react-icons/fi';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = ({ className = '', size = 'md' }) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();
  
  // Don't show theme toggle on homepage
  if (location.pathname === '/') {
    return null;
  }

  const sizeClasses = {
    sm: 'p-2 w-8 h-8',
    md: 'p-2 w-10 h-10',
    lg: 'p-3 w-12 h-12'
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  };

  return (
    <button
      onClick={toggleTheme}
      className={`
        fixed top-4 right-4 z-50 
        ${sizeClasses[size]}
        rounded-lg transition-all duration-300 ease-in-out
        backdrop-blur-md border
        ${isDarkMode 
          ? 'bg-gray-900/80 border-gray-700 text-crypto-orange hover:bg-gray-800/90 hover:border-crypto-orange/50' 
          : 'bg-white/80 border-gray-300 text-crypto-orange-dark hover:bg-gray-50/90 hover:border-crypto-orange/50'
        }
        hover:scale-110 hover:shadow-crypto-glow
        focus:outline-none focus:ring-2 focus:ring-crypto-orange/50
        ${className}
      `}
      aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
    >
      <div className="relative">
        {isDarkMode ? (
          <FiSun 
            size={iconSizes[size]} 
            className="transition-transform duration-300 rotate-0 hover:rotate-180" 
          />
        ) : (
          <FiMoon 
            size={iconSizes[size]} 
            className="transition-transform duration-300 rotate-0 hover:-rotate-12" 
          />
        )}
      </div>
    </button>
  );
};

export default ThemeToggle;