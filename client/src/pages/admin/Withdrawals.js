// src/pages/admin/Withdrawals.js
import React, { useState, useEffect } from 'react';
import { 
  FiDollarSign, FiClock, FiCheck, FiX, FiEye,
  FiDownload, FiRefreshCw, FiAlertCircle, FiTrendingDown,
  FiCalendar, FiUser, FiCreditCard
} from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  AdminCard, AdminButton, AdminInput, AdminSelect, AdminTable, 
  StatusBadge, AdminModal, LoadingSpinner 
} from '../../components/admin/AdminComponents';
import { getWithdrawals, updateWithdrawal } from '../../services/withdrawalAPI';

const AdminWithdrawals = () => {
  const { isDarkMode } = useTheme();
  const [withdrawals, setWithdrawals] = useState([]);
  const [filteredWithdrawals, setFilteredWithdrawals] = useState([]);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [processingWithdrawal, setProcessingWithdrawal] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchAction, setBatchAction] = useState(null);

  const [filters, setFilters] = useState({
    status: 'all',
    currency: 'all',
    dateRange: '30days',
    amountRange: 'all'
  });

  // Stats
  const [withdrawalStats, setWithdrawalStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    rejected: 0,
    totalAmount: 0,
    pendingAmount: 0
  });

  useEffect(() => {
    fetchWithdrawals();
  // Only fetch once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filterWithdrawals();
  // We want this effect to run when these dependencies change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [withdrawals, searchTerm, filters]);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const response = await getWithdrawals();
      const data = response.data || [];
      setWithdrawals(data);
      
      // Calculate stats
      const stats = {
        total: data.length,
        pending: data.filter(w => w.status === 'pending').length,
        completed: data.filter(w => w.status === 'completed').length,
        rejected: data.filter(w => w.status === 'rejected').length,
        totalAmount: data.reduce((sum, w) => sum + (w.amount || 0), 0),
        pendingAmount: data.filter(w => w.status === 'pending').reduce((sum, w) => sum + (w.amount || 0), 0)
      };
      setWithdrawalStats(stats);
    } catch (error) {
      // Handle error silently or show user-friendly message
      setWithdrawals([]);
      setWithdrawalStats({ total: 0, pending: 0, completed: 0, rejected: 0, totalAmount: 0, pendingAmount: 0 });
    } finally {
      setLoading(false);
    }
  };

  const filterWithdrawals = () => {
    let filtered = withdrawals;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(withdrawal => 
        withdrawal.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        withdrawal.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        withdrawal.currency?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        withdrawal.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(w => w.status === filters.status);
    }

    // Currency filter
    if (filters.currency !== 'all') {
      filtered = filtered.filter(w => w.currency === filters.currency);
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const days = parseInt(filters.dateRange.replace('days', ''));
      const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(w => new Date(w.createdAt) >= cutoff);
    }

    // Amount range filter
    if (filters.amountRange !== 'all') {
      const [min, max] = filters.amountRange.split('-').map(Number);
      filtered = filtered.filter(w => {
        const amount = w.amount || 0;
        if (max) return amount >= min && amount <= max;
        return amount >= min;
      });
    }

    setFilteredWithdrawals(filtered);
  };

  const handleUpdateWithdrawal = async (id, status, notes = '') => {
    try {
      await updateWithdrawal(id, { status, adminNotes: notes });
      await fetchWithdrawals(); // Refresh data
      setShowApprovalModal(false);
      setProcessingWithdrawal(null);
      setAdminNotes('');
    } catch (error) {
      // Handle error silently or show user-friendly message
      alert('Failed to update withdrawal. Please try again.');
    }
  };

  const handleViewWithdrawal = (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setShowDetailModal(true);
  };

  const handleProcessWithdrawal = (withdrawal, action) => {
    setProcessingWithdrawal({ ...withdrawal, action });
    setShowApprovalModal(true);
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'rejected': return 'danger';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const getCurrencyIcon = (currency) => {
    switch (currency?.toLowerCase()) {
      case 'btc': return '₿';
      case 'eth': return 'Ξ';
      case 'usdt': return '₮';
      default: return '$';
    }
  };

  const columns = [
    {
      key: 'user',
      title: 'User',
      sortable: true,
      sortField: 'user.name',
      render: (value, withdrawal) => (
        <div className="flex items-center">
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-3
            ${withdrawal.user?.verified 
              ? 'bg-gradient-to-r from-blue-400 to-blue-600' 
              : 'bg-gradient-to-r from-gray-400 to-gray-600'
            }
          `}>
            {withdrawal.user?.name?.charAt(0) || 'U'}
            {withdrawal.user?.verified && (
              <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                <FiCheck size={8} className="text-white" />
              </div>
            )}
          </div>
          <div>
            <div className="font-semibold flex items-center">
              {withdrawal.user?.name || 'N/A'}
              {withdrawal.user?.vipTier > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                  VIP {withdrawal.user?.vipTier}
                </span>
              )}
            </div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {withdrawal.user?.email}
              {withdrawal.user?.kycVerified && (
                <span className="ml-2 text-green-500 text-xs">KYC Verified</span>
              )}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'amount',
      title: 'Amount',
      render: (value, withdrawal) => (
        <div className="font-semibold">
          {getCurrencyIcon(withdrawal.currency)} {(value || 0).toLocaleString()}
          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {withdrawal.currency?.toUpperCase()}
          </div>
        </div>
      )
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
      key: 'address',
      title: 'Destination',
      render: (value) => (
        <div className="font-mono text-sm">
          {value ? `${value.substring(0, 10)}...${value.substring(value.length - 6)}` : 'N/A'}
        </div>
      )
    },
    {
      key: 'createdAt',
      title: 'Requested',
      render: (value) => (
        <div>
          <div>{new Date(value).toLocaleDateString()}</div>
          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {new Date(value).toLocaleTimeString()}
          </div>
        </div>
      )
    }
  ];

  const actions = [
    {
      icon: FiEye,
      title: 'View Details',
      onClick: handleViewWithdrawal,
      variant: 'default'
    },
    {
      icon: FiCheck,
      title: 'Approve',
      onClick: (withdrawal) => handleProcessWithdrawal(withdrawal, 'approve'),
      variant: 'success',
      condition: (withdrawal) => withdrawal.status === 'pending'
    },
    {
      icon: FiX,
      title: 'Reject',
      onClick: (withdrawal) => handleProcessWithdrawal(withdrawal, 'reject'),
      variant: 'danger',
      condition: (withdrawal) => withdrawal.status === 'pending'
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
          <h1 className="text-3xl font-bold">Withdrawal Management</h1>
          <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Review and process user withdrawal requests
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:space-x-3 mt-4 sm:mt-0 w-full gap-2 sm:gap-0">
          <div className="w-full sm:w-auto mb-2 sm:mb-0">
            <AdminButton variant="secondary" icon={FiRefreshCw} onClick={fetchWithdrawals} className="w-full sm:w-auto">
              Refresh
            </AdminButton>
          </div>
          <div className="w-full sm:w-auto">
            <AdminButton variant="primary" icon={FiDownload} className="w-full sm:w-auto">
              Export
            </AdminButton>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <AdminCard className="transform transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Requests
              </p>
              <p className="text-2xl font-bold mt-2">{withdrawalStats.total}</p>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Value: ${withdrawalStats.totalAmount.toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600">
              <FiTrendingDown size={24} className="text-white" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}">
            <div className="flex items-center justify-between text-sm">
              <span>Average Request</span>
              <span className="font-medium">
                ${withdrawalStats.total > 0 ? (withdrawalStats.totalAmount / withdrawalStats.total).toFixed(2) : '0.00'}
              </span>
            </div>
          </div>
        </AdminCard>

        <AdminCard className="transform transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Pending
              </p>
              <p className="text-2xl font-bold mt-2">{withdrawalStats.pending}</p>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Value: ${withdrawalStats.pendingAmount.toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600 relative">
              <FiClock size={24} className="text-white" />
              {withdrawalStats.pending > 0 && (
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                  {withdrawalStats.pending}
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}">
            <div className="flex items-center justify-between text-sm">
              <span>Avg. Processing Time</span>
              <span className="font-medium text-yellow-500">2.5 hours</span>
            </div>
          </div>
        </AdminCard>

        <AdminCard className="transform transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Completed
              </p>
              <p className="text-2xl font-bold mt-2">{withdrawalStats.completed}</p>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Success Rate: {withdrawalStats.total > 0 ? ((withdrawalStats.completed / withdrawalStats.total) * 100).toFixed(1) : 0}%
              </p>
            </div>
            <div className="p-3 rounded-lg bg-gradient-to-r from-green-500 to-green-600">
              <FiCheck size={24} className="text-white" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}">
            <div className="flex items-center justify-between text-sm">
              <span>Today's Completed</span>
              <span className="font-medium text-green-500">+{withdrawalStats.todayCompleted || 0}</span>
            </div>
          </div>
        </AdminCard>

        <AdminCard className="transform transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Pending Amount
              </p>
              <p className="text-2xl font-bold mt-2">
                ${(withdrawalStats.pendingAmount / 1000).toFixed(1)}K
              </p>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                From {withdrawalStats.pending} requests
              </p>
            </div>
            <div className="p-3 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600">
              <FiDollarSign size={24} className="text-white" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}">
            <div className="flex items-center justify-between text-sm">
              <span>Average Pending</span>
              <span className="font-medium text-orange-500">
                ${withdrawalStats.pending > 0 ? (withdrawalStats.pendingAmount / withdrawalStats.pending).toFixed(2) : '0.00'}
              </span>
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Filters */}
      <AdminCard>
        <div className="p-2 sm:p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between mb-4">
            <div className="flex flex-wrap gap-2">
              <AdminButton 
                variant={filters.status === 'pending' ? 'warning' : 'secondary'}
                size="sm"
                onClick={() => setFilters({...filters, status: filters.status === 'pending' ? 'all' : 'pending'})}
              >
                <FiClock className="mr-1" /> Pending ({withdrawalStats.pending})
              </AdminButton>
              <AdminButton 
                variant={filters.status === 'completed' ? 'success' : 'secondary'}
                size="sm"
                onClick={() => setFilters({...filters, status: filters.status === 'completed' ? 'all' : 'completed'})}
              >
                <FiCheck className="mr-1" /> Completed
              </AdminButton>
              <AdminButton 
                variant={filters.dateRange === '24hours' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setFilters({...filters, dateRange: filters.dateRange === '24hours' ? 'all' : '24hours'})}
              >
                <FiCalendar className="mr-1" /> Last 24 Hours
              </AdminButton>
              <AdminButton 
                variant={filters.amountRange === '10000' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setFilters({...filters, amountRange: filters.amountRange === '10000' ? 'all' : '10000'})}
              >
                <FiDollarSign className="mr-1" /> High Value ($10K+)
              </AdminButton>
            </div>
            
            <div className="flex items-center gap-2 mt-2 sm:mt-0">
              {Object.values(filters).some(value => value !== 'all') && (
                <AdminButton 
                  variant="secondary"
                  size="sm"
                  onClick={() => setFilters({
                    status: 'all',
                    currency: 'all',
                    dateRange: 'all',
                    amountRange: 'all'
                  })}
                >
                  <FiX className="mr-1" /> Clear Filters
                </AdminButton>
              )}
              <AdminButton 
                variant="primary"
                size="sm"
                onClick={fetchWithdrawals}
              >
                <FiRefreshCw className={`mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </AdminButton>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <AdminInput
            placeholder="Search by user, email, or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <AdminSelect
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'pending', label: 'Pending' },
              { value: 'completed', label: 'Completed' },
              { value: 'rejected', label: 'Rejected' }
            ]}
            className="w-full"
          />
          
          <AdminSelect
            value={filters.currency}
            onChange={(e) => setFilters({...filters, currency: e.target.value})}
            options={[
              { value: 'all', label: 'All Currencies' },
              { value: 'BTC', label: 'Bitcoin' },
              { value: 'ETH', label: 'Ethereum' },
              { value: 'USDT', label: 'Tether' }
            ]}
            className="w-full"
          />
          
          <AdminSelect
            value={filters.dateRange}
            onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
            options={[
              { value: 'all', label: 'All Time' },
              { value: '7days', label: 'Last 7 Days' },
              { value: '30days', label: 'Last 30 Days' },
              { value: '90days', label: 'Last 90 Days' }
            ]}
            className="w-full"
          />
          
          <AdminSelect
            value={filters.amountRange}
            onChange={(e) => setFilters({...filters, amountRange: e.target.value})}
            options={[
              { value: 'all', label: 'All Amounts' },
              { value: '0-1000', label: '$0 - $1,000' },
              { value: '1000-10000', label: '$1,000 - $10,000' },
              { value: '10000', label: '$10,000+' }
            ]}
            className="w-full"
          />
        </div>
      </AdminCard>
      
      {/* Filter Summary */}
          {Object.values(filters).some(value => value !== 'all') && (
            <div className={`mt-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <span className="font-medium">Applied Filters:</span>{' '}
              {filters.status !== 'all' && (
                <span className="inline-flex items-center px-2 py-1 mr-2 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                  Status: {filters.status}
                </span>
              )}
              {filters.currency !== 'all' && (
                <span className="inline-flex items-center px-2 py-1 mr-2 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                  Currency: {filters.currency}
                </span>
              )}
              {filters.dateRange !== 'all' && (
                <span className="inline-flex items-center px-2 py-1 mr-2 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                  Date: {filters.dateRange}
                </span>
              )}
              {filters.amountRange !== 'all' && (
                <span className="inline-flex items-center px-2 py-1 mr-2 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">
                  Amount: {filters.amountRange}
                </span>
              )}
            </div>
          )}
        </div>
        </AdminCard>
      </div>

      {/* Results Summary */}
      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        Showing {filteredWithdrawals.length} of {withdrawals.length} withdrawals
        {searchTerm && ` matching "${searchTerm}"`}
      </div>

      {/* Batch Actions */}
      {selectedRows.length > 0 && (
        <div className={`
          fixed bottom-6 left-1/2 transform -translate-x-1/2 z-10
          px-6 py-4 rounded-lg shadow-lg flex items-center space-x-4
          ${isDarkMode ? 'bg-gray-800' : 'bg-white'}
          animate-slide-up
        `}>
          <span className="text-sm font-medium">
            {selectedRows.length} withdrawals selected
          </span>
          <AdminButton
            variant="success"
            size="sm"
            onClick={() => {
              setBatchAction('approve');
              setShowBatchModal(true);
            }}
          >
            <FiCheck className="mr-1" /> Approve Selected
          </AdminButton>
          <AdminButton
            variant="danger"
            size="sm"
            onClick={() => {
              setBatchAction('reject');
              setShowBatchModal(true);
            }}
          >
            <FiX className="mr-1" /> Reject Selected
          </AdminButton>
          <AdminButton
            variant="secondary"
            size="sm"
            onClick={() => setSelectedRows([])}
          >
            Clear Selection
          </AdminButton>
        </div>
      )}

      {/* Withdrawals Table */}
      <AdminTable
        columns={columns}
        data={filteredWithdrawals}
        actions={actions}
        loading={loading}
        selectable
        selectedRows={selectedRows}
        onSelectedRowsChange={setSelectedRows}
      />

      {/* Withdrawal Details Modal */}
      <AdminModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Withdrawal Details"
        size="lg"
      >
        {selectedWithdrawal && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3 flex items-center">
                  <FiUser className="mr-2" />
                  User Information
                </h4>
                <div className="space-y-2">
                  <div><strong>Name:</strong> {selectedWithdrawal.user?.name}</div>
                  <div><strong>Email:</strong> {selectedWithdrawal.user?.email}</div>
                  <div><strong>User ID:</strong> {selectedWithdrawal.userId}</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3 flex items-center">
                  <FiCreditCard className="mr-2" />
                  Transaction Details
                </h4>
                <div className="space-y-2">
                  <div><strong>Amount:</strong> {getCurrencyIcon(selectedWithdrawal.currency)} {selectedWithdrawal.amount?.toLocaleString()}</div>
                  <div><strong>Currency:</strong> {selectedWithdrawal.currency}</div>
                  <div><strong>Status:</strong> 
                    <StatusBadge 
                      status={selectedWithdrawal.status} 
                      variant={getStatusVariant(selectedWithdrawal.status)}
                      className="ml-2"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Destination Address</h4>
              <div className={`p-3 rounded-lg font-mono text-sm break-all ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
              }`}>
                {selectedWithdrawal.address}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3 flex items-center">
                  <FiCalendar className="mr-2" />
                  Timeline
                </h4>
                <div className="space-y-2">
                  <div><strong>Requested:</strong> {new Date(selectedWithdrawal.createdAt).toLocaleString()}</div>
                  {selectedWithdrawal.updatedAt && (
                    <div><strong>Last Updated:</strong> {new Date(selectedWithdrawal.updatedAt).toLocaleString()}</div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Admin Notes</h4>
                <div className={`p-3 rounded-lg text-sm ${
                  isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                }`}>
                  {selectedWithdrawal.adminNotes || 'No notes available'}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <AdminButton variant="secondary" onClick={() => setShowDetailModal(false)}>
                Close
              </AdminButton>
              {selectedWithdrawal.status === 'pending' && (
                <>
                  <AdminButton 
                    variant="danger" 
                    onClick={() => handleProcessWithdrawal(selectedWithdrawal, 'reject')}
                  >
                    Reject
                  </AdminButton>
                  <AdminButton 
                    variant="success" 
                    onClick={() => handleProcessWithdrawal(selectedWithdrawal, 'approve')}
                  >
                    Approve
                  </AdminButton>
                </>
              )}
            </div>
          </div>
        )}
      </AdminModal>

      {/* Approval/Rejection Modal */}
      <AdminModal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        title={`${processingWithdrawal?.action === 'approve' ? 'Approve' : 'Reject'} Withdrawal`}
        size="md"
      >
        {processingWithdrawal && (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${
              processingWithdrawal.action === 'approve' 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center">
                {processingWithdrawal.action === 'approve' ? (
                  <FiCheck className="text-green-600 mr-2" size={20} />
                ) : (
                  <FiAlertCircle className="text-red-600 mr-2" size={20} />
                )}
                <div>
                  <h4 className={`font-semibold ${
                    processingWithdrawal.action === 'approve' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {processingWithdrawal.action === 'approve' ? 'Approve Withdrawal' : 'Reject Withdrawal'}
                  </h4>
                  <p className={`text-sm ${
                    processingWithdrawal.action === 'approve' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {getCurrencyIcon(processingWithdrawal.currency)} {processingWithdrawal.amount?.toLocaleString()} {processingWithdrawal.currency}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Admin Notes {processingWithdrawal.action === 'reject' && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder={`Add notes for this ${processingWithdrawal.action}...`}
                className={`w-full p-3 border rounded-lg resize-none ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                rows={4}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <AdminButton variant="secondary" onClick={() => setShowApprovalModal(false)}>
                Cancel
              </AdminButton>
              <AdminButton 
                variant={processingWithdrawal.action === 'approve' ? 'success' : 'danger'}
                onClick={() => handleUpdateWithdrawal(
                  processingWithdrawal._id, 
                  processingWithdrawal.action === 'approve' ? 'completed' : 'rejected',
                  adminNotes
                )}
                disabled={processingWithdrawal.action === 'reject' && !adminNotes.trim()}
              >
                {processingWithdrawal.action === 'approve' ? 'Approve' : 'Reject'} Withdrawal
              </AdminButton>
            </div>
          </div>
        )}
      </AdminModal>
      {/* Batch Action Modal */}
      <AdminModal
        isOpen={showBatchModal}
        onClose={() => {
          setShowBatchModal(false);
          setBatchAction(null);
          setAdminNotes('');
        }}
        title={`${batchAction === 'approve' ? 'Approve' : 'Reject'} Multiple Withdrawals`}
        size="lg"
      >
        {batchAction && (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${
              batchAction === 'approve' 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center">
                {batchAction === 'approve' ? (
                  <FiCheck className="text-green-600 mr-2" size={20} />
                ) : (
                  <FiAlertCircle className="text-red-600 mr-2" size={20} />
                )}
                <div>
                  <h4 className={`font-semibold ${
                    batchAction === 'approve' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {batchAction === 'approve' ? 'Approve' : 'Reject'} {selectedRows.length} Withdrawals
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Total Amount: ${
                      selectedRows
                        .reduce((sum, id) => {
                          const withdrawal = withdrawals.find(w => w._id === id);
                          return sum + (withdrawal?.amount || 0);
                        }, 0)
                        .toLocaleString()
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Currency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {selectedRows.map(id => {
                    const withdrawal = withdrawals.find(w => w._id === id);
                    return withdrawal ? (
                      <tr key={id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 text-sm">{withdrawal.user?.name || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm">${withdrawal.amount?.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm">{withdrawal.currency}</td>
                      </tr>
                    ) : null;
                  })}
                </tbody>
              </table>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Admin Notes {batchAction === 'reject' && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder={`Add notes for this batch ${batchAction}...`}
                className={`w-full p-3 border rounded-lg resize-none ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                rows={4}
              />
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <AdminButton 
                variant="secondary" 
                onClick={() => {
                  setShowBatchModal(false);
                  setBatchAction(null);
                  setAdminNotes('');
                }}
              >
                Cancel
              </AdminButton>
              <AdminButton 
                variant={batchAction === 'approve' ? 'success' : 'danger'}
                onClick={() => {
                  Promise.all(
                    selectedRows.map(id =>
                      handleUpdateWithdrawal(
                        id, 
                        batchAction === 'approve' ? 'completed' : 'rejected',
                        adminNotes
                      )
                    )
                  ).then(() => {
                    setShowBatchModal(false);
                    setBatchAction(null);
                    setAdminNotes('');
                    setSelectedRows([]);
                  });
                }}
                disabled={batchAction === 'reject' && !adminNotes.trim()}
              >
                {batchAction === 'approve' ? 'Approve' : 'Reject'} All Selected
              </AdminButton>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
};

export default AdminWithdrawals;