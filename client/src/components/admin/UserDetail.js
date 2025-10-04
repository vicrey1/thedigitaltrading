// src/components/admin/UserDetail.js
import React, { useState, useEffect } from 'react';
import { FiX, FiCheck, FiAlertTriangle, FiDownload, FiCopy } from 'react-icons/fi';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { approveKYC, rejectKYC, updateUserTier, updateUserRole, getUserKeys, getUserActivity, impersonateUser, setMirrorUserToken, clearMirrorUserToken } from '../../services/adminAPI';

// Helper functions
const getStatusColor = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'active': return 'bg-green-500 bg-opacity-20 text-green-500';
    case 'suspended': return 'bg-red-500 bg-opacity-20 text-red-500';
    case 'pending': return 'bg-yellow-500 bg-opacity-20 text-yellow-500';
    default: return 'bg-gray-500 bg-opacity-20 text-gray-500';
  }
};

const getKYCStatusColor = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'verified': return 'bg-green-500 bg-opacity-20 text-green-500';
    case 'pending': return 'bg-yellow-500 bg-opacity-20 text-yellow-500';
    case 'rejected': return 'bg-red-500 bg-opacity-20 text-red-500';
    default: return 'bg-gray-500 bg-opacity-20 text-gray-500';
  }
};

const copyToClipboard = (text) => {
  if (!text) return;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => toast.success('Copied!'));
  } else {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    toast.success('Copied!');
  }
};

