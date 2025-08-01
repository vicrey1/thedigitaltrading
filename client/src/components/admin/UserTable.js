// src/components/admin/UserTable.js
import React, { useState } from 'react';
import { FiSearch, FiFilter, FiEdit2, FiEye } from 'react-icons/fi';


const UserTable = ({ users, onSelectUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  // const [filters, setFilters] = useState({
  //   verified: false,
  //   active: false,
  //   kycPending: false
  // });

  // Ensure users is always an array
  const safeUsers = Array.isArray(users) ? users : [];

  const filteredUsers = safeUsers.filter(user => {
    const matchesSearch = 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase());
    // const matchesFilters = 
    //   (!filters.verified || user.verified) &&
    //   (!filters.active || user.status === 'active') &&
    //   (!filters.kycPending || user.kycStatus === 'pending');
    return matchesSearch; // && matchesFilters;
  });

  // Ensure all users have an 'id' property for consistency
  const normalizedUsers = filteredUsers.map(user => ({ ...user, id: user.id || user._id }));
  // Remove duplicate users by id
  const uniqueUsers = Array.from(new Map(normalizedUsers.map(u => [u.id, u])).values());

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="relative w-full md:w-64">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            className="w-full pl-10 pr-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="flex items-center px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600">
            <FiFilter className="mr-2" /> Filters
          </button>
          <select className="bg-gray-700 rounded-lg px-4 py-2 focus:outline-none">
            <option>Export</option>
            <option>CSV</option>
            <option>PDF</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700 text-left">
              <th className="pb-4">User</th>
              <th className="pb-4">Email</th>
              <th className="pb-4">Tier</th>
              <th className="pb-4">KYC Status</th>
              <th className="pb-4">Balance</th>
              <th className="pb-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {uniqueUsers.map(user => (
              <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-700">
                <td className="py-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center mr-3">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-gray-400">ID: {user.id}</div>
                    </div>
                  </div>
                </td>
                <td className="py-4">{user.email}</td>
                <td className="py-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    user.tier === 'VIP' ? 'bg-purple-500 bg-opacity-20 text-purple-400' :
                    user.tier === 'Gold' ? 'bg-gold bg-opacity-20 text-gold' :
                    'bg-gray-600'
                  }`}>
                    {user.tier}
                  </span>
                </td>
                <td className="py-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    user.kycStatus === 'verified' ? 'bg-green-500 bg-opacity-20 text-green-400' :
                    user.kycStatus === 'pending' ? 'bg-yellow-500 bg-opacity-20 text-yellow-400' :
                    'bg-red-500 bg-opacity-20 text-red-400'
                  }`}>
                    {user.kycStatus}
                  </span>
                </td>
                <td className="py-4 font-mono">{
                  typeof user.balance === 'number' ? `$${user.balance.toLocaleString()}` : 'N/A'
                }</td>
                <td className="py-4">
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => onSelectUser(user)}
                      className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600"
                    >
                      <FiEye />
                    </button>
                    <button className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600">
                      <FiEdit2 />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserTable;