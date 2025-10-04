// src/components/admin/Users.js
import React, { useState, useEffect, useCallback } from 'react';
import { FiSearch, FiFilter, FiDownload, FiEye } from 'react-icons/fi';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AdminCard, AdminButton, AdminInput, AdminSelect } from './AdminComponents';
import UserDetail from './UserDetail';
import { fetchUsers, exportUsers } from '../../services/adminAPI';
import { useTheme } from '../../contexts/ThemeContext';

const Users = () => {
  const { isDarkMode } = useTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchUsers({
        page: currentPage,
        limit: pageSize,
        search: searchTerm,
        status: filterStatus !== 'all' ? filterStatus : undefined
      });
      setUsers(response.users);
      setTotalPages(Math.ceil(response.total / pageSize));
    } catch (err) {
      setError('Failed to load users');
      toast.error('Failed to load users');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, filterStatus]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleExport = async () => {
    try {
      await exportUsers();
      toast.success('Users exported successfully');
    } catch (err) {
      toast.error('Failed to export users');
      console.error('Error exporting users:', err);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleFilterChange = (e) => {
    setFilterStatus(e.target.value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
  };

  const handleCloseUserDetail = () => {
    setSelectedUser(null);
  };

  const handleUserUpdate = () => {
    loadUsers(); // Reload the users list after an update
  };

  if (error) {
    return (
      <AdminCard className="p-8 text-center">
        <p className={`text-lg ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
        <AdminButton
          variant="primary"
          className="mt-4"
          onClick={loadUsers}
        >
          Retry
        </AdminButton>
      </AdminCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
          User Management
        </h1>
        <AdminButton
          variant="secondary"
          icon={FiDownload}
          onClick={handleExport}
        >
          Export Users
        </AdminButton>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <AdminInput
          placeholder="Search users..."
          icon={FiSearch}
          value={searchTerm}
          onChange={handleSearch}
          className="flex-1"
        />
        <AdminSelect
          value={filterStatus}
          onChange={handleFilterChange}
          icon={FiFilter}
          className="w-full sm:w-48"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="suspended">Suspended</option>
        </AdminSelect>
      </div>

      {/* Users List */}
      <AdminCard className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={`text-left ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <th className="p-4">User</th>
              <th className="p-4">Email</th>
              <th className="p-4">Status</th>
              <th className="p-4">KYC Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="text-center p-4">
                  Loading...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center p-4">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user._id}
                  className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
                >
                  <td className="p-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-300 mr-3" />
                      <span>{user.name || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="p-4">{user.email}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      user.status === 'active' ? 'bg-green-500 bg-opacity-20 text-green-500' :
                      user.status === 'suspended' ? 'bg-red-500 bg-opacity-20 text-red-500' :
                      'bg-yellow-500 bg-opacity-20 text-yellow-500'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      user.kycStatus === 'verified' ? 'bg-green-500 bg-opacity-20 text-green-500' :
                      user.kycStatus === 'rejected' ? 'bg-red-500 bg-opacity-20 text-red-500' :
                      'bg-yellow-500 bg-opacity-20 text-yellow-500'
                    }`}>
                      {user.kycStatus}
                    </span>
                  </td>
                  <td className="p-4">
                    <AdminButton
                      variant="outline"
                      size="sm"
                      icon={FiEye}
                      onClick={() => handleViewUser(user)}
                    >
                      View
                    </AdminButton>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </AdminCard>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => (
            <AdminButton
              key={i + 1}
              variant={currentPage === i + 1 ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </AdminButton>
          ))}
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <UserDetail
          user={selectedUser}
          onClose={handleCloseUserDetail}
          onUpdate={handleUserUpdate}
        />
      )}
    </div>
  );
};

export default Users;