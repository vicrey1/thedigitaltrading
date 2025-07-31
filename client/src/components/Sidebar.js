// src/components/Sidebar.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiHome, FiPieChart, FiDollarSign, FiUpload, 
         FiFileText, FiShield, FiBell, FiMessageSquare, 
         FiTarget, FiBook, FiSettings, FiMenu, FiX, FiLogOut, FiUsers } from 'react-icons/fi';
import { useUser } from '../contexts/UserContext';
import '../custom-scrollbar.css';

const Sidebar = ({ collapsed = false, setCollapsed = () => {}, hasNewAnnouncement = false }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout } = useUser();
  const navigate = useNavigate();

  const navItems = [
    { icon: <FiHome />, label: 'Dashboard', path: '/dashboard' },
    { icon: <FiPieChart />, label: 'Investment Portfolio', path: '/dashboard/portfolio' },
    { icon: <FiDollarSign />, label: 'Deposit Funds', path: '/dashboard/deposit' },
    { icon: <FiUpload />, label: 'Withdraw Funds', path: '/dashboard/withdraw' },
    { icon: <FiFileText />, label: 'Fund Performance', path: '/dashboard/performance' },
    { icon: <FiShield />, label: 'KYC Status', path: '/dashboard/kyc' },
    { icon: <FiUsers />, label: 'Invite Friends', path: '/dashboard/invite-friends' },
    { icon: (
        <span className="relative">
          <FiBell />
          {hasNewAnnouncement && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          )}
        </span>
      ), label: 'Announcements', path: '/dashboard/announcements' },
    { icon: <FiMessageSquare />, label: 'Support Chat', path: '/dashboard/support' },
    { icon: <FiTarget />, label: 'My Goals', path: '/dashboard/goals' },
    { icon: <FiBook />, label: 'Education Center', path: '/dashboard/education' },
    { icon: <FiSettings />, label: 'Settings', path: '/dashboard/settings' },
  ];

  // Desktop collapse/expand
  const handleCollapse = () => setCollapsed(!collapsed);
  // Mobile open/close
  const handleMobile = () => setMobileOpen(!mobileOpen);
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Only render sidebar for user (not admin routes)
  if (window.location.pathname.startsWith('/admin')) return null;

  return (
    <>
      <div
        className={`bg-black bg-opacity-70 text-white glassmorphic transition-all duration-500 ease-in-out
          ${collapsed ? 'w-20' : 'w-64'}
          h-screen md:h-auto min-h-full flex flex-col scrollbar-thin scrollbar-thumb-gold scrollbar-track-gray-900/60 sidebar-scrollbar`}
        style={{ minHeight: '100vh', height: '100%', overflowY: 'auto', position: 'relative', left: 0, zIndex: 10, transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)' }}
      >
        {/* Collapse/Expand button above Dashboard icon */}
        <div className="pt-6 pl-2 pr-2">
          <button
            onClick={handleCollapse}
            className="hidden md:block mb-4 bg-gold text-black p-2 rounded-full shadow-lg transition-transform duration-300 hover:scale-110"
          >
            {collapsed ? <FiMenu size={22} /> : <FiX size={22} />}
          </button>
        </div>
        <nav className="flex-1">
          <ul className="flex flex-col items-start w-full">
            {navItems.map((item, index) => (
              <li key={index} className="mb-2 w-full transition-all duration-300">
                <Link
                  to={item.path}
                  className={`flex items-center p-3 rounded-lg hover:bg-gold hover:bg-opacity-20 hover:text-gold transition-all duration-300 ${collapsed ? 'justify-center' : 'justify-start'} w-full`}
                >
                  <span className="mr-3 text-xl flex-shrink-0 transition-transform duration-300 group-hover:scale-110">{item.icon}</span>
                  {!collapsed && <span className="transition-opacity duration-300">{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {/* Sign Out Button */}
        <button
          onClick={handleLogout}
          className={`flex items-center justify-center md:justify-${collapsed ? 'center' : 'start'} p-3 mb-6 mx-4 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition-all duration-300 w-[calc(100%-2rem)]`}
          style={{ minWidth: 0 }}
        >
          <span className="mr-3 text-xl flex-shrink-0"><FiLogOut /></span>
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
      {/* Overlay for mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={handleMobile}
        ></div>
      )}
    </>
  );
};

export default Sidebar;