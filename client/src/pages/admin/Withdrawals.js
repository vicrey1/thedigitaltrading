// src/pages/admin/Withdrawals.js
import React, { useState, useEffect } from 'react';
import WithdrawalList from '../../components/admin/WithdrawalList';
import WithdrawalDetail from '../../components/admin/WithdrawalDetail';
import { getWithdrawals, updateWithdrawal } from '../../services/withdrawalAPI';

const AdminWithdrawals = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'pending',
    currency: 'all',
    dateRange: '7days'
  });

  useEffect(() => {
    const fetchWithdrawals = async () => {
      try {
        const data = await getWithdrawals(filters);
        setWithdrawals(data);
      } catch (error) {
        console.error('Failed to fetch withdrawals:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchWithdrawals();
  }, [filters]);

  const handleUpdateWithdrawal = async (id, status, notes, destination = 'available') => {
    try {
      const updated = await updateWithdrawal(id, { status, adminNotes: notes, destination });
      setWithdrawals(withdrawals.map(w => w.id === updated.id ? updated : w));
      setSelectedWithdrawal(null);
    } catch (error) {
      console.error('Failed to update withdrawal:', error);
    }
  };

  if (loading) {
    return <div className="p-2 sm:p-4 md:p-6 max-w-full sm:max-w-5xl mx-auto overflow-x-auto">Loading withdrawals...</div>;
  }

  return (
      <div className="w-full max-w-full sm:max-w-5xl mx-auto px-2 sm:px-6 py-4 sm:py-6 font-sans text-base text-gray-900 overflow-x-auto">
      <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
        <h1 className="text-xl sm:text-2xl font-bold whitespace-nowrap">Withdrawal Management</h1>
        <span className="text-sm text-gray-400">Showing: {withdrawals.filter(w => w.status === 'pending').length} pending</span>
      </div>
      <div className="bg-gray-800 rounded-xl p-2 sm:p-6 w-full overflow-auto">
        <WithdrawalList 
          withdrawals={withdrawals} 
          filters={filters}
          onFilterChange={setFilters}
          onSelect={setSelectedWithdrawal}
          onBulkUpdate={(ids, status) => ids.forEach(id => handleUpdateWithdrawal(id, status, 'Bulk action'))}
        />
      </div>
      {selectedWithdrawal && (
        <WithdrawalDetail 
          withdrawal={selectedWithdrawal}
          onApprove={(notes, destination) => handleUpdateWithdrawal(selectedWithdrawal.id, 'completed', notes, destination)}
          onReject={notes => handleUpdateWithdrawal(selectedWithdrawal.id, 'rejected', notes)}
          onClose={() => setSelectedWithdrawal(null)}
        />
      )}
    </div>
  );
};

export default AdminWithdrawals;