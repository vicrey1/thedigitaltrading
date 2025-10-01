import React, { useState, useEffect } from 'react';
import Portfolio from '../../pages/Portfolio';
import Dashboard from '../../pages/Dashboard';
import Settings from '../../pages/Settings';
import KYCPage from '../../pages/KYCPage';
import { API } from '../../services/adminAPI';
import { useNavigate } from 'react-router-dom';

const AdminMirrorUser = ({ userId, onBack }) => {
  const [portfolioData, setPortfolioData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [kyc, setKyc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('dashboard');
  const [keys, setKeys] = useState(null);
  const [showKeys, setShowKeys] = useState(false);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [errorKeys, setErrorKeys] = useState('');
  const [investmentLoading, setInvestmentLoading] = useState(false);

  const fetchAll = async () => {
    if (!userId) return;

    setLoading(true);
    setError('');

    try {
      const [portfolioRes, profileRes, kycRes] = await Promise.all([
        API.get(`/users/${userId}/portfolio`),
        API.get(`/users/${userId}/profile`),
        API.get(`/users/${userId}/kyc`)
      ]);

      setPortfolioData(portfolioRes.data);
      setProfile(profileRes.data);
      setKyc(kycRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch user data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [userId]);

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
        <div className="flex items-center justify-between">
          <div>{error}</div>
          <button
            onClick={() => { setError(''); fetchAll(); }}
            className="px-4 py-2 bg-red-800 hover:bg-red-700 text-white rounded"
          >
            Try Again
          </button>
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

      {tab === 'dashboard' && <Dashboard userId={userId} />}
      {tab === 'portfolio' && <Portfolio userId={userId} />}
      {tab === 'settings' && <Settings userId={userId} />}
      {tab === 'kyc' && <KYCPage userId={userId} />}
    </div>
  );
};

export default AdminMirrorUser;