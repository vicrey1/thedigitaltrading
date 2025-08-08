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
        {/* ...existing code... */}
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