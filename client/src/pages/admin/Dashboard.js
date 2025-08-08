// src/pages/admin/Dashboard.js
import React, { useEffect, useState } from 'react';
import { FiUsers, FiDollarSign, FiDownload, FiActivity } from 'react-icons/fi';
import AdminCard from '../../components/admin/AdminCard';
import { getAdminStats } from '../../services/adminStatsAPI';

const AdminDashboard = () => {
  const [stats, setStats] = useState([
    { title: 'Total Users', value: '...', icon: <FiUsers />, change: '' },
    { title: 'Active Investments', value: '...', icon: <FiDollarSign />, change: '' },
    { title: 'Pending Withdrawals', value: '...', icon: <FiDownload />, change: '' },
    { title: "Today's ROI", value: '...', icon: <FiActivity />, change: '' }
  ]);

  useEffect(() => {
    getAdminStats().then(data => {
      setStats([
        { title: 'Total Users', value: data.totalUsers, icon: <FiUsers />, change: '' },
        { title: 'Active Investments', value: data.totalInvestments, icon: <FiDollarSign />, change: '' },
        { title: 'Pending Withdrawals', value: data.totalWithdrawals, icon: <FiDownload />, change: '' },
        { title: "Today's ROI", value: data.todayROI + '%', icon: <FiActivity />, change: '' }
      ]);
    });
  }, []);

  return (
    <div className="max-w-screen-xl mx-auto p-2 sm:p-4 md:p-8 font-sans text-base text-gray-100 bg-black rounded-xl shadow-lg overflow-x-hidden overflow-y-auto">
      <div className="space-y-8 w-full max-w-full">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-full overflow-x-auto">
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
        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 text-white">Recent Activity</h2>
          <div className="text-gray-300">Activity feed component would go here</div>
        </div>

        {/* Support Chat Panel */}
        <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200 shadow">
          <h2 className="text-xl font-bold mb-4 text-yellow-700 flex items-center gap-2">Support Chat <span className="text-base font-normal text-yellow-500">(Admin)</span></h2>
          <div className="mb-4 text-yellow-900">View and reply to user support messages in real time.</div>
          <a href="/admin/support" className="inline-block bg-yellow-400 text-yellow-900 font-bold px-6 py-2 rounded-lg shadow hover:bg-yellow-500 transition">Go to Support Chat Panel</a>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;