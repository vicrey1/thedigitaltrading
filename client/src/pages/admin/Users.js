// src/pages/admin/Users.js
import React, { useState, useEffect } from 'react';
import { 
  FiUsers, FiUserPlus, FiMail, FiPhone, FiCalendar, 
  FiDollarSign, FiTrendingUp, FiShield, FiEdit, FiTrash2, FiEye 
} from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  AdminCard, AdminButton, AdminInput, AdminSelect, AdminTable, 
  AdminSearchBar, StatusBadge, AdminModal, LoadingSpinner 
} from '../../components/admin/AdminComponents';
import { getUsers, updateUser } from '../../services/adminAPI';

const AdminUsers = () => {
  const { isDarkMode } = useTheme();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Stats
  const [userStats, setUserStats] = useState({
    total: 0,
    active: 0,
    verified: 0,
    totalInvestments: 0
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filterStatus]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await getUsers();
      setUsers(response.data || []);
      
      // Calculate stats
      const stats = {
        total: response.data?.length || 0,
        active: response.data?.filter(user => user.status === 'active').length || 0,
        verified: response.data?.filter(user => user.isVerified).length || 0,
        totalInvestments: response.data?.reduce((sum, user) => sum + (user.totalInvestment || 0), 0) || 0
      };
      setUserStats(stats);
    } catch (error) {
      // Handle error silently or show user-friendly message
      setUsers([]);
      setUserStats({ total: 0, active: 0, verified: 0, totalInvestments: 0 });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(user => user.status === filterStatus);
    }

    setFilteredUsers(filtered);
  };

  const handleUpdateUser = async (userId, updates) => {
    try {
      await updateUser(userId, updates);
      await fetchUsers(); // Refresh data
      setShowEditModal(false);
      setEditingUser(null);
    } catch (error) {
      // Handle error silently or show user-friendly message
      alert('Failed to update user. Please try again.');
    }
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  const handleDeleteUser = (user) => {
    if (window.confirm(`Are you sure you want to delete user ${user.name}?`)) {
      // TODO: Implement delete functionality
      alert('Delete functionality not implemented yet.');
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage and monitor all user accounts
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Users
              </p>
              <p className="text-2xl font-bold mt-2">{userStats.total}</p>
            </div>
            <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600">
              <FiUsers size={24} className="text-white" />
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Active Users
              </p>
              <p className="text-2xl font-bold mt-2">{userStats.active}</p>
            </div>
            <div className="p-3 rounded-lg bg-gradient-to-r from-green-500 to-green-600">
              <FiTrendingUp size={24} className="text-white" />
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Verified Users
              </p>
              <p className="text-2xl font-bold mt-2">{userStats.verified}</p>
            </div>
            <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600">
              <FiShield size={24} className="text-white" />
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Investments
              </p>
              <p className="text-2xl font-bold mt-2">
                ${(userStats.totalInvestments / 1000).toFixed(0)}K
              </p>
            </div>
            <div className="p-3 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600">
              <FiDollarSign size={24} className="text-white" />
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Search and Filters */}
      <AdminCard>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 max-w-md">
            <AdminInput
              placeholder="Search users by name, email, or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-3">
            <AdminSelect
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'suspended', label: 'Suspended' },
                { value: 'pending', label: 'Pending' }
              ]}
              className="w-40"
            />
            
            <AdminButton variant="primary" icon={FiUserPlus}>
              Add User
            </AdminButton>
          </div>
        </div>
      </AdminCard>

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

            <div className="flex justify-end space-x-3">
              <AdminButton variant="secondary" onClick={() => setShowUserModal(false)}>
                Close
              </AdminButton>
              <AdminButton variant="primary" onClick={() => handleEditUser(selectedUser)}>
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