// src/components/WithdrawalHistory.js
import React from 'react';
import { FiCheck, FiClock, FiX, FiDollarSign } from 'react-icons/fi';

const statusIcons = {
  pending: <FiClock className="text-yellow-500" />,
  processing: <FiClock className="text-blue-500" />,
  confirmed: <FiCheck className="text-purple-500" />,
  completed: <FiCheck className="text-green-500" />,
  failed: <FiX className="text-red-500" />,
  cancelled: <FiX className="text-gray-500" />,
  rejected: <FiX className="text-red-500" />
};

const statusDescriptions = {
  pending: 'Awaiting network fee payment',
  processing: 'Network fee submitted, awaiting verification',
  confirmed: 'Network fee verified, withdrawal processing',
  completed: 'Withdrawal completed successfully',
  failed: 'Withdrawal failed',
  cancelled: 'Withdrawal cancelled',
  rejected: 'Network fee payment rejected'
};



const WithdrawalHistory = ({ withdrawals, onProcessingClick }) => {
  // Normalize the prop to an array to avoid runtime errors when the server
  // returns undefined, null, or a single object.
  const list = Array.isArray(withdrawals) ? withdrawals : [];

  const handleWithdrawalClick = (withdrawal) => {
    // Allow click when the withdrawal requires a network fee payment
    const needsNetworkFee = !withdrawal.networkFee || withdrawal.networkFee.status === 'unpaid' || withdrawal.networkFee.status === 'rejected';
    // If the withdrawal is processing (needs fee) or has a rejected fee, allow the click
    if ((withdrawal.status === 'processing' && needsNetworkFee) && onProcessingClick) {
      onProcessingClick(withdrawal);
    }
  };

  return (
    <div className="glassmorphic p-6 rounded-xl">
      <h3 className="text-xl font-bold mb-4">Recent Withdrawals</h3>
      {list.length === 0 ? (
        <p className="text-gray-400">No withdrawal history</p>
      ) : (
        <div className="space-y-4">
          {list.map((withdrawal) => (
            <div
              key={withdrawal.id || withdrawal._id || Math.random()}
              className={`flex justify-between items-center p-3 border-b border-gray-800 ${withdrawal.status === 'processing' ? 'cursor-pointer hover:bg-gray-800' : ''}`}
              onClick={() => handleWithdrawalClick(withdrawal)}
            >
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
                    {withdrawal.createdAt ? new Date(withdrawal.createdAt).toLocaleDateString() : ''} • {withdrawal.network || ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center group relative">
                <span className="mr-2">{statusIcons[withdrawal.status]}</span>
                <span className={`text-sm ${
                  withdrawal.status === 'completed' ? 'text-green-500' :
                  withdrawal.status === 'processing' ? 'text-blue-500' :
                  withdrawal.status === 'failed' || withdrawal.status === 'rejected' ? 'text-red-500' :
                  withdrawal.status === 'cancelled' ? 'text-gray-500' : 'text-yellow-500'
                }`}>
                  {withdrawal.status}
                </span>
                <div className="hidden group-hover:block absolute bottom-full left-0 mb-2 w-48 p-2 bg-gray-900 text-xs text-gray-200 rounded-lg shadow-lg">
                  {statusDescriptions[withdrawal.status]}
                </div>
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