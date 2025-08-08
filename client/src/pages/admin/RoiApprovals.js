import React, { useState, useEffect } from 'react';
import { getRoiWithdrawals, approveRoiWithdrawal, rejectRoiWithdrawal } from '../../services/roiAPI';

const RoiApprovals = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getRoiWithdrawals();
        setWithdrawals(data);
      } catch (e) {
        setError(e?.message || 'Failed to fetch ROI withdrawals');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleApprove = async (id) => {
    await approveRoiWithdrawal(id);
    setWithdrawals(withdrawals.filter(w => w._id !== id));
  };
  const handleReject = async (id) => {
    await rejectRoiWithdrawal(id);
    setWithdrawals(withdrawals.filter(w => w._id !== id));
  };

  return (
    <div className="p-2 sm:p-4 md:p-6 max-w-full sm:max-w-4xl mx-auto overflow-x-auto">
      <h2 className="text-2xl font-bold mb-4">ROI Withdrawals Pending Approval</h2>
      {error && <div className="text-red-400 mb-4">{error}</div>}
      {loading ? <div>Loading...</div> : (
        <div className="overflow-x-auto rounded-lg border border-gray-700">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 bg-gray-900 text-left">
                <th className="py-3 px-4 font-semibold">User</th>
                <th className="py-3 px-4 font-semibold">Amount</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map(w => (
                <tr key={w._id} className="border-b border-gray-800 hover:bg-gray-800 transition">
                  <td className="py-3 px-4 break-all">{w.userId?.email || w.userId}</td>
                  <td className="py-3 px-4">{w.amount}</td>
                  <td className="py-3 px-4">{new Date(w.createdAt).toLocaleString()}</td>
                  <td className="py-3 px-4 capitalize">{w.status}</td>
                  <td className="py-3 px-4 flex gap-2">
                    <button className="bg-green-600 px-3 py-1 rounded text-white font-semibold hover:bg-green-700 transition" onClick={() => handleApprove(w._id)}>Approve</button>
                    <button className="bg-red-600 px-3 py-1 rounded text-white font-semibold hover:bg-red-700 transition" onClick={() => handleReject(w._id)}>Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RoiApprovals;
