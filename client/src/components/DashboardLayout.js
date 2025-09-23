// src/components/DashboardLayout.js
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const DashboardLayout = ({ sidebarCollapsed, setSidebarCollapsed }) => {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <div 
        className={`
          flex-1 overflow-y-auto flex flex-col scrollbar-thin scrollbar-thumb-orange scrollbar-track-gray-900/60
          transition-all duration-300 ease-in-out
          ${sidebarCollapsed ? 'ml-16' : 'ml-72'}
          md:${sidebarCollapsed ? 'ml-16' : 'ml-72'}
          max-md:ml-0
        `}
      >
        {/* Main content area with responsive padding */}
        <div className="flex-1 flex justify-center items-start min-h-screen">
          <div className="w-full max-w-screen-xl mx-auto p-4 sm:p-6 md:p-8 lg:p-10">
            <div className="animate-fadeIn">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;