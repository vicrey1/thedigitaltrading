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

  const [withdrawalStats, setWithdrawalStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalAmount: 0
  });

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [withdrawals, filters, searchTerm]);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const response = await getWithdrawals();
      setWithdrawals(response.data);
      calculateStats(response.data);
    } catch (error) {
      console.error('Failed to fetch withdrawals:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const stats = data.reduce((acc, withdrawal) => {
      acc[withdrawal.status]++;
      acc.total++;
      acc.totalAmount += withdrawal.amount;
      return acc;
    }, {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      totalAmount: 0
    });
    setWithdrawalStats(stats);
  };

  const applyFilters = () => {
    // Ensure withdrawals is always an array
    let filtered = Array.isArray(withdrawals) ? [...withdrawals] : [];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(withdrawal => 
        withdrawal.user.email.toLowerCase().includes(search) ||
        withdrawal.reference.toLowerCase().includes(search)
      );
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(w => w.status === filters.status);
    }

    if (filters.currency !== 'all') {
      filtered = filtered.filter(w => w.currency === filters.currency);
    }

    if (filters.dateRange !== 'all') {
      const now = new Date();
      const days = parseInt(filters.dateRange);
      const cutoff = new Date(now.setDate(now.getDate() - days));
      filtered = filtered.filter(w => new Date(w.createdAt) >= cutoff);
    }

    if (filters.amountRange !== 'all') {
      const [min, max] = filters.amountRange.split('-').map(Number);
      filtered = filtered.filter(w => {
        if (max) {
          return w.amount >= min && w.amount < max;
        }
        return w.amount >= min;
      });
    }

    setFilteredWithdrawals(filtered);
  };

  const handleWithdrawalAction = async (withdrawal, action, notes = '') => {
    try {
      setProcessingWithdrawal(withdrawal.id);
      await updateWithdrawal(withdrawal.id, { status: action, adminNotes: notes });
      await fetchWithdrawals();
      setShowApprovalModal(false);
      setAdminNotes('');
    } catch (error) {
      console.error(`Failed to ${action} withdrawal:`, error);
    } finally {
      setProcessingWithdrawal(null);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminCard className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FiDollarSign className="text-2xl mr-2 text-gold" />
              <div>
                <h3 className="text-sm font-medium">Total Amount</h3>
                <p className="text-lg font-bold">${withdrawalStats.totalAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </AdminCard>

        <AdminCard className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FiClock className="text-2xl mr-2 text-blue-500" />
              <div>
                <h3 className="text-sm font-medium">Pending</h3>
                <p className="text-lg font-bold">{withdrawalStats.pending}</p>
              </div>
            </div>
          </div>
        </AdminCard>

        {/* Filter Section */}
        <div className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AdminSelect
              label="Status"
              value={filters.status}
              onChange={e => setFilters({ ...filters, status: e.target.value })}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'processing', label: 'Processing' },
                { value: 'pending', label: 'Pending' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' }
              ]}
            />
            <AdminSelect
              label="Time Period"
              value={filters.dateRange}
              onChange={e => setFilters({ ...filters, dateRange: e.target.value })}
              options={[
                { value: 'all', label: 'All Time' },
                { value: '7', label: 'Last 7 Days' },
                { value: '30', label: 'Last 30 Days' },
                { value: '90', label: 'Last 90 Days' }
              ]}
            />
            <AdminSelect
              label="Amount Range"
              value={filters.amountRange}
              onChange={e => setFilters({ ...filters, amountRange: e.target.value })}
              options={[
                { value: 'all', label: 'All Amounts' },
                { value: '0-1000', label: '$0 - $1,000' },
                { value: '1000-10000', label: '$1,000 - $10,000' },
                { value: '10000', label: '$10,000+' }
              ]}
            />
          </div>
        </div>

        {/* Filter Summary */}
        <div className="mt-4">
          {Object.values(filters).some(value => value !== 'all') && (
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <span className="font-medium">Applied Filters:</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {filters.status !== 'all' && (
                  <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                    Status: {filters.status}
                  </span>
                )}
                {filters.dateRange !== 'all' && (
                  <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                    Period: {filters.dateRange} days
                  </span>
                )}
                {filters.amountRange !== 'all' && (
                  <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium">
                    Amount: {filters.amountRange}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Withdrawals Table */}
        <div className="mt-4">
          <AdminTable
            data={filteredWithdrawals}
            columns={[
              { 
                header: 'User',
                field: 'user.email',
                sortable: true
              },
              {
                header: 'Amount',
                field: 'amount',
                sortable: true,
                render: (row) => `$${row.amount.toFixed(2)}`
              },
              {
                header: 'Status',
                field: 'status',
                sortable: true,
                render: (row) => (
                  <StatusBadge status={row.status} />
                )
              },
              {
                header: 'Date',
                field: 'createdAt',
                sortable: true,
                render: (row) => new Date(row.createdAt).toLocaleDateString()
              },
              {
                header: 'Actions',
                field: 'actions',
                render: (row) => (
                  <div className="flex space-x-2">
                    <AdminButton
                      variant="icon"
                      icon={<FiEye />}
                      onClick={() => {
                        setSelectedWithdrawal(row);
                        setShowDetailModal(true);
                      }}
                    />
                    {row.status === 'pending' && (
                      <>
                        <AdminButton
                          variant="icon"
                          icon={<FiCheck />}
                          onClick={() => {
                            setSelectedWithdrawal(row);
                            setShowApprovalModal(true);
                            setBatchAction('approve');
                          }}
                        />
                        <AdminButton
                          variant="icon"
                          icon={<FiX />}
                          onClick={() => {
                            setSelectedWithdrawal(row);
                            setShowApprovalModal(true);
                            setBatchAction('reject');
                          }}
                        />
                      </>
                    )}
                  </div>
                )
              }
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminWithdrawals;