// src/components/Sidebar.js
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  FiHome, FiPieChart, FiDollarSign, FiUpload, 
  FiFileText, FiShield, FiBell, FiMessageSquare, 
  FiTarget, FiBook, FiSettings, FiMenu, FiX, 
  FiLogOut, FiUsers, FiTruck, FiSun, FiMoon,
  FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import '../custom-scrollbar.css';

const Sidebar = ({ collapsed = false, setCollapsed = () => {}, hasNewAnnouncement = false }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const { logout, user } = useUser();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Enhanced navigation items with categories
  const navItems = [
    {
      category: 'Overview',
      items: [
        { icon: <FiHome />, label: 'Dashboard', path: '/dashboard', description: 'Main overview' },
        { icon: <FiPieChart />, label: 'Portfolio', path: '/dashboard/portfolio', description: 'Investment portfolio' },
      ]
    },
    {
      category: 'Trading',
      items: [
        { icon: <FiDollarSign />, label: 'Deposit', path: '/dashboard/deposit', description: 'Add funds' },
        { icon: <FiUpload />, label: 'Withdraw', path: '/dashboard/withdraw', description: 'Withdraw funds' },
        { icon: <FiFileText />, label: 'Performance', path: '/dashboard/performance', description: 'Fund performance' },
      ]
    },
    {
      category: 'Account',
      items: [
        { icon: <FiShield />, label: 'KYC Status', path: '/dashboard/kyc', description: 'Verification status' },
        { icon: <FiUsers />, label: 'Referrals', path: '/dashboard/invite-friends', description: 'Invite friends' },
        { icon: <FiTarget />, label: 'Goals', path: '/dashboard/goals', description: 'Investment goals' },
      ]
    },
    {
      category: 'Services',
      items: [
        { icon: <FiTruck />, label: 'Car Shop', path: '/cars', description: 'Browse vehicles' },
        { 
          icon: (
            <span className="relative">
              <FiBell />
              {hasNewAnnouncement && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-r from-red-400 to-red-600 rounded-full animate-pulse shadow-lg"></span>
              )}
            </span>
          ), 
          label: 'Announcements', 
          path: '/dashboard/announcements', 
          description: 'Latest updates',
          hasNotification: hasNewAnnouncement
        },
        { icon: <FiMessageSquare />, label: 'Support', path: '/dashboard/support', description: 'Get help' },
        { icon: <FiBook />, label: 'Education', path: '/dashboard/education', description: 'Learning center' },
      ]
    }
  ];

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setMobileOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Listen for global openSidebar event so other layout elements can trigger mobile sidebar
  useEffect(() => {
    const openHandler = () => setMobileOpen(true);
    window.addEventListener('openSidebar', openHandler);
    return () => window.removeEventListener('openSidebar', openHandler);
  }, []);

  // Focus trap & body scroll lock when mobile sidebar is open
  const sidebarRef = useRef(null);
  useEffect(() => {
    if (!isMobile) return; // only for mobile off-canvas

    const sidebarEl = sidebarRef.current;
    let previousActive = null;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
      }

      if (e.key === 'Tab' && sidebarEl) {
        const focusable = sidebarEl.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])');
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    if (mobileOpen) {
      // lock body scroll
      previousActive = document.activeElement;
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);

      // focus first focusable element in sidebar
      setTimeout(() => {
        const focusable = sidebarEl.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])');
        if (focusable.length) focusable[0].focus();
      }, 50);
    }

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
      if (previousActive && previousActive.focus) previousActive.focus();
    };
  }, [mobileOpen, isMobile]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleCollapse = () => setCollapsed(!collapsed);
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Don't render for admin routes
  if (location.pathname.startsWith('/admin')) return null;

  // Mobile-first sidebar classes. On small screens the sidebar is off-canvas
  // by default and slides in as an overlay. On md+ it becomes a fixed column
  // that pushes the page content (AppLayout handles the md-margin).
  const widthClass = collapsed ? 'md:w-20 w-64' : 'md:w-72 w-full sm:w-72';
  const bgClass = isDarkMode
    ? 'bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 text-gray-100 border-gray-700/50'
    : 'bg-gradient-to-b from-white via-gray-50 to-gray-100 text-gray-900 border-gray-200/80';

  const visibilityClass = isMobile
    ? (mobileOpen ? 'translate-x-0 opacity-100 pointer-events-auto' : '-translate-x-full opacity-0 pointer-events-none')
    : 'translate-x-0 opacity-100 pointer-events-auto';

  const sidebarClasses = `${bgClass} transition-transform duration-300 ease-in-out transform border-r backdrop-blur-sm ${widthClass} h-screen flex flex-col fixed top-0 left-0 z-50 ${visibilityClass} shadow-2xl overflow-hidden`;

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={sidebarClasses}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200/10">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <div className="flex items-center space-x-3">
                <div className={`
                  w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg
                  ${isDarkMode 
                    ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white' 
                    : 'bg-gradient-to-br from-orange-600 to-orange-700 text-white'
                  }
                `}>
                  L
                </div>
                <div>
                  <h1 className="font-bold text-lg tracking-tight">THE DIGITAL TRADING</h1>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Investment Platform
                  </p>
                </div>
              </div>
            )}
            
            {/* Collapse / Toggle button (visible on desktop + mobile) */}
            <button
              onClick={() => {
                if (isMobile) {
                  setMobileOpen(prev => !prev);
                } else {
                  handleCollapse();
                }
              }}
              className={`
                flex items-center justify-center w-8 h-8 rounded-lg
                transition-all duration-300 hover:scale-110 active:scale-95
                ${isDarkMode 
                  ? 'hover:bg-gray-700/50 text-gray-400 hover:text-white' 
                  : 'hover:bg-gray-200/50 text-gray-500 hover:text-gray-700'
                }
                ${collapsed ? 'mx-auto' : ''}
              `}
              aria-label={(isMobile && mobileOpen) ? "Close menu" : (isMobile ? "Open menu" : (collapsed ? "Expand sidebar" : "Collapse sidebar"))}
            >
              {isMobile ? (mobileOpen ? <FiX size={16} /> : <FiMenu size={16} />) : (collapsed ? <FiChevronRight size={16} /> : <FiChevronLeft size={16} />)}
            </button>
          </div>
        </div>

        {/* User Profile Section */}
        {!collapsed && user && (
          <div className={`
            p-4 mx-4 mt-4 rounded-xl
            ${isDarkMode 
              ? 'bg-gray-800/50 border border-gray-700/50' 
              : 'bg-white/50 border border-gray-200/50'
            }
          `}>
            <div className="flex items-center space-x-3">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center font-semibold
                ${isDarkMode 
                  ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white' 
                  : 'bg-gradient-to-br from-blue-600 to-purple-700 text-white'
                }
              `}>
                {user.firstName?.charAt(0) || user.username?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {user.firstName || user.username || 'User'}
                </p>
                <p className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-4 px-4 overflow-y-auto scrollbar-thin scrollbar-thumb-orange scrollbar-track-transparent">
          {navItems.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-6">
              {!collapsed && (
                <h3 className={`
                  text-xs font-semibold uppercase tracking-wider mb-3 px-2
                  ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}
                `}>
                  {category.category}
                </h3>
              )}
              
              <ul className="space-y-1">
                {category.items.map((item, index) => {
                  const isActive = location.pathname === item.path;
                  const itemKey = `${categoryIndex}-${index}`;
                  
                  return (
                    <li key={itemKey}>
                      <Link
                        to={item.path}
                        className={`
                          group relative flex items-center px-3 py-3 rounded-xl
                          transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]
                          ${collapsed ? 'justify-center' : 'justify-start'}
                          ${isActive 
                            ? isDarkMode 
                              ? 'bg-gradient-to-r from-orange-500/20 to-orange-600/20 text-orange-400 shadow-lg shadow-orange-500/10' 
                              : 'bg-gradient-to-r from-orange-500/10 to-orange-600/10 text-orange-700 shadow-lg shadow-orange-500/10'
                            : isDarkMode 
                              ? 'text-gray-300 hover:bg-gray-700/50 hover:text-white' 
                              : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
                          }
                        `}
                        onMouseEnter={() => setHoveredItem(itemKey)}
                        onMouseLeave={() => setHoveredItem(null)}
                        onClick={() => setMobileOpen(false)}
                      >
                        {/* Active indicator */}
                        {isActive && (
                          <div className={`
                            absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full
                            ${isDarkMode ? 'bg-orange-400' : 'bg-orange-600'}
                          `} />
                        )}
                        
                        {/* Icon */}
                        <span className={`
                          text-lg transition-all duration-300 flex items-center justify-center
                          ${collapsed ? 'mx-auto' : 'mr-3'}
                          ${isActive ? 'scale-110' : 'group-hover:scale-110'}
                          ${item.hasNotification ? 'animate-pulse' : ''}
                        `}>
                          {item.icon}
                        </span>
                        
                        {/* Label */}
                        <span className={`
                          font-medium transition-all duration-300
                          ${collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}
                        `}>
                          {item.label}
                        </span>
                        
                        {/* Notification badge */}
                        {item.hasNotification && !collapsed && (
                          <span className={`
                            ml-auto w-2 h-2 rounded-full
                            ${isDarkMode ? 'bg-red-400' : 'bg-red-500'}
                            animate-pulse
                          `} />
                        )}
                        
                        {/* Tooltip for collapsed state */}
                        {collapsed && hoveredItem === itemKey && (
                          <div className={`
                            absolute left-full ml-2 px-3 py-2 rounded-lg shadow-lg z-50
                            ${isDarkMode 
                              ? 'bg-gray-800 text-white border border-gray-700' 
                              : 'bg-white text-gray-900 border border-gray-200'
                            }
                            whitespace-nowrap text-sm font-medium
                            animate-in fade-in-0 zoom-in-95 duration-200
                          `}>
                            <div>{item.label}</div>
                            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {item.description}
                            </div>
                          </div>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Settings Section */}
        <div className={`
          p-4 border-t space-y-2
          ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'}
        `}>
          {/* Settings Link */}
          <Link
            to="/dashboard/settings"
            className={`
              group flex items-center px-3 py-3 rounded-xl
              transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]
              ${collapsed ? 'justify-center' : 'justify-start'}
              ${location.pathname === '/dashboard/settings'
                ? isDarkMode 
                  ? 'bg-gradient-to-r from-orange-500/20 to-orange-600/20 text-orange-400' 
                  : 'bg-gradient-to-r from-orange-500/10 to-orange-600/10 text-orange-700'
                : isDarkMode 
                  ? 'text-gray-300 hover:bg-gray-700/50 hover:text-white' 
                  : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
              }
            `}
            onClick={() => setMobileOpen(false)}
          >
            <span className={`text-lg ${collapsed ? 'mx-auto' : 'mr-3'}`}>
              <FiSettings />
            </span>
            <span className={`
              font-medium transition-all duration-300
              ${collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}
            `}>
              Settings
            </span>
          </Link>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`
              group flex items-center w-full px-3 py-3 rounded-xl
              transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]
              ${collapsed ? 'justify-center' : 'justify-start'}
              ${isDarkMode 
                ? 'text-gray-300 hover:bg-gray-700/50 hover:text-white' 
                : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
              }
            `}
          >
            <span className={`text-lg ${collapsed ? 'mx-auto' : 'mr-3'}`}>
              {isDarkMode ? <FiSun /> : <FiMoon />}
            </span>
            <span className={`
              font-medium transition-all duration-300
              ${collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}
            `}>
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={`
              group flex items-center w-full px-3 py-3 rounded-xl
              transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]
              ${collapsed ? 'justify-center' : 'justify-start'}
              text-red-400 hover:bg-red-500/10 hover:text-red-300
            `}
          >
            <span className={`text-lg ${collapsed ? 'mx-auto' : 'mr-3'}`}>
              <FiLogOut />
            </span>
            <span className={`
              font-medium transition-all duration-300
              ${collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}
            `}>
              Logout
            </span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;