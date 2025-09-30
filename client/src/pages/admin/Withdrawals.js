// src/pages/admin/Withdrawals.js
import React, { useState, useEffect } from 'react';
import { 
  FiDollarSign, FiClock, FiCheck, FiX, FiEye, FiFilter,
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
  }, []);

  useEffect(() => {
    filterWithdrawals();
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
      render: (value, withdrawal) => (
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
            {withdrawal.user?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <div className="font-semibold">{withdrawal.user?.name || 'N/A'}</div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {withdrawal.user?.email}
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
        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Requests
              </p>
              <p className="text-2xl font-bold mt-2">{withdrawalStats.total}</p>
            </div>
            <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600">
              <FiTrendingDown size={24} className="text-white" />
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Pending
              </p>
              <p className="text-2xl font-bold mt-2">{withdrawalStats.pending}</p>
            </div>
            <div className="p-3 rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600">
              <FiClock size={24} className="text-white" />
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Completed
              </p>
              <p className="text-2xl font-bold mt-2">{withdrawalStats.completed}</p>
            </div>
            <div className="p-3 rounded-lg bg-gradient-to-r from-green-500 to-green-600">
              <FiCheck size={24} className="text-white" />
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Pending Amount
              </p>
              <p className="text-2xl font-bold mt-2">
                ${(withdrawalStats.pendingAmount / 1000).toFixed(0)}K
              </p>
            </div>
            <div className="p-3 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600">
              <FiDollarSign size={24} className="text-white" />
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Filters */}
      <AdminCard>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 p-2 sm:p-4">
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

      {/* Withdrawals Table */}
      <AdminTable
        columns={columns}
        data={filteredWithdrawals}
        actions={actions}
        loading={loading}
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
    </div>
  );
};

export default AdminWithdrawals;