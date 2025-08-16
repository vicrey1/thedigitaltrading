// src/components/WithdrawalHistory.js
import React from 'react';
import { FiCheck, FiClock, FiX, FiDollarSign } from 'react-icons/fi';

const statusIcons = {
  pending: <FiClock className="text-yellow-500" />,
  completed: <FiCheck className="text-green-500" />,
  failed: <FiX className="text-red-500" />,
  cancelled: <FiX className="text-gray-500" />
};

const WithdrawalHistory = ({ withdrawals }) => {
  // Normalize the prop to an array to avoid runtime errors when the server
  // returns undefined, null, or a single object.
  const list = Array.isArray(withdrawals) ? withdrawals : [];

  return (
    <div className="glassmorphic p-6 rounded-xl">
      <h3 className="text-xl font-bold mb-4">Recent Withdrawals</h3>
      {list.length === 0 ? (
        <p className="text-gray-400">No withdrawal history</p>
      ) : (
        <div className="space-y-4">
          {list.map((withdrawal) => (
            <div key={withdrawal.id || withdrawal._id || Math.random()} className="flex justify-between items-center p-3 border-b border-gray-800">
              <div className="flex items-center">
                <div className="mr-4">
                  <FiDollarSign className="text-gold" size={20} />
                </div>
                <div>
                  <p className="font-medium">${Math.abs(withdrawal.amount || 0).toFixed(2)}</p>
                  <p className={`text-sm ${withdrawal.type === 'roi' ? 'text-purple-500 font-semibold' : 'text-gray-400'}`}>
                    {withdrawal.type === 'roi' ? 'ROI Withdrawal' : `Withdrawal to ${withdrawal.walletAddress || 'DEFAULT_ADDRESS'}`}
                  </p>
                  <p className="text-sm text-gray-400">
                    {withdrawal.date ? new Date(withdrawal.date).toLocaleDateString() : ''} • {withdrawal.network || ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <span className="mr-2">{statusIcons[withdrawal.status]}</span>
                <span className={`text-sm ${
                  withdrawal.status === 'completed' ? 'text-green-500' :
                  withdrawal.status === 'failed' ? 'text-red-500' :
                  withdrawal.status === 'cancelled' ? 'text-gray-500' : 'text-yellow-500'
                }`}>
                  {withdrawal.status}
                </span>
              </div>
            </div>
          ))}
          <button className="text-gold text-sm font-medium mt-2 hover:underline">
            View full history →
          </button>
        </div>
      )}
    </div>
  );
};

export default WithdrawalHistory;