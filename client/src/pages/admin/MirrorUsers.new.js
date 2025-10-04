import React, { useState } from 'react';
import AdminUserList from './AdminUserList';
import { impersonateUser, setMirrorUserToken, clearMirrorUserToken, mirrorAddFunds } from '../../services/adminAPI';
import { toast } from 'react-toastify';
import Dashboard from '../Dashboard';
import Portfolio from '../Portfolio';
import Settings from '../Settings';
import KYCPage from '../KYCPage';
import { useUserDataRefresh } from '../../contexts/UserDataRefreshContext';

const MAX_AMOUNT = 10000; // Maximum amount that can be added/subtracted at once

const BalanceControls = ({ userId }) => {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [action, setAction] = useState('add'); // 'add' or 'subtract'
  const { refreshUserData } = useUserDataRefresh();

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
    setConfirmOpen(true);
  };

  const handleBalance = async () => {
    const parsed = parseFloat(amount);
    setMessage(null);
    setLoading(true);
    setConfirmOpen(false);
    try {
      const res = await mirrorAddFunds({ 
        userId,
        amount: action === 'subtract' ? -parsed : parsed, 
        reason: `${action === 'add' ? 'Added' : 'Subtracted'} by admin: ${reason || 'No reason provided'}`
      });
      setMessage({ 
        type: 'success', 
        text: `${action === 'add' ? 'Added' : 'Subtracted'} ${parsed}. New balance: ${res.availableBalance}` 
      });
      setAmount('');
      setReason('');
      refreshUserData();
      setTimeout(() => {
        window.location.reload();
      }, 500);
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

const MirrorUsers = () => {
  const [loading, setLoading] = useState(false);
  const [mirroredUser, setMirroredUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleMirror = async (userId) => {
    setLoading(true);
    try {
      const token = await impersonateUser(userId);
      console.log('[MirrorUsers] Received token:', token);
      // Validate JWT: should be a string with 2 dots (header.payload.signature)
      if (typeof token === 'string' && token.split('.').length === 3) {
        setMirrorUserToken(token);
        setMirroredUser(userId);
        toast.success('Now mirroring user.');
      } else {
        toast.error('Received malformed token from backend. Check backend JWT generation.');
        console.error('[MirrorUsers] Malformed token:', token);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to mirror user.');
    } finally {
      setLoading(false);
    }
  };

  const handleStopMirroring = () => {
    clearMirrorUserToken();
    setMirroredUser(null);
    setActiveTab('dashboard');
    toast.info('Stopped mirroring user.');
  };

  if (!mirroredUser) {
    return (
      <div className="p-4 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Mirror a User</h1>
        <p className="mb-4 text-gray-400">Select a user to impersonate. You will view their dashboard, portfolio, settings, and KYC here.</p>
        <AdminUserList onSelectUser={handleMirror} />
        {loading && <div className="mt-4 text-yellow-400">Impersonating user...</div>}
      </div>
    );
  }

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Mirroring User: {mirroredUser}</h1>
        <button onClick={handleStopMirroring} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded">Stop Mirroring</button>
      </div>
      <div className="flex space-x-4 border-b border-gray-700 mb-4">
        <button className={`px-4 py-2 ${activeTab === 'dashboard' ? 'border-b-2 border-gold text-gold' : 'text-gray-400'}`} onClick={() => setActiveTab('dashboard')}>Dashboard</button>
        <button className={`px-4 py-2 ${activeTab === 'portfolio' ? 'border-b-2 border-gold text-gold' : 'text-gray-400'}`} onClick={() => setActiveTab('portfolio')}>Portfolio</button>
        <button className={`px-4 py-2 ${activeTab === 'settings' ? 'border-b-2 border-gold text-gold' : 'text-gray-400'}`} onClick={() => setActiveTab('settings')}>Settings</button>
        <button className={`px-4 py-2 ${activeTab === 'kyc' ? 'border-b-2 border-gold text-gold' : 'text-gray-400'}`} onClick={() => setActiveTab('kyc')}>KYC</button>
      </div>
      <div className="space-y-6">
        {activeTab === 'dashboard' && (
          <>
            <div className="p-4 border rounded bg-gray-800">
              <h3 className="text-lg font-semibold mb-4">Admin Mirror: Balance Controls</h3>
              <BalanceControls userId={mirroredUser} />
            </div>

            <div className="border rounded bg-gray-800">
              <Dashboard userId={mirroredUser} isMirrored />
            </div>
          </>
        )}
        {activeTab === 'portfolio' && <Portfolio userId={mirroredUser} isMirrored />}
        {activeTab === 'settings' && <Settings userId={mirroredUser} isMirrored />}
        {activeTab === 'kyc' && <KYCPage userId={mirroredUser} isMirrored />}
      </div>
    </div>
  );
};

export default MirrorUsers;