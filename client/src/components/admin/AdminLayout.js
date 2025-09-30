// src/components/admin/AdminLayout.js
import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  FiUsers, FiDollarSign, FiDownload, FiSettings, FiHome, FiBell, 
  FiChevronLeft, FiChevronRight, FiMenu, FiX, FiBarChart2, 
  FiMail, FiShield, FiCreditCard, FiTrendingUp, FiMessageSquare,
  FiTruck, FiEye, FiLogOut, FiSun, FiMoon
} from 'react-icons/fi';
import { useAdminAuth } from '../../auth/AdminAuthProvider';
import { useTheme } from '../../contexts/ThemeContext';

const AdminLayout = () => {
  const { admin, logout } = useAdminAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  useEffect(() => {
    const checkMobile = () => {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);
      setSidebarOpen(!isMobileView);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  const navigationItems = [
    { path: '/admin', icon: FiHome, label: 'Dashboard', exact: true },
    { path: '/admin/users', icon: FiUsers, label: 'User Management' },
    { path: '/admin/funds', icon: FiTrendingUp, label: 'Funds & Investments' },
    { path: '/admin/deposits', icon: FiCreditCard, label: 'Deposits' },
    { path: '/admin/withdrawals', icon: FiDownload, label: 'Withdrawals' },
    { path: '/admin/plans', icon: FiBarChart2, label: 'Investment Plans' },
    { path: '/admin/user-investments', icon: FiDollarSign, label: 'User Investments' },
    { path: '/admin/cars', icon: FiTruck, label: 'Car Management' },
    { path: '/admin/announcements', icon: FiBell, label: 'Announcements' },
    { path: '/admin/send-email', icon: FiMail, label: 'Email Marketing' },
    { path: '/admin/support', icon: FiMessageSquare, label: 'Support Chat' },

    { path: '/admin/mirror', icon: FiEye, label: 'User Mirror' },
    { path: '/admin/roi-approvals', icon: FiShield, label: 'ROI Approvals' },
    { path: '/admin/cold-wallet', icon: FiDollarSign, label: 'Cold Wallet' },
    { path: '/admin/settings', icon: FiSettings, label: 'Settings' },
  ];

  const isActiveRoute = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className={`flex h-screen font-sans transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Mobile Overlay */}
      {sidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden backdrop-blur-sm" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static top-0 left-0 h-full z-50 transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'w-72' : 'w-16'} 
        ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}
        ${isDarkMode 
          ? 'bg-gradient-to-b from-gray-800 to-gray-900 border-gray-700' 
          : 'bg-gradient-to-b from-white to-gray-50 border-gray-200'
        } 
        border-r shadow-xl flex flex-col
      `}>
        {/* Header */}
        <div className={`
          flex items-center justify-between h-16 px-4 border-b
          ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}
        `}>
          <div className={`flex items-center transition-all duration-300 ${!sidebarOpen ? 'opacity-0 w-0' : 'opacity-100'}`}>
            <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-orange-600 rounded-lg flex items-center justify-center mr-3">
              <FiShield className="text-white text-lg" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                THE DIGITAL TRADING
              </h1>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </div>
          
          <button
            onClick={toggleSidebar}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            {sidebarOpen ? <FiChevronLeft size={20} /> : <FiChevronRight size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 overflow-y-auto">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveRoute(item.path, item.exact);
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center px-3 py-3 rounded-lg transition-all duration-200 group
                    ${isActive 
                      ? isDarkMode 
                        ? 'bg-orange-600 text-white shadow-lg' 
                        : 'bg-orange-500 text-white shadow-lg'
                      : isDarkMode 
                        ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className={`
                    ${sidebarOpen ? 'mr-3' : 'mx-auto'} 
                    text-lg transition-all duration-300
                    ${isActive ? 'text-white' : ''}
                  `} />
                  <span className={`
                    font-medium transition-all duration-300 
                    ${!sidebarOpen ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}
                  `}>
                    {item.label}
                  </span>
                  {isActive && sidebarOpen && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Profile & Actions */}
        <div className={`
          p-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}
        `}>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`
              w-full flex items-center px-3 py-2 mb-3 rounded-lg transition-colors
              ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}
            `}
          >
            {isDarkMode ? <FiSun className="mr-3" /> : <FiMoon className="mr-3" />}
            <span className={`transition-all duration-300 ${!sidebarOpen ? 'opacity-0 w-0' : 'opacity-100'}`}>
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>

          {/* Admin Profile */}
          <div className={`
            flex items-center transition-all duration-300 
            ${!sidebarOpen ? 'justify-center' : ''}
          `}>
            <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
              {admin?.name?.charAt(0) || 'A'}
            </div>
            {sidebarOpen && (
              <div className="ml-3 flex-1">
                <div className="font-semibold text-sm">{admin?.name || 'Administrator'}</div>
                <div className="text-xs text-gray-500">Super Admin</div>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className={`
              w-full mt-3 flex items-center px-3 py-2 rounded-lg transition-all duration-300
              ${!sidebarOpen ? 'justify-center' : 'justify-start'}
              ${isDarkMode 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-red-500 hover:bg-red-600 text-white'
              }
            `}
          >
            <FiLogOut className={`${!sidebarOpen ? 'mx-auto' : 'mr-3'}`} />
            <span className={`transition-all duration-300 ${!sidebarOpen ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          onClick={toggleSidebar}
          className={`
            fixed top-4 left-4 z-50 p-3 rounded-lg shadow-lg transition-colors
            ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}
          `}
        >
          {sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
        </button>
      )}

      {/* Main Content */}
      <main className={`
        flex-1 flex flex-col min-h-screen overflow-hidden
        ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}
      `}>
        {/* Top Bar */}
        <header className={`
          h-16 flex items-center justify-between px-4 md:px-6 border-b
          ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
          shadow-sm
        `}>
          <div className="flex items-center pl-12 md:pl-0">
            <h2 className="text-lg md:text-xl font-semibold truncate">
              {navigationItems.find(item => isActiveRoute(item.path, item.exact))?.label || 'Dashboard'}
            </h2>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className={`
              p-2 rounded-lg transition-colors relative
              ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}
            `}>
              <FiBell size={20} />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>
            
            {/* Theme Toggle for Desktop */}
            <button
              onClick={toggleTheme}
              className={`
                p-2 rounded-lg transition-colors
                ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}
              `}
            >
              {isDarkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-3 md:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="space-y-4">
              <Outlet />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;