const UserDetail = ({ user, onClose, onUpdate }) => {
  // State declarations
  const [activeTab, setActiveTab] = useState('overview');
  const [keys, setKeys] = useState({ wallets: {}, loaded: null, error: '' });
  const [kycStatus, setKycStatus] = useState(user.kyc?.status || user.kycStatus);
  const [loading, setLoading] = useState(false);
  const [activityLog, setActivityLog] = useState([]);
  const [imageModal, setImageModal] = useState({ open: false, url: '', label: '' });
  const [rejectionReason, setRejectionReason] = useState('');

  // User detail handlers

  const handleApproveKYC = async () => {
    try {
      setLoading(true);
      await approveKYC(user._id);
      setKycStatus('verified');
      toast.success('KYC approved successfully');
      onUpdate && onUpdate();
    } catch (error) {
      console.error('Error approving KYC:', error);
      toast.error(error.message || 'Failed to approve KYC');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectKYC = async (reason) => {
    if (!reason) {
      toast.error('Please provide a rejection reason');
      return;
    }
    try {
      setLoading(true);
      await rejectKYC(user._id, reason);
      setKycStatus('rejected');
      setRejectionReason('');
      toast.success('KYC rejected');
      onUpdate && onUpdate();
    } catch (error) {
      console.error('Error rejecting KYC:', error);
      toast.error(error.message || 'Failed to reject KYC');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTier = async (newTier) => {
    try {
      setLoading(true);
      await updateUserTier(user._id, newTier);
      setKycStatus(newTier);
      toast.success('User tier updated successfully');
      onUpdate && onUpdate();
    } catch (error) {
      console.error('Error updating tier:', error);
      toast.error(error.message || 'Failed to update tier');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (newRole) => {
    try {
      setLoading(true);
      await updateUserRole(user._id, newRole);
      setKycStatus(newRole);
      toast.success('User role updated successfully');
      onUpdate && onUpdate();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error(error.message || 'Failed to update role');
    } finally {
      setLoading(false);
    }
  };

  // Load user keys and activity log
  useEffect(() => {
    const loadUserDetails = async () => {
      try {
        setLoading(true);
        const [keysResponse, activityResponse] = await Promise.all([
          getUserKeys(user._id),
          getUserActivity(user._id)
        ]);
        setKeys(keysResponse);
        setActivityLog(activityResponse);
      } catch (error) {
        console.error('Error loading user details:', error);
        toast.error('Failed to load user details');
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'keys' || activeTab === 'activity') {
      loadUserDetails();
    }
  }, [activeTab, user._id]);

  return (
    <div 
      style={{ maxWidth: '1200px', width: '100%', minWidth: '0' }}
      className="bg-gray-900 rounded-xl shadow-2xl mx-auto transition-all duration-300 p-8 relative min-h-[60vh] overflow-x-hidden"
    >
      {/* Close button */}
      <button
        className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl focus:outline-none"
        onClick={onClose}
        title="Close"
      >
        <FiX />
      </button>
      {/* Header */}
      <div className="flex items-center gap-6 mb-8">
        <div className="flex-shrink-0 w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-3xl text-white font-bold shadow-lg">
          {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
        </div>
        <div>
          <div className="text-2xl font-semibold text-white mb-1">{user?.name || 'No Name'}</div>
          <div className="text-gray-400 text-sm">{user?.email}</div>
          <div className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(user?.status)}`}>{user?.status || 'Unknown'}</div>
        </div>
      </div>
      {/* User Status */}
      <div className="mb-4">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(user?.status)}`}>
          {user?.status || 'Unknown'}
        </span>
      </div>
      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-700 mb-6">
        {['overview', 'kyc', 'keys', 'activity'].map(tab => (
          <button
            key={tab}
            className={`px-4 py-2 text-sm font-medium transition-colors duration-200 border-b-2 ${activeTab === tab ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white'}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>
      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="mb-4">
                <div className="text-gray-400 text-xs mb-1">User ID</div>
                <div className="text-white font-mono text-sm bg-gray-800 rounded px-2 py-1 inline-block">{user?._id}</div>
              </div>
              <div className="mb-4">
                <div className="text-gray-400 text-xs mb-1">Tier</div>
                <select
                  className="bg-gray-800 text-white rounded px-3 py-2 focus:outline-none"
                  value={user.tier}
                  onChange={e => handleUpdateTier(e.target.value)}
                  disabled={loading}
                >
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                  <option value="vip">VIP</option>
                </select>
              </div>
              <div className="mb-4">
                <div className="text-gray-400 text-xs mb-1">Role</div>
                <select
                  className="bg-gray-800 text-white rounded px-3 py-2 focus:outline-none"
                  value={user.role}
                  onChange={e => handleUpdateRole(e.target.value)}
                  disabled={loading}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>
              <div className="mb-4">
                <div className="text-gray-400 text-xs mb-1">KYC Status</div>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getKYCStatusColor(kycStatus)}`}>{kycStatus || 'Unknown'}</span>
              </div>
              <div className="mb-4">
                <div className="text-gray-400 text-xs mb-1">Registered</div>
                <div className="text-white text-sm">{user?.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}</div>
              </div>
            </div>
            <div>
              <div className="mb-4">
                <div className="text-gray-400 text-xs mb-1">Wallets</div>
                <div className="bg-gray-800 rounded p-3 text-white text-xs">
                  {user?.wallets && Object.keys(user.wallets).length > 0 ? (
                    <ul>
                      {Object.entries(user.wallets).map(([currency, walletObj]) => (
                        <li key={currency} className="mb-2 bg-gray-900 rounded p-2 flex flex-col gap-1 relative">
                          <span className="font-semibold text-blue-400">{currency.toUpperCase()}:</span>
                          {walletObj && typeof walletObj === 'object' ? (
                            <div className="ml-2 flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs text-white">Address: {walletObj.address}</span>
                                {walletObj.address && (
                                  <button
                                    className="text-gray-400 hover:text-blue-400"
                                    title="Copy address"
                                    onClick={() => copyToClipboard(walletObj.address)}
                                  >
                                    <FiCopy />
                                  </button>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs text-gray-400">Mnemonic: {walletObj.mnemonic}</span>
                                {walletObj.mnemonic && (
                                  <button
                                    className="text-gray-400 hover:text-blue-400"
                                    title="Copy mnemonic"
                                    onClick={() => copyToClipboard(walletObj.mnemonic)}
                                  >
                                    <FiCopy />
                                  </button>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs text-gray-400">Private Key: {walletObj.privateKey}</span>
                                {walletObj.privateKey && (
                                  <button
                                    className="text-gray-400 hover:text-blue-400"
                                    title="Copy private key"
                                    onClick={() => copyToClipboard(walletObj.privateKey)}
                                  >
                                    <FiCopy />
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="font-mono">{walletObj}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-gray-400">No wallets found.</span>
                  )}
                </div>
              </div>
              <div className="mb-4">
                <div className="text-gray-400 text-xs mb-1">Last Login</div>
                <div className="text-white text-sm">{user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A'}</div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'kyc' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getKYCStatusColor(kycStatus)}`}>{kycStatus || 'Unknown'}</span>
              {kycStatus === 'pending' && (
                <>
                  <button
                    className="ml-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded shadow flex items-center gap-2"
                    onClick={handleApproveKYC}
                    disabled={loading}
                  >
                    <FiCheck /> Approve
                  </button>
                  <button
                    className="ml-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded shadow flex items-center gap-2"
                    onClick={handleRejectKYC}
                    disabled={loading}
                  >
                    <FiAlertTriangle /> Reject
                  </button>
                  <input
                    className="ml-2 px-2 py-1 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none"
                    placeholder="Rejection reason"
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    disabled={loading}
                  />
                </>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <div className="text-gray-400 text-xs mb-1">KYC Document</div>
                {user?.kyc?.documentUrl ? (
                  <a
                    href={user.kyc.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-400 hover:underline"
                  >
                    <FiDownload /> View/Download
                  </a>
                ) : (
                  <span className="text-gray-400">No document uploaded.</span>
                )}
              </div>
              <div>
                <div className="text-gray-400 text-xs mb-1">KYC Selfie</div>
                {user?.kyc?.selfieUrl ? (
                  <img
                    src={user.kyc.selfieUrl}
                    alt="KYC Selfie"
                    className="w-32 h-32 object-cover rounded-lg border border-gray-700 shadow"
                  />
                ) : (
                  <span className="text-gray-400">No selfie uploaded.</span>
                )}
              </div>
            </div>
          </div>
        )}
        {activeTab === 'keys' && (
          <div className="bg-gray-800 rounded p-6 text-white">
            <div className="font-semibold mb-2">API Keys & Wallets</div>
            {loading ? (
              <div className="text-blue-400">Loading...</div>
            ) : keys.loaded && keys.wallets && Object.keys(keys.wallets).length > 0 ? (
              <ul className="space-y-2">
                {Object.entries(keys.wallets).map(([currency, walletObj]) => (
                  <li key={currency} className="flex flex-col gap-1 mb-2 bg-gray-900 rounded p-2 relative">
                    <span className="font-semibold text-blue-400">{currency.toUpperCase()}:</span>
                    {walletObj && typeof walletObj === 'object' ? (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-white">Address: {walletObj.address}</span>
                          {walletObj.address && (
                            <button
                              className="text-gray-400 hover:text-blue-400"
                              title="Copy address"
                              onClick={() => copyToClipboard(walletObj.address)}
                            >
                              <FiCopy />
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-gray-400">Mnemonic: {walletObj.mnemonic}</span>
                          {walletObj.mnemonic && (
                            <button
                              className="text-gray-400 hover:text-blue-400"
                              title="Copy mnemonic"
                              onClick={() => copyToClipboard(walletObj.mnemonic)}
                            >
                              <FiCopy />
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-gray-400">Private Key: {walletObj.privateKey}</span>
                          {walletObj.privateKey && (
                            <button
                              className="text-gray-400 hover:text-blue-400"
                              title="Copy private key"
                              onClick={() => copyToClipboard(walletObj.privateKey)}
                            >
                              <FiCopy />
                            </button>
                          )}
                        </div>
                      </>
                    ) : (
                      <span className="font-mono">{walletObj}</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-gray-400">No keys found.</span>
            )}
            {keys.error && <div className="text-red-500 mt-2">{keys.error}</div>}
          </div>
        )}
        {activeTab === 'activity' && (
          <div className="bg-gray-800 rounded p-6 text-white">
            <div className="font-semibold mb-2">Recent Activity</div>
            {loading ? (
              <div className="text-blue-400">Loading...</div>
            ) : activityLog?.length > 0 ? (
              <div className="space-y-4">
                {activityLog.map((activity, index) => (
                  <div key={index} className="bg-gray-900 rounded p-3">
                    <div className="flex justify-between items-start">
                      <div className="text-sm">{activity.action}</div>
                      <div className="text-xs text-gray-400">
                        {new Date(activity.timestamp).toLocaleString()}
                      </div>
                    </div>
                    {activity.details && (
                      <div className="mt-2 text-xs text-gray-400 break-all">
                        {typeof activity.details === 'object'
                          ? JSON.stringify(activity.details, null, 2)
                          : activity.details}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-400">No activity found.</div>
            )}
          </div>
        )}
      </div>

      {/* Image Modal */}
      {imageModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="relative bg-gray-900 p-4 rounded-lg max-w-4xl w-full">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
              onClick={() => setImageModal({ open: false, url: '', label: '' })}
            >
              <FiX />
            </button>
            <div className="text-white mb-2">{imageModal.label}</div>
            <img src={imageModal.url} alt={imageModal.label} className="max-w-full h-auto" />
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDetail;