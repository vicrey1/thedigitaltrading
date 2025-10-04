import React, { useState, useEffect, useCallback } from 'react';
import Portfolio from '../../pages/Portfolio';
import Dashboard from '../../pages/Dashboard';
import Settings from '../../pages/Settings';
import KYCPage from '../../pages/KYCPage';
import { API } from '../../services/adminAPI';
import { mirrorAddFunds } from '../../services/adminAPI';

const MAX_AMOUNT = 10000; // Maximum amount that can be added/subtracted at once

const BalanceControls = () => {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [action, setAction] = useState('add'); // 'add' or 'subtract'

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      setMessage({ type: 'error', text: 'Enter a valid positive amount' });
      return;
    }
    if (parsed > MAX_AMOUNT) {
      setMessage({ type: 'error', text: `Amount exceeds maximum allowed per operation (${MAX_AMOUNT})` });
      return;
    }
    // show confirmation modal
    setConfirmOpen(true);
  };

  const handleBalance = async () => {
    const parsed = parseFloat(amount);
    setMessage(null);
    setLoading(true);
    setConfirmOpen(false);
    try {
      const res = await mirrorAddFunds({ 
        amount: action === 'subtract' ? -parsed : parsed, 
        reason: `${action === 'add' ? 'Added' : 'Subtracted'} by admin: ${reason || 'No reason provided'}`
      });
      setMessage({ 
        type: 'success', 
        text: `${action === 'add' ? 'Added' : 'Subtracted'} ${parsed}. New balance: ${res.availableBalance}` 
      });
      setAmount('');
      setReason('');
    } catch (err) {
      setMessage({ type: 'error', text: err.toString() });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="px-3 py-2 bg-gray-900 rounded w-32"
        >
          <option value="add">Add</option>
          <option value="subtract">Subtract</option>
        </select>
        <input
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="Amount"
          className="px-3 py-2 bg-gray-900 rounded w-36"
        />
        <input
          type="text"
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Reason (optional)"
          className="px-3 py-2 bg-gray-900 rounded flex-1"
        />
        <button 
          disabled={loading} 
          className={`px-4 py-2 ${action === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white rounded`}
        >
          {loading ? 'Processing...' : `${action === 'add' ? 'Add' : 'Subtract'} Funds`}
        </button>
      </div>
      {message && (
        <div className={`pt-2 ${message.type === 'error' ? 'text-red-400' : 'text-green-400'}`}> {message.text} </div>
      )}
      {confirmOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-gray-900 p-4 rounded border border-gray-700 w-full max-w-md">
            <h4 className="font-semibold mb-2">Confirm {action === 'add' ? 'Add' : 'Subtract'} Funds</h4>
            <p className="mb-4">Are you sure you want to {action === 'add' ? 'add' : 'subtract'} <strong>{amount}</strong> from the user's balance?</p>
            {reason && <p className="mb-4 text-sm text-gray-400">Reason: {reason}</p>}
            <div className="flex gap-2 justify-end">
              <button className="px-4 py-2 bg-gray-700 rounded" onClick={() => setConfirmOpen(false)}>Cancel</button>
              <button 
                className={`px-4 py-2 ${action === 'add' ? 'bg-green-600' : 'bg-red-600'} text-white rounded`} 
                onClick={handleBalance}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

const AdminMirrorUser = ({ userId, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('dashboard');


  const fetchAll = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError('');

    try {
      await Promise.all([
        API.get(`/users/${userId}/portfolio`),
        API.get(`/users/${userId}/profile`),
        API.get(`/users/${userId}/kyc`)
      ]);
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Your admin session has expired or you are not authorized. Please log in again or check your admin permissions.');
      } else if (err.response?.status === 403) {
        setError('Access forbidden: You do not have admin privileges.');
      } else {
        setError(err.response?.data?.message || 'Failed to fetch user data');
      }
    } finally {
      setLoading(false);
    }
  }, [userId, setLoading, setError]);

  useEffect(() => {
    fetchAll();
  }, [userId, fetchAll]);

  const handleTabChange = (newTab) => {
    setTab(newTab);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-900/50 border border-red-500 text-red-300 rounded">
        <div className="flex flex-col gap-2">
          <div>{error}</div>
          <div className="flex gap-2">
            <button
              onClick={() => { setError(''); fetchAll(); }}
              className="px-4 py-2 bg-red-800 hover:bg-red-700 text-white rounded"
            >
              Try Again
            </button>
            <button
              onClick={onBack}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
            >
              Back to User List
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-white flex items-center"
        >
          ← Back to Users
        </button>
      </div>

      <div className="flex space-x-4 border-b border-gray-700 mb-4">
        <button
          className={`px-4 py-2 ${tab === 'dashboard' ? 'border-b-2 border-gold text-gold' : 'text-gray-400'}`}
          onClick={() => handleTabChange('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={`px-4 py-2 ${tab === 'portfolio' ? 'border-b-2 border-gold text-gold' : 'text-gray-400'}`}
          onClick={() => handleTabChange('portfolio')}
        >
          Portfolio
        </button>
        <button
          className={`px-4 py-2 ${tab === 'settings' ? 'border-b-2 border-gold text-gold' : 'text-gray-400'}`}
          onClick={() => handleTabChange('settings')}
        >
          Settings
        </button>
        <button
          className={`px-4 py-2 ${tab === 'kyc' ? 'border-b-2 border-gold text-gold' : 'text-gray-400'}`}
          onClick={() => handleTabChange('kyc')}
        >
          KYC
        </button>
      </div>

      {tab === 'dashboard' && (
        <div className="space-y-6">
          <div className="p-4 border rounded bg-gray-800">
            <h3 className="text-lg font-semibold mb-4">Admin Mirror: Balance Controls</h3>
            <BalanceControls />
          </div>

          <div className="border rounded bg-gray-800">
            <Dashboard userId={userId} />
          </div>
        </div>
      )}
      {tab === 'portfolio' && <Portfolio userId={userId} />}
      {tab === 'settings' && <Settings userId={userId} />}
      {tab === 'kyc' && <KYCPage userId={userId} />}
    </div>
  );
};

export default AdminMirrorUser;