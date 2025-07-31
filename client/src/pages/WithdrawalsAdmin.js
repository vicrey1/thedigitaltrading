import React, { useEffect, useState } from 'react';
import toast from '../utils/toast';
import axios from 'axios';

const WithdrawalsAdmin = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/withdrawals?status=pending', {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      setWithdrawals(res.data);
    } catch (err) {
      setError('Failed to fetch withdrawals');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await axios.put(`/api/admin/withdrawals/${id}`, { status: 'completed', adminNotes: '' }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      fetchWithdrawals();
    } catch {
      toast.error('Failed to approve withdrawal', {
        position: 'top-center',
        autoClose: 4000,
        style: {
          background: 'linear-gradient(90deg, #FFD700 0%, #FFF8DC 100%)',
          color: '#222',
          fontWeight: 'bold',
          fontSize: '1.1rem',
          borderRadius: '12px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)'
        }
      });
    }
  };

  const handleReject = async (id) => {
    if (!rejectReason) {
      toast.error('Please provide a reason for rejection.', {
        position: 'top-center',
        autoClose: 4000,
        style: {
          background: 'linear-gradient(90deg, #FFD700 0%, #FFF8DC 100%)',
          color: '#222',
          fontWeight: 'bold',
          fontSize: '1.1rem',
          borderRadius: '12px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)'
        }
      });
      return;
    }
    try {
      await axios.put(`/api/admin/withdrawals/${id}`, { status: 'rejected', adminNotes: rejectReason }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      setActionId(null);
      setRejectReason('');
      fetchWithdrawals();
    } catch {
      toast.error('Failed to reject withdrawal', {
        position: 'top-center',
        autoClose: 4000,
        style: {
          background: 'linear-gradient(90deg, #FFD700 0%, #FFF8DC 100%)',
          color: '#222',
          fontWeight: 'bold',
          fontSize: '1.1rem',
          borderRadius: '12px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)'
        }
      });
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto p-8 md:p-12 lg:p-16 xl:p-20 2xl:p-24 font-sans text-base text-gray-100 bg-black rounded-xl shadow-lg">
      <h2 className="text-3xl font-bold mb-6">Withdrawal Management</h2>
      {withdrawals.length === 0 ? (
        <div>No pending withdrawals.</div>
      ) : (
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">User</th>
              <th className="py-2 px-4 border-b">Amount</th>
              <th className="py-2 px-4 border-b">Currency</th>
              <th className="py-2 px-4 border-b">Address</th>
              <th className="py-2 px-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.map(w => (
              <tr key={w._id}>
                <td className="py-2 px-4 border-b">
                  <div>{w.userName || w.userId}</div>
                  <div className="text-xs text-gray-400">{w.userEmail}</div>
                </td>
                <td className="py-2 px-4 border-b">{w.amount}</td>
                <td className="py-2 px-4 border-b">{w.currency}</td>
                <td className="py-2 px-4 border-b">{w.walletAddress}</td>
                <td className="py-2 px-4 border-b">
                  <button onClick={() => handleApprove(w._id)} className="bg-green-500 text-white px-2 py-1 rounded mr-2">Approve</button>
                  <button onClick={() => setActionId(w._id)} className="bg-red-500 text-white px-2 py-1 rounded">Reject</button>
                  {actionId === w._id && (
                    <div className="mt-2">
                      <input
                        type="text"
                        placeholder="Reason for rejection"
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        className="border px-2 py-1 rounded mr-2"
                      />
                      <button onClick={() => handleReject(w._id)} className="bg-red-700 text-white px-2 py-1 rounded">Confirm Reject</button>
                      <button onClick={() => { setActionId(null); setRejectReason(''); }} className="ml-2 px-2 py-1">Cancel</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default WithdrawalsAdmin;
