// src/components/admin/AdminLayout.js
import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { FiUsers, FiDollarSign, FiDownload, FiSettings, FiHome, FiBell, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useAdminAuth } from '../../auth/AdminAuthProvider';

const AdminLayout = () => {
  const { admin, logout } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true); // default open on desktop
  const [darkMode, setDarkMode] = useState(true);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className={
      `flex h-screen font-sans text-base relative transition-colors duration-300 ${darkMode ? 'bg-black text-gray-100' : 'bg-white text-gray-900'}`
    }>
      {/* Theme Toggle Button */}
      <button
        className="fixed top-6 right-6 z-50 bg-gray-900 bg-opacity-80 p-2 rounded-lg text-gold hover:bg-gray-800 transition md:right-8"
        onClick={() => setDarkMode((prev) => !prev)}
        aria-label="Toggle theme"
      >
        {darkMode ? (
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-sun"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        ) : (
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-moon"><path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z"/></svg>
        )}
      </button>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      {/* Sidebar */}
      <aside
        className={`fixed md:static top-0 left-0 h-full ${sidebarOpen ? 'w-64' : 'w-16'} ${darkMode ? 'bg-gradient-to-b from-gray-950 to-gray-900 border-gray-800' : 'bg-gradient-to-b from-gray-100 to-white border-gray-200'} border-r shadow-lg z-40 transform ${sidebarOpen || isMobile ? 'translate-x-0' : '-translate-x-full'} transition-all duration-300 ease-in-out flex flex-col`}
        style={{ pointerEvents: sidebarOpen || isMobile ? 'auto' : 'none' }}
        aria-hidden={!sidebarOpen && isMobile}
      >
        <div className={`flex items-center h-20 px-4 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <span className={`text-2xl font-extrabold tracking-widest ${darkMode ? 'text-gold' : 'text-yellow-700'} transition-all duration-300 ${!sidebarOpen ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}>LUXHEDGE</span>
          <button className="ml-auto text-gray-400 hover:text-gold" onClick={() => setSidebarOpen(false)} style={{display: sidebarOpen && !isMobile ? 'block' : 'none'}} aria-label="Collapse sidebar">
            <FiChevronLeft size={24} />
          </button>
          <button className="ml-auto md:hidden text-gray-400 hover:text-gold" onClick={() => setSidebarOpen(false)} style={{display: isMobile ? 'block' : 'none'}}>&times;</button>
        </div>
        <nav className={`flex-1 py-8 ${sidebarOpen ? 'px-4' : 'px-1'} space-y-2 overflow-y-auto`}>
          <Link to="/admin" className="flex items-center px-4 py-3 rounded-lg transition hover:bg-gray-800 text-gray-200 hover:text-gold font-medium">
            <FiHome className="mr-3 text-lg" /> Dashboard
          </Link>
          <Link to="/admin/users" className="flex items-center px-4 py-3 rounded-lg transition hover:bg-gray-800 text-gray-200 hover:text-gold font-medium">
            <FiUsers className="mr-3 text-lg" /> Users
          </Link>
          <Link to="/admin/funds" className="flex items-center px-4 py-3 rounded-lg transition hover:bg-gray-800 text-gray-200 hover:text-gold font-medium">
            <FiDollarSign className="mr-3 text-lg" /> Funds
          </Link>
          <Link to="/admin/deposits" className="flex items-center px-4 py-3 rounded-lg transition hover:bg-gray-800 text-gray-200 hover:text-gold font-medium">
            <FiDollarSign className="mr-3 text-lg" /> Deposits
          </Link>
          <Link to="/admin/withdrawals" className="flex items-center px-4 py-3 rounded-lg transition hover:bg-gray-800 text-gray-200 hover:text-gold font-medium">
            <FiDownload className="mr-3 text-lg" /> Withdrawals
          </Link>
          <Link to="/admin/settings" className="flex items-center px-4 py-3 rounded-lg transition hover:bg-gray-800 text-gray-200 hover:text-gold font-medium">
            <FiSettings className="mr-3 text-lg" /> Settings
          </Link>
          <Link to="/admin/send-email" className="flex items-center px-4 py-3 rounded-lg transition hover:bg-gray-800 text-gray-200 hover:text-gold font-medium">
            <FiSettings className="mr-3 text-lg" /> Send Email
          </Link>
          <Link to="/admin/announcements" className="flex items-center px-4 py-3 rounded-lg transition hover:bg-gray-800 text-gray-200 hover:text-gold font-medium">
            <FiBell className="mr-3 text-lg" /> Announcements
          </Link>
          <Link to="/admin/support" className="flex items-center px-4 py-3 rounded-lg transition hover:bg-gray-800 text-gray-200 hover:text-gold font-medium">
            <FiBell className="mr-3 text-lg" /> Support Chat
          </Link>
          <Link to="/admin/mirror" className="flex items-center px-4 py-3 rounded-lg transition hover:bg-gray-800 text-gray-200 hover:text-gold font-medium">
            <FiUsers className="mr-3 text-lg" /> Mirror User
          </Link>
          <Link to="/admin/roi-approvals" className="flex items-center px-4 py-3 rounded-lg transition hover:bg-gray-800 text-gray-200 hover:text-gold font-medium">
            <FiSettings className="mr-3 text-lg" /> ROI Approvals
          </Link>
        </nav>
        <div className={`px-4 py-6 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'} flex items-center transition-all duration-300 ${!sidebarOpen ? 'justify-center' : ''}`}>
          <div className={`w-10 h-10 rounded-full ${darkMode ? 'bg-gray-700 text-gold' : 'bg-gray-200 text-yellow-700'} flex items-center justify-center text-lg font-bold ${!sidebarOpen ? 'mx-auto' : 'mr-3'}`}>
            {admin?.name?.charAt(0) || 'A'}
          </div>
          {sidebarOpen && (
            <div className={`${darkMode ? 'text-gray-200' : 'text-gray-900'} flex-1`}>
              <div className="font-semibold">{admin?.name || 'Admin'}</div>
              <div className="text-xs text-gray-500">Administrator</div>
            </div>
          )}
          {sidebarOpen && (
            <button
              onClick={logout}
              className={`ml-4 px-4 py-2 rounded-lg font-semibold transition ${darkMode ? 'bg-gray-900 text-red-400 hover:bg-red-900 hover:text-white' : 'bg-gray-100 text-red-600 hover:bg-red-200 hover:text-white'}`}
            >
              Logout
            </button>
          )}
        </div>
      </aside>
      {/* Sidebar Toggle Button (Mobile & Desktop Collapsed) */}
      {!sidebarOpen && (
        <button
          className="fixed top-6 left-4 z-50 bg-gray-900 bg-opacity-80 p-2 rounded-lg text-gold hover:bg-gray-800 transition"
          onClick={() => setSidebarOpen(true)}
          aria-label="Expand sidebar"
        >
          <FiChevronRight size={24} />
        </button>
      )}
      {/* Main Content */}
      <main
        className={`flex-1 h-screen ${darkMode ? 'bg-black text-gray-100' : 'bg-white text-gray-900'} overflow-y-auto p-0 flex flex-col transition-all duration-300`}
        style={{ marginLeft: sidebarOpen ? '16rem' : '4rem', transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)' }}
      >
        <div className="w-full max-w-6xl mx-auto flex-1 flex flex-col min-h-screen p-4 md:p-8 lg:p-12 xl:p-16 2xl:p-20">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;