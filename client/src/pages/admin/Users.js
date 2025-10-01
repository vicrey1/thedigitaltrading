import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  FiUsers, FiUserPlus, FiMail, FiPhone, FiCalendar, 
  FiDollarSign, FiTrendingUp, FiShield, FiEdit, FiTrash2, FiEye,
  FiSearch, FiFilter, FiList, FiArrowUp, FiArrowDown,
  FiCheck, FiMoreVertical, FiX, FiRefreshCw, FiDownload
} from 'react-icons/fi';
import { AdminCard, AdminButton, AdminInput, AdminSelect, AdminTable, 
  StatusBadge, AdminModal, LoadingSpinner 
} from '../../components/admin/AdminComponents';
import { API } from '../../services/adminAPI';

const getStatusVariant = (status) => {
  switch (status) {
    case 'active': return 'success';
    case 'suspended': return 'danger';
    case 'pending': return 'warning';
    default: return 'default';
  }
};

const AdminUsers = () => {
  const { isDarkMode } = useTheme();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    verifiedUsers: 0,
    totalInvestments: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    role: 'all',
    tier: 'all'
  });
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchStats = async () => {
    try {
      const response = await API.get('/stats');
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        sort: sortField,
        direction: sortDirection,
        ...filters,
        search: searchQuery
      };

      const response = await API.get('/users', { params });
      setUsers(response.data.users);
      setTotalPages(Math.ceil(response.data.total / itemsPerPage));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [currentPage, sortField, sortDirection, filters, searchQuery]);

  // Refresh stats periodically
  useEffect(() => {
    const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleEdit = (user) => {
    // TODO: Implement edit functionality
    console.log('Edit user:', user);
  };

  const handleView = (user) => {
    // TODO: Implement view functionality
    console.log('View user:', user);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="bg-red-900/50 border border-red-500 text-red-300 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <AdminCard>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <FiUsers className="text-2xl text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Users</p>
              <h3 className="text-2xl font-bold">{stats.totalUsers}</h3>
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <FiUserPlus className="text-2xl text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Active Users</p>
              <h3 className="text-2xl font-bold">{stats.activeUsers}</h3>
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-500/10 rounded-lg">
              <FiShield className="text-2xl text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Verified Users</p>
              <h3 className="text-2xl font-bold">{stats.verifiedUsers}</h3>
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <FiTrendingUp className="text-2xl text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Investments</p>
              <h3 className="text-2xl font-bold">${(stats.totalInvestments / 1000).toFixed(1)}K</h3>
            </div>
          </div>
        </AdminCard>
      </div>

      <AdminCard>
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Users Management</h1>
          <AdminButton
            variant="primary"
            icon={<FiRefreshCw />}
            onClick={() => {
              fetchUsers();
              fetchStats();
            }}
          >
            Refresh
          </AdminButton>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <AdminInput
            icon={<FiSearch />}
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <AdminSelect
            icon={<FiFilter />}
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'pending', label: 'Pending' },
              { value: 'suspended', label: 'Suspended' }
            ]}
          />
          <AdminSelect
            icon={<FiShield />}
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
            options={[
              { value: 'all', label: 'All Roles' },
              { value: 'user', label: 'User' },
              { value: 'admin', label: 'Admin' },
              { value: 'support', label: 'Support' }
            ]}
          />
        </div>

        <AdminTable
          columns={[
            { header: 'User', field: 'name', sortable: true },
            { header: 'Email', field: 'email', sortable: true },
            { header: 'Status', field: 'status', sortable: true },
            { header: 'Role', field: 'role', sortable: true },
            { header: 'Joined', field: 'createdAt', sortable: true },
            { header: 'Actions', field: 'actions' }
          ]}
          data={users}
          onSort={handleSort}
          sortField={sortField}
          sortDirection={sortDirection}
          renderCell={(column, user) => {
            switch (column.field) {
              case 'status':
                return (
                  <StatusBadge variant={getStatusVariant(user.status)}>
                    {user.status}
                  </StatusBadge>
                );
              case 'createdAt':
                return new Date(user.createdAt).toLocaleDateString();
              case 'actions':
                return (
                  <div className="flex gap-2">
                    <AdminButton
                      variant="icon"
                      icon={<FiEdit />}
                      onClick={() => handleEdit(user)}
                    />
                    <AdminButton
                      variant="icon"
                      icon={<FiEye />}
                      onClick={() => handleView(user)}
                    />
                  </div>
                );
              default:
                return user[column.field];
            }
          }}
        />
      </AdminCard>
    </div>
  );
};

export default AdminUsers;