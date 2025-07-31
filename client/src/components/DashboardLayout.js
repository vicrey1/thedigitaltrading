// src/components/DashboardLayout.js
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { FiMenu } from 'react-icons/fi';

const DashboardLayout = ({ sidebarCollapsed, setSidebarCollapsed }) => {
  return (
    <div className="flex flex-col md:flex-row h-screen bg-dark">
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <div className="flex-1 overflow-y-auto flex flex-col scrollbar-thin scrollbar-thumb-gold scrollbar-track-gray-900/60">
        {/* Global Toggle Button */}
        <div className="w-full flex items-center p-2 md:p-4 sticky top-0 z-30 bg-dark/80 backdrop-blur-md">
          {/* Only show toggle on mobile */}
          <button
            className="bg-gold text-black p-2 rounded-full shadow-lg mr-2 block md:hidden"
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            aria-label="Toggle Sidebar"
          >
            <FiMenu size={22} />
          </button>
        </div>
        <div className="flex-1 flex justify-center items-start">
          <div className="w-full max-w-screen-lg mx-auto p-4">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;