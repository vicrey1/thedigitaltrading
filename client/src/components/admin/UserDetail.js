// src/components/admin/UserDetail.js
import React, { useState } from 'react';
import { FiX, FiCheck, FiAlertTriangle, FiDownload } from 'react-icons/fi';
import { approveKYC, rejectKYC, updateUserTier, updateUserRole, getUserKeys } from '../../services/adminAPI';

const fetchKYCImage = async (filename, token) => {
  const response = await fetch(`/uploads/kyc/${filename}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch image');
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

const UserDetail = ({ user, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('overview');
  // const [notes, setNotes] = useState(user.notes || '');
  const [rejectionReason, setRejectionReason] = useState('');
  const [tier, setTier] = useState(user.tier);
  const [role, setRole] = useState(user.role);
  const [kycStatus, setKycStatus] = useState(user.kyc?.status || user.kycStatus);
  const [loading, setLoading] = useState(false);
  const [imageModal, setImageModal] = useState({ open: false, url: '', label: '' });
  const [keys, setKeys] = useState({ wallets: {}, loaded: false, error: '' });

  const handleApproveKYC = async () => {
    setLoading(true);
    try {
      const updated = await approveKYC(user.id || user._id);
      setKycStatus('verified');
      onUpdate(updated);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectKYC = async () => {
    setLoading(true);
    try {
      const updated = await rejectKYC(user.id || user._id, rejectionReason);
      setKycStatus('rejected');
      onUpdate(updated);
    } finally {
      setLoading(false);
    }
  };

  const handleTierChange = async (e) => {
    const newTier = e.target.value;
    setTier(newTier);
    const userId = user.id || user._id;
    if (!userId) {
      console.warn('User ID is undefined in handleTierChange:', user);
      return;
    }
    const updated = await updateUserTier(userId, newTier);
    onUpdate(updated);
  };

  const handleRoleChange = async (e) => {
    const newRole = e.target.value;
    setRole(newRole);
    const userId = user.id || user._id;
    if (!userId) {
      console.warn('User ID is undefined in handleRoleChange:', user);
      return;
    }
    const updated = await updateUserRole(userId, newRole);
    onUpdate(updated);
  };

  const handleViewKYCImage = async (filename, label) => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const url = await fetchKYCImage(filename, token);
      setImageModal({ open: true, url, label });
    } catch {
      alert('Failed to load image.');
    }
  };

  const handleFetchKeys = async () => {
    setKeys({ wallets: {}, loaded: false, error: '' });
    try {
      const data = await getUserKeys(user.id || user._id);
      setKeys({ wallets: data.wallets, loaded: true, error: '' });
    } catch (err) {
      setKeys({ wallets: {}, loaded: false, error: err.toString() });
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gold scrollbar-track-gray-900/60">
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold">{user.name}</h2>
                <p className="text-gray-400">{user.email}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-700"
              >
                <FiX size={24} />
              </button>
            </div>
            <div className="flex border-b border-gray-700 mb-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 ${activeTab === 'overview' ? 'border-b-2 border-gold' : ''}`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                className={`px-4 py-2 ${activeTab === 'documents' ? 'border-b-2 border-gold' : ''}`}
              >
                Documents
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`px-4 py-2 ${activeTab === 'activity' ? 'border-b-2 border-gold' : ''}`}
              >
                Activity
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className={`px-4 py-2 ${activeTab === 'notes' ? 'border-b-2 border-gold' : ''}`}
              >
                Notes
              </button>
            </div>
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold mb-2">Account Details</h3>
                    <div className="bg-gray-700 p-4 rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-400">User ID</p>
                          <p>{user.id || user._id}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Tier</p>
                          <select value={tier} onChange={handleTierChange} className="bg-gray-800 text-white rounded p-1">
                            <option>Basic</option>
                            <option>Silver</option>
                            <option>Gold</option>
                            <option>VIP</option>
                          </select>
                        </div>
                        <div>
                          <p className="text-gray-400">Role</p>
                          <select value={role} onChange={handleRoleChange} className="bg-gray-800 text-white rounded p-1">
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                        <div>
                          <p className="text-gray-400">KYC Status</p>
                          <p>{kycStatus}</p>
                          {kycStatus === 'pending' && (
                            <div className="flex gap-2 mt-2">
                              <button onClick={handleApproveKYC} className="bg-green-600 px-3 py-1 rounded text-white" disabled={loading}>Approve</button>
                              <button onClick={handleRejectKYC} className="bg-red-600 px-3 py-1 rounded text-white" disabled={loading}>Reject</button>
                              <input type="text" placeholder="Rejection reason" value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} className="bg-gray-800 text-white rounded p-1 ml-2" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-gray-400">Joined</p>
                          <p>{new Date(user.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Last Active</p>
                          <p>{new Date(user.lastActive).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold mb-2">KYC Verification</h3>
                    <div className="bg-gray-700 p-4 rounded-lg">
                      <div className="mb-4">
                        <p className="text-gray-400 font-semibold">Country</p>
                        <p>{user.kyc?.country || 'N/A'}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-gray-400">ID Document</p>
                          {user.kyc?.idUrl ? (
                            <button
                              className="text-gold hover:underline flex items-center"
                              onClick={() => handleViewKYCImage(user.kyc.idUrl.split('/').pop(), 'ID Document')}
                            >
                              <FiDownload className="mr-1" /> View
                            </button>
                          ) : <span className="text-gray-500">Not uploaded</span>}
                        </div>
                        <div>
                          <p className="text-gray-400">Selfie</p>
                          {user.kyc?.selfieUrl ? (
                            <button
                              className="text-gold hover:underline flex items-center"
                              onClick={() => handleViewKYCImage(user.kyc.selfieUrl.split('/').pop(), 'Selfie')}
                            >
                              <FiDownload className="mr-1" /> View
                            </button>
                          ) : <span className="text-gray-500">Not uploaded</span>}
                        </div>
                      </div>
                      <div className={`flex items-center ${
                        kycStatus === 'verified' ? 'text-green-400' : kycStatus === 'rejected' ? 'text-red-400' : 'text-yellow-400'
                      }`}>
                        {kycStatus === 'verified' ? (
                          <FiCheck className="mr-2" />
                        ) : kycStatus === 'rejected' ? (
                          <FiX className="mr-2" />
                        ) : (
                          <FiAlertTriangle className="mr-2" />
                        )}
                        <span>KYC {kycStatus}</span>
                      </div>
                      {kycStatus === 'pending' && (
                        <div className="flex gap-2 mt-4">
                          <button onClick={handleApproveKYC} className="bg-green-600 px-3 py-1 rounded text-white" disabled={loading}>Approve</button>
                          <button onClick={handleRejectKYC} className="bg-red-600 px-3 py-1 rounded text-white" disabled={loading}>Reject</button>
                          <input type="text" placeholder="Rejection reason" value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} className="bg-gray-800 text-white rounded p-1 ml-2" />
                        </div>
                      )}
                      {kycStatus === 'rejected' && user.kyc?.rejectionReason && (
                        <div className="mt-2 text-red-400">Reason: {user.kyc.rejectionReason}</div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold mb-2">Sensitive Keys</h3>
                    <div className="bg-gray-700 p-4 rounded-lg">
                      <button
                        className="bg-gold text-black px-3 py-1 rounded mb-2"
                        onClick={handleFetchKeys}
                        type="button"
                      >
                        Reveal All Wallet Keys
                      </button>
                      {keys.loaded && (
                        <div className="overflow-x-auto text-xs bg-gray-900 rounded p-4 mt-2">
                          {Object.entries(keys.wallets).map(([network, data]) => (
                            <div key={network} className="mb-2">
                              <div className="font-bold text-gold">{network.toUpperCase()}</div>
                              <div>Address: <span className="text-white">{data.address}</span></div>
                              <div>Mnemonic: <span className="text-white">{data.mnemonic}</span></div>
                              <div>Private Key: <span className="text-white">{data.privateKey}</span></div>
                            </div>
                          ))}
                        </div>
                      )}
                      {keys.error && <div className="text-red-400">{keys.error}</div>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold mb-2">KYC Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {user.kyc?.idUrl && (
                    <div>
                      <p className="text-gray-400 mb-1">ID Document</p>
                      <img src={user.kyc.idUrl} alt="ID Document" className="rounded-lg w-full object-cover max-h-48 border border-gold" />
                    </div>
                  )}
                  {user.kyc?.selfieUrl && (
                    <div>
                      <p className="text-gray-400 mb-1">Selfie</p>
                      <img src={user.kyc.selfieUrl} alt="Selfie" className="rounded-lg w-full object-cover max-h-48 border border-gold" />
                    </div>
                  )}
                  {!(user.kyc?.idUrl || user.kyc?.selfieUrl) && (
                    <div className="text-gray-400">No KYC documents uploaded.</div>
                  )}
                </div>
              </div>
            )}

            {/* Other tabs would be implemented similarly */}
          </div>
        </div>
      </div>
      {imageModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl p-6 relative max-w-lg w-full">
            <button onClick={() => setImageModal({ open: false, url: '', label: '' })} className="absolute top-2 right-2 text-white"><FiX size={24} /></button>
            <h3 className="text-lg font-bold mb-4 text-gold">{imageModal.label}</h3>
            <img src={imageModal.url} alt={imageModal.label} className="max-w-full max-h-[60vh] rounded-lg border border-gold" />
          </div>
        </div>
      )}
    </>
  );
};

export default UserDetail;