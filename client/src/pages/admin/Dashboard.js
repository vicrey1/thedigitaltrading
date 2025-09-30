// src/pages/admin/Dashboard.js
import React, { useEffect, useState, useContext } from 'react';
import { FiUsers, FiDollarSign, FiDownload, FiActivity } from 'react-icons/fi';
import AdminCard from '../../components/admin/AdminCard';
import { getAdminStats } from '../../services/adminStatsAPI';
import { useTheme } from '../../contexts/ThemeContext';

const AdminDashboard = () => {
  const { isDarkMode } = useTheme();
  const [stats, setStats] = useState([
    { title: 'Total Users', value: '...', icon: <FiUsers />, change: '' },
    { title: 'Active Investments', value: '...', icon: <FiDollarSign />, change: '' },
    { title: 'Pending Withdrawals', value: '...', icon: <FiDownload />, change: '' },
    { title: "Today's Change", value: '...', icon: <FiActivity />, change: '' }
  ]);

  useEffect(() => {
    getAdminStats().then(data => {
      setStats([
        { title: 'Total Users', value: data.totalUsers, icon: <FiUsers />, change: '' },
        { title: 'Active Investments', value: data.totalInvestments, icon: <FiDollarSign />, change: '' },
        { title: 'Pending Withdrawals', value: data.totalWithdrawals, icon: <FiDownload />, change: '' },
        { title: "Today's Change", value: data.todayROI + '%', icon: <FiActivity />, change: '' }
      ]);
    });
  }, []);

  return (
    <div className={`max-w-screen-xl mx-auto p-2 sm:p-4 md:p-8 font-sans text-base ${isDarkMode ? 'text-gray-100 bg-black' : 'text-gray-900 bg-white'} rounded-xl shadow-lg overflow-x-hidden overflow-y-auto`}>
      <div className="space-y-8 w-full max-w-full">
        <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>Crypto Trading Admin Dashboard</h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full max-w-full">
          {stats.map((stat, index) => (
            <AdminCard 
              key={index}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              change={stat.change}
            />
          ))}
        </div>

        {/* Recent Activity */}
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-xl p-6 mb-8`}>
          <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Recent Activity</h2>
          <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Activity feed component would go here</div>
        </div>


      </div>
    </div>
  );
};

export default AdminDashboard;