// src/pages/admin/Users.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FiUsers, FiUserPlus, FiMail, FiPhone, FiCalendar, 
  FiDollarSign, FiTrendingUp, FiShield, FiEdit, FiTrash2, FiEye,
  FiSearch, FiFilter, FiList, FiArrowUp, FiArrowDown,
  FiCheck, FiMoreVertical, FiX, FiRefreshCw, FiDownload
} from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  AdminCard, AdminButton, AdminInput, AdminSelect, AdminTable, 
  StatusBadge, AdminModal, LoadingSpinner 
} from '../../components/admin/AdminComponents';

// API base URL configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || '';
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const getStatusVariant = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'suspended': return 'danger';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  // Define table structure
  const columns = [
    {
      header: 'User',
      key: 'user',
      sortable: true,
      render: (user) => (
        <div className="flex items-center space-x-3">
          <div>
            <div className="font-medium">{user.name || 'N/A'}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Username',
      key: 'username',
      sortable: true,
      render: (user) => user.username || 'N/A'
    },
    {
      header: 'Status',
      key: 'status',
      sortable: true,
      render: (user) => <StatusBadge status={user.status} />
    },
    {
      header: 'Total Investment',
      key: 'totalInvestment',
      sortable: true,
      render: (user) => `$${(user.totalInvestment || 0).toLocaleString()}`
    },
    {
      header: 'Verified',
      key: 'verified',
      sortable: true,
      render: (user) => (
        <span className={`px-2 py-1 rounded ${user.isVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {user.isVerified ? 'Yes' : 'No'}
        </span>
      )
    },
    {
      header: 'Joined',
      key: 'createdAt',
      sortable: true,
      render: (user) => new Date(user.createdAt).toLocaleDateString()
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (user) => (
        <div className="flex space-x-2">
          <AdminButton
            onClick={() => handleViewUser(user)}
            icon={<FiEye />}
            variant="info"
            size="sm"
            tooltip="View Details"
          />
          <AdminButton
            onClick={() => handleEditUser(user)}
            icon={<FiEdit />}
            variant="secondary"
            size="sm"
            tooltip="Edit User"
          />
          <AdminButton
            onClick={() => handleDeleteUser(user)}
            icon={<FiTrash2 />}
            variant="danger"
            size="sm"
            tooltip="Delete User"
          />
        </div>
      )
    }
  ];inCard, AdminButton, AdminInput, AdminSelect, AdminTable, 
  StatusBadge, AdminModal, LoadingSpinner 
} from '../../components/admin/AdminComponents';
import { getUsers, updateUser } from '../../services/adminAPI';

const AdminUsers = () => {
  const { isDarkMode } = useTheme();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [actionMenuUser, setActionMenuUser] = useState(null);

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionMenuUser && !event.target.closest('.action-menu')) {
        setActionMenuUser(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [actionMenuUser]);

  // Stats
  const [userStats, setUserStats] = useState({
    total: 0,
    active: 0,
    verified: 0,
    totalInvestments: 0
  });

  useEffect(() => {
    fetchUsers();
  // Only fetch users once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filterAndSortUsers();
  // Include all dependencies that filterAndSortUsers depends on
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, searchTerm, filterStatus, sortField, sortOrder]);

  const filterAndSortUsers = () => {
    let filtered = [...users];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(user => user.status === filterStatus);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Handle dates
      if (sortField === 'createdAt' || sortField === 'lastLogin') {
        aVal = new Date(aVal || 0);
        bVal = new Date(bVal || 0);
      }

      // Handle null values
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      // Compare values
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredUsers(filtered);
  };

  const fetchUsers = async () => {
    try {
      console.log('Fetching users...');
      setLoading(true);
      setError(null);

      // Verify admin token
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        throw new Error('No admin token found. Please log in again.');
      }

      const response = await api.get('/api/admin/users', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      const data = response.data;
      console.log('Received users data:', data);

      if (!data || !data.users) {
        throw new Error('Invalid response format from server');
      }

      setUsers(data.users);
      
      // Calculate stats
      const stats = {
        total: data.users.length,
        active: data.users.filter(user => user.status === 'active').length,
        verified: data.users.filter(user => user.isVerified).length,
        totalInvestments: data.users.reduce((sum, user) => sum + (parseFloat(user.totalInvestment) || 0), 0)
      };
      setUserStats(stats);

      // Initialize filtered users
      setFilteredUsers(data.users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setError(error.response?.data?.message || error.message || 'Failed to fetch users');
      setUsers([]);
      setFilteredUsers([]);
      setUserStats({ total: 0, active: 0, verified: 0, totalInvestments: 0 });

      // Handle specific error cases
      if (error.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else if (error.response?.status === 403) {
        setError('You do not have permission to view users.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (userData) => {
    try {
      setLoading(true);
      const adminToken = localStorage.getItem('adminToken');
      
      const response = await axios.post('/api/admin/users', userData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      if (response.data) {
        setUsers(prevUsers => [...prevUsers, response.data]);
        setShowEditModal(false);
        setEditingUser(null);
      }
    } catch (error) {
      console.error('Failed to add user:', error);
      setError(error.response?.data?.message || 'Failed to add user');
    } finally {
      setLoading(false);
    }
  };
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    if (!Array.isArray(users)) {
      console.error('Users is not an array:', users);
      setFilteredUsers([]);
      return;
    }

    let filtered = [...users];

    try {
      // Apply search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filtered = filtered.filter(user =>
          (user.name?.toLowerCase().includes(searchLower)) ||
          (user.email?.toLowerCase().includes(searchLower))
        );
      }

      // Apply status filter
      if (filterStatus !== 'all') {
        filtered = filtered.filter(user => user.status === filterStatus);
      }

      // Apply sorting
      const compareValues = (a, b) => {
        let aVal = a[sortField];
        let bVal = b[sortField];

        // Handle dates
        if (sortField === 'createdAt' || sortField === 'lastLogin') {
          aVal = new Date(aVal || 0).getTime();
          bVal = new Date(bVal || 0).getTime();
        }

        // Handle numbers
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
        }

        // Handle strings
        aVal = String(aVal || '').toLowerCase();
        bVal = String(bVal || '').toLowerCase();
        
        return sortOrder === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      };

      filtered.sort(compareValues);
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase().trim();
        filtered = filtered.filter(user => {
          return (
            (user.name || '').toLowerCase().includes(searchLower) ||
            (user.email || '').toLowerCase().includes(searchLower) ||
            (user.username || '').toLowerCase().includes(searchLower)
          );
        });
      }

      // Status filter
      if (filterStatus && filterStatus !== 'all') {
        filtered = filtered.filter(user => user.status === filterStatus);
      }

      // Sort users by registration date (newest first)
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      console.error('Error filtering users:', error);
      filtered = [];
    }

    setFilteredUsers(filtered);
  };

  const handleUpdateUser = async (userId, updates) => {
    if (!userId || !updates) {
      alert('Invalid user data provided');
      return;
    }

    try {
      setLoading(true);
      await updateUser(userId, updates);
      
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded shadow-lg';
      successMessage.textContent = 'User updated successfully';
      document.body.appendChild(successMessage);
      setTimeout(() => successMessage.remove(), 3000);

      // Refresh data
      await fetchUsers();
      setShowEditModal(false);
      setEditingUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
      alert(error.response?.data?.message || 'Failed to update user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(current => current === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  const handleDeleteUser = async (user) => {
    if (!user || !user._id) {
      alert('Invalid user selected');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete user ${user.name || user.email}? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      await API.delete(`/users/${user._id}`);
      
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded shadow-lg';
      successMessage.textContent = 'User deleted successfully';
      document.body.appendChild(successMessage);
      setTimeout(() => successMessage.remove(), 3000);

      // Refresh user list
      await fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(error.response?.data?.message || 'Failed to delete user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'suspended': return 'danger';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const columns = [
    {
      header: 'Name',
      key: 'name',
      sortable: true,
      render: (user) => user.name || 'N/A'
    },
    {
      header: 'Email',
      key: 'email',
      sortable: true,
      render: (user) => user.email
    },
    {
      header: 'Status',
      key: 'status',
      sortable: true,
      render: (user) => <StatusBadge status={user.status} />
    },
    {
      header: 'Last Login',
      key: 'lastLogin',
      sortable: true,
      render: (user) => user.lastLogin 
        ? new Date(user.lastLogin).toLocaleDateString()
        : 'Never'
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (user) => (
        <div className="flex space-x-2">
          <AdminButton
            onClick={() => handleViewUser(user)}
            icon={<FiEye />}
            variant="info"
            size="sm"
            tooltip="View Details"
          />
          <AdminButton
            onClick={() => handleEditUser(user)}
            icon={<FiEdit />}
            variant="secondary"
            size="sm"
            tooltip="Edit User"
          />
          <AdminButton
            onClick={() => handleDeleteUser(user)}
            icon={<FiTrash2 />}
            variant="danger"
            size="sm"
            tooltip="Delete User"
          />
        </div>
      )
    }
  ];

  // Define the table structure
  const columns = [
    {
      header: 'User',
      key: 'user',
      sortable: true,
      sortField: 'name',
      render: (user) => (
        <div className="flex items-center">
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-3 relative
            ${user.isVerified 
              ? 'bg-gradient-to-r from-green-400 to-green-600'
              : user.status === 'suspended'
              ? 'bg-gradient-to-r from-red-400 to-red-600'
              : 'bg-gradient-to-r from-blue-400 to-blue-600'
            }
          `}>
            {user.name?.charAt(0) || 'U'}
            {user.isVerified && (
              <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                <FiCheck size={8} className="text-white" />
              </div>
            )}
          </div>
          <div>
            <div className="font-medium flex items-center">
              {user.name || 'N/A'}
              {user.vipTier > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                  VIP {user.vipTier}
                </span>
              )}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {user.email}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Status & Verification',
      key: 'status',
      sortable: true,
      render: (user) => (
        <div className="space-y-2">
          <StatusBadge 
            status={user.status} 
            variant={
              user.status === 'active' ? 'success' :
              user.status === 'suspended' ? 'danger' :
              user.status === 'pending' ? 'warning' : 'default'
            }
          />
          <div className="flex flex-wrap gap-1">
            {user.isVerified && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                Verified
              </span>
            )}
            {user.kycVerified && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                KYC
              </span>
            )}
            {user.hasMFA && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                2FA
              </span>
            )}
          </div>
        </div>
      )
    },
    {
      header: 'Activity',
      key: 'activity',
      sortable: true,
      sortField: 'lastLogin',
      render: (user) => (
        <div className="space-y-1">
          <div className="text-sm">
            Last Login: {user.lastLogin 
              ? new Date(user.lastLogin).toLocaleDateString()
              : 'Never'
            }
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Joined: {new Date(user.createdAt).toLocaleDateString()}
          </div>
          {user.lastLogin && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {user.loginCount || 0} total logins
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Investments',
      key: 'investments',
      sortable: true,
      sortField: 'totalInvestment',
      render: (user) => (
        <div className="space-y-1">
          <div className="font-medium">
            ${(user.totalInvestment || 0).toLocaleString()}
          </div>
          {user.activeInvestments > 0 && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {user.activeInvestments} active investments
            </div>
          )}
          {user.lastInvestmentDate && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Last: {new Date(user.lastInvestmentDate).toLocaleDateString()}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (user) => (
        <div className="flex items-center space-x-2">
          <AdminButton
            onClick={() => handleViewUser(user)}
            icon={<FiEye />}
            variant="info"
            size="sm"
            tooltip="View Details"
          />
          <AdminButton
            onClick={() => handleEditUser(user)}
            icon={<FiEdit />}
            variant="secondary"
            size="sm"
            tooltip="Edit User"
          />
          <div className="relative">
            <AdminButton
              onClick={() => setActionMenuUser(user)}
              icon={<FiMoreVertical />}
              variant="secondary"
              size="sm"
              tooltip="More Actions"
            />
            {actionMenuUser?._id === user._id && (
              <div className={`
                absolute right-0 mt-2 w-48 rounded-md shadow-lg z-10
                ${isDarkMode ? 'bg-gray-800' : 'bg-white'}
                border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}
              `}>
                <div className="py-1">
                  <button
                    onClick={() => window.location.href = `/admin/mirror/${user._id}`}
                    className={`
                      flex items-center w-full px-4 py-2 text-sm
                      ${isDarkMode 
                        ? 'text-gray-300 hover:bg-gray-700' 
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <FiEye className="mr-3" /> Mirror User View
                  </button>
                  <button
                    onClick={() => window.location.href = `/admin/investments/${user._id}`}
                    className={`
                      flex items-center w-full px-4 py-2 text-sm
                      ${isDarkMode 
                        ? 'text-gray-300 hover:bg-gray-700' 
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <FiTrendingUp className="mr-3" /> View Investments
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user)}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <FiTrash2 className="mr-3" /> Delete User
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )
    }

    {
      key: 'name',
      title: 'User',
      render: (value, user) => (
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
            {user.name?.charAt(0) || 'U'}
          </div>
          <div>
            <div className="font-semibold">{user.name || 'N/A'}</div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {user.email}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'username',
      title: 'Username',
      render: (value) => value || 'N/A'
    },
    {
      key: 'status',
      title: 'Status',
      render: (value) => (
        <StatusBadge 
          status={value || 'pending'} 
          variant={getStatusVariant(value)} 
        />
      )
    },
    {
      key: 'totalInvestment',
      title: 'Total Investment',
      render: (value) => `$${(value || 0).toLocaleString()}`
    },
    {
      key: 'isVerified',
      title: 'Verified',
      render: (value) => (
        <StatusBadge 
          status={value ? 'Verified' : 'Unverified'} 
          variant={value ? 'success' : 'warning'} 
        />
      )
    },
    {
      key: 'createdAt',
      title: 'Joined',
      render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A'
    }
  ];

  const actions = [
    {
      icon: FiEye,
      title: 'View Details',
      onClick: handleViewUser,
      variant: 'default'
    },
    {
      icon: FiEdit,
      title: 'Edit User',
      onClick: handleEditUser,
      variant: 'default'
    },
    {
      icon: FiTrash2,
      title: 'Delete User',
      onClick: handleDeleteUser,
      variant: 'danger'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage and monitor all user accounts
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminCard className="transform transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Users
              </p>
              <p className="text-2xl font-bold mt-2">{userStats.total}</p>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <span className="text-green-500">+{userStats.newUsersToday || 0}</span> today
              </p>
            </div>
            <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600">
              <FiUsers size={24} className="text-white" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}">
            <div className="flex items-center justify-between text-sm">
              <span>Growth Rate</span>
              <span className="text-green-500 flex items-center">
                <FiArrowUp className="mr-1" size={12} />
                {((userStats.newUsersLastWeek / userStats.total) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </AdminCard>

        <AdminCard className="transform transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Active Users
              </p>
              <p className="text-2xl font-bold mt-2">{userStats.active}</p>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {((userStats.active / userStats.total) * 100).toFixed(1)}% of total
              </p>
            </div>
            <div className="p-3 rounded-lg bg-gradient-to-r from-green-500 to-green-600">
              <FiTrendingUp size={24} className="text-white" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}">
            <div className="flex items-center justify-between text-sm">
              <span>Active Last 24h</span>
              <span className="font-medium">{userStats.activeToday || 0} users</span>
            </div>
          </div>
        </AdminCard>

        <AdminCard className="transform transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Verified Users
              </p>
              <p className="text-2xl font-bold mt-2">{userStats.verified}</p>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {((userStats.verified / userStats.total) * 100).toFixed(1)}% verification rate
              </p>
            </div>
            <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600">
              <FiShield size={24} className="text-white" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}">
            <div className="flex items-center justify-between text-sm">
              <span>Pending Verification</span>
              <span className="text-orange-500 font-medium">{userStats.pendingVerification || 0}</span>
            </div>
          </div>
        </AdminCard>

        <AdminCard className="transform transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Investments
              </p>
              <p className="text-2xl font-bold mt-2">
                ${(userStats.totalInvestments / 1000).toFixed(1)}K
              </p>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Avg. ${(userStats.totalInvestments / userStats.active || 0).toFixed(0)} per user
              </p>
            </div>
            <div className="p-3 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600">
              <FiDollarSign size={24} className="text-white" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}">
            <div className="flex items-center justify-between text-sm">
              <span>Active Investors</span>
              <span className="text-orange-500 font-medium">
                {userStats.activeInvestors || 0} ({((userStats.activeInvestors / userStats.active) * 100).toFixed(1)}%)
              </span>
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminButton
          variant="secondary"
          icon={FiUserPlus}
          onClick={() => {
            setEditingUser({});
            setShowEditModal(true);
          }}
          className="w-full py-4"
        >
          Add New User
        </AdminButton>

        <AdminButton
          variant="secondary"
          icon={FiShield}
          onClick={() => setFilterStatus('pending')}
          className="w-full py-4"
        >
          Pending Verifications ({userStats.pendingVerification || 0})
        </AdminButton>

        <AdminButton
          variant="secondary"
          icon={FiMail}
          className="w-full py-4"
          onClick={() => window.location.href = '/admin/send-email'}
        >
          Send Mass Email
        </AdminButton>

        <AdminButton
          variant="secondary"
          icon={FiDownload}
          className="w-full py-4"
          onClick={() => {
            // TODO: Implement export functionality
            alert('Export functionality coming soon!');
          }}
        >
          Export Users
        </AdminButton>
      </div>

      {/* Search and Filters */}
      <AdminCard>
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <AdminInput
                placeholder="Search users by name, email, or username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<FiSearch />}
                className="w-full"
              />
            </div>
            <div className="flex items-center gap-2">
              <AdminButton 
                variant="secondary"
                icon={<FiRefreshCw className={loading ? 'animate-spin' : ''} />}
                onClick={fetchUsers}
                disabled={loading}
              >
                Refresh
              </AdminButton>
              <AdminSelect
                value={sortField}
                onChange={(e) => {
                  setSortField(e.target.value);
                  setSortOrder('desc');
                }}
                options={[
                  { value: 'createdAt', label: 'Join Date' },
                  { value: 'lastLogin', label: 'Last Login' },
                  { value: 'name', label: 'Name' },
                  { value: 'totalInvestment', label: 'Investment' }
                ]}
                className="w-40"
              />
              <AdminButton
                variant="secondary"
                icon={sortOrder === 'asc' ? <FiArrowUp /> : <FiArrowDown />}
                onClick={() => setSortOrder(current => current === 'asc' ? 'desc' : 'asc')}
              />
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2">
            <AdminButton 
              variant={filterStatus === 'all' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilterStatus('all')}
            >
              All Users
            </AdminButton>
            <AdminButton 
              variant={filterStatus === 'active' ? 'success' : 'secondary'}
              size="sm"
              onClick={() => setFilterStatus('active')}
            >
              Active ({userStats.active})
            </AdminButton>
            <AdminButton 
              variant={filterStatus === 'pending' ? 'warning' : 'secondary'}
              size="sm"
              onClick={() => setFilterStatus('pending')}
            >
              Pending ({userStats.pendingVerification || 0})
            </AdminButton>
            <AdminButton 
              variant={filterStatus === 'suspended' ? 'danger' : 'secondary'}
              size="sm"
              onClick={() => setFilterStatus('suspended')}
            >
              Suspended ({userStats.suspended || 0})
            </AdminButton>
            <AdminButton 
              variant={filterStatus === 'verified' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilterStatus('verified')}
            >
              Verified ({userStats.verified})
            </AdminButton>
            <AdminButton 
              variant={filterStatus === 'investors' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilterStatus('investors')}
            >
              Investors ({userStats.activeInvestors || 0})
            </AdminButton>
          </div>
          
          {/* Active Filters Summary */}
          {(searchTerm || filterStatus !== 'all') && (
            <div className="flex items-center gap-2 text-sm">
              <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                Showing {filteredUsers.length} of {userStats.total} users
              </span>
              {filterStatus !== 'all' && (
                <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                  Status: {filterStatus}
                </span>
              )}
              {searchTerm && (
                <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                  Search: {searchTerm}
                </span>
              )}
              <AdminButton
                variant="secondary"
                size="xs"
                icon={<FiX />}
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                }}
              >
                Clear All
              </AdminButton>
            </div>
          )}
        </div>
      </AdminCard>

      {/* API Error (if any) */}
      {error && (
        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-red-600">Failed to load users</p>
              <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{error}</p>
            </div>
            <div className="ml-4">
              <AdminButton variant="primary" onClick={fetchUsers}>
                Retry
              </AdminButton>
            </div>
          </div>
        </AdminCard>
      )}

      {/* Users Table */}
      <AdminTable
        columns={columns}
        data={filteredUsers}
        actions={actions}
        loading={loading}
      />

      {/* User Details Modal */}
      <AdminModal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        title="User Details"
        size="lg"
      >
        {selectedUser && (
          <div className="space-y-6">
            <div className="flex items-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-xl mr-4">
                {selectedUser.name?.charAt(0) || 'U'}
              </div>
              <div>
                <h3 className="text-xl font-semibold">{selectedUser.name}</h3>
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  {selectedUser.email}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Personal Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <FiMail className="mr-2" size={16} />
                    <span>{selectedUser.email}</span>
                  </div>
                  <div className="flex items-center">
                    <FiPhone className="mr-2" size={16} />
                    <span>{selectedUser.phone || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center">
                    <FiCalendar className="mr-2" size={16} />
                    <span>Joined {new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Account Status</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Status:</span>
                    <StatusBadge 
                      status={selectedUser.status || 'pending'} 
                      variant={getStatusVariant(selectedUser.status)} 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Verified:</span>
                    <StatusBadge 
                      status={selectedUser.isVerified ? 'Yes' : 'No'} 
                      variant={selectedUser.isVerified ? 'success' : 'warning'} 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Total Investment:</span>
                    <span className="font-semibold">
                      ${(selectedUser.totalInvestment || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end sm:space-x-3 gap-2">
              <AdminButton variant="secondary" onClick={() => setShowUserModal(false)} className="w-full sm:w-auto">
                Close
              </AdminButton>
              <AdminButton variant="primary" onClick={() => handleEditUser(selectedUser)} className="w-full sm:w-auto">
                Edit User
              </AdminButton>
            </div>
          </div>
        )}
      </AdminModal>

      {/* Edit User Modal */}
      <AdminModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit User"
        size="md"
      >
        {editingUser && (
          <div className="space-y-4">
            <AdminInput
              label="Name"
              value={editingUser.name || ''}
              onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
            />
            
            <AdminInput
              label="Email"
              type="email"
              value={editingUser.email || ''}
              onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
            />
            
            <AdminSelect
              label="Status"
              value={editingUser.status || 'pending'}
              onChange={(e) => setEditingUser({...editingUser, status: e.target.value})}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'suspended', label: 'Suspended' },
                { value: 'pending', label: 'Pending' }
              ]}
            />

            <div className="flex justify-end space-x-3 mt-6">
              <AdminButton variant="secondary" onClick={() => setShowEditModal(false)}>
                Cancel
              </AdminButton>
              <AdminButton 
                variant="primary" 
                onClick={() => handleUpdateUser(editingUser._id, editingUser)}
              >
                Save Changes
              </AdminButton>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
};

export default AdminUsers;