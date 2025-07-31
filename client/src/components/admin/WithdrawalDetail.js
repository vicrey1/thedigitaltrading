// src/components/admin/WithdrawalDetail.js
import React, { useState } from 'react';
import { FiX, FiClock, FiCopy } from 'react-icons/fi';

const statusColors = {
  Pending: 'bg-yellow-900 bg-opacity-30 text-yellow-400',
  Approved: 'bg-green-900 bg-opacity-30 text-green-400',
  Rejected: 'bg-red-900 bg-opacity-30 text-red-400',
};

const WithdrawalDetail = ({ withdrawal, onApprove, onReject, onClose }) => {
  const [notes, setNotes] = useState('');
  const [destination, setDestination] = useState('available');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = async () => {
    setIsProcessing(true);
    await onApprove(notes, destination);
    setIsProcessing(false);
  };

  const handleReject = async () => {
    setIsProcessing(true);
    await onReject(notes);
    setIsProcessing(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gold scrollbar-track-gray-900/60">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold">Withdrawal Review</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-700"
            >
              <FiX size={24} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-lg font-bold mb-3">Transaction Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Withdrawal ID</span>
                  <span className="font-mono">{withdrawal.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">User ID</span>
                  <span>{withdrawal.userId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">User Email</span>
                  <span>{withdrawal.userEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Request Date</span>
                  <span>{new Date(withdrawal.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-3">Withdrawal Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount</span>
                  <span className="font-mono">
                    {withdrawal.amount} {withdrawal.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Network</span>
                  <span>{withdrawal.network}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Wallet Address</span>
                  <div className="flex items-center">
                    <span className="font-mono text-sm truncate max-w-xs">
                      {withdrawal.walletAddress}
                    </span>
                    <button
                      onClick={() => copyToClipboard(withdrawal.walletAddress)}
                      className="ml-2 text-gray-400 hover:text-gold"
                    >
                      <FiCopy />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${statusColors[withdrawal.status]}`}>
                    {withdrawal.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-bold mb-3">Admin Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this withdrawal..."
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
              rows={3}
            />
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-bold mb-3">Destination</h3>
            <select
              value={destination}
              onChange={e => setDestination(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white mb-2"
            >
              <option value="available">Available Balance</option>
              <option value="locked">Locked Balance</option>
            </select>
          </div>

          <div className="bg-gray-700 bg-opacity-50 p-4 rounded-lg mb-6">
            <div className="flex items-center">
              <FiClock className="mr-2 text-yellow-400" />
              <span>This withdrawal has been pending for {Math.floor((new Date() - new Date(withdrawal.createdAt)) / (1000 * 60 * 60))} hours</span>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              onClick={handleReject}
              disabled={isProcessing}
              className={`px-6 py-2 bg-red-500 bg-opacity-20 text-red-400 rounded-lg hover:bg-opacity-30 transition ${
                isProcessing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Reject Withdrawal
            </button>
            <button
              onClick={handleApprove}
              disabled={isProcessing}
              className={`px-6 py-2 bg-green-500 bg-opacity-20 text-green-400 rounded-lg hover:bg-opacity-30 transition ${
                isProcessing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Approve Withdrawal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WithdrawalDetail;