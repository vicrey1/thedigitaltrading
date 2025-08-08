import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Portfolio from '../../pages/Portfolio';
import Dashboard from '../../pages/Dashboard';
import Settings from '../../pages/Settings';
import KYCPage from '../../pages/KYCPage';
import { getUserKeys } from '../../services/adminAPI';

const AdminMirrorUser = ({ userId, onBack }) => {
  const [portfolioData, setPortfolioData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [kyc, setKyc] = useState(null);
  const [tab, setTab] = useState('dashboard');
  const [keys, setKeys] = useState(null);
  const [showKeys, setShowKeys] = useState(false);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [errorKeys, setErrorKeys] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [portfolioRes, profileRes, kycRes] = await Promise.all([
          axios.get(`/api/admin/users/${userId}/portfolio`, { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } }),
          axios.get(`/api/admin/users/${userId}/profile`, { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } }),
          axios.get(`/api/admin/users/${userId}/kyc`, { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } })
        ]);
        setPortfolioData(portfolioRes.data);
        setProfile(profileRes.data);
        setKyc(kycRes.data);
      } catch (err) {
        setPortfolioData(null);
        setProfile(null);
        setKyc(null);
      }
    };
    fetchAll();
  }, [userId]);

  // Handler for completing active investment
  const handleCompleteActiveInvestment = async () => {
    if (!userId) return;
    try {
      await axios.post(`/api/admin/users/${userId}/complete-active-investment`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      // Refresh portfolio data after completion
      const portfolioRes = await axios.get(`/api/admin/users/${userId}/portfolio`, { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } });
      setPortfolioData(portfolioRes.data);
      alert('Active investment completed successfully.');
    } catch (err) {
      alert('Failed to complete active investment: ' + (err.response?.data?.error || err.message));
    }
  };

  // Handler for continuing completed investment
  const handleContinueCompletedInvestment = async () => {
    if (!userId) return;
    try {
      await axios.post(`/api/admin/users/${userId}/continue-completed-investment`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      // Refresh portfolio data after continuation
      const portfolioRes = await axios.get(`/api/admin/users/${userId}/portfolio`, { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } });
      setPortfolioData(portfolioRes.data);
      alert('Investment continued successfully.');
    } catch (err) {
      alert('Failed to continue investment: ' + (err.response?.data?.error || err.message));
    }
  };

  // Handler to fetch wallet keys
  const handleRevealKeys = async () => {
    setLoadingKeys(true);
    setErrorKeys('');
    try {
      const data = await getUserKeys(userId);
      setKeys(data.wallets);
      setShowKeys(true);
    } catch (err) {
      setErrorKeys('Failed to fetch wallet keys.');
    } finally {
      setLoadingKeys(false);
    }
  };

  // Helper: get KYC info
  const kycInfo = profile?.kyc || {};
  const kycStatus = kycInfo.status || kyc?.kycStatus || 'not_submitted';

  // Helper: portfolio summary
  const summary = portfolioData?.summary || {};
  const userInfo = portfolioData?.userInfo || {};
  const investments = portfolioData?.investments || [];

  return (
    <div className="p-2 sm:p-4 md:p-6 overflow-auto w-full">
      <button className="mb-4 bg-gray-700 px-4 py-2 rounded w-full md:w-auto" onClick={onBack}>Back to User List</button>
      <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:space-x-4 mb-4 sm:mb-6 overflow-x-auto w-full">
        <button className={tab==='dashboard'?"bg-gold px-4 py-2 rounded min-w-[120px]":"px-4 py-2 min-w-[120px]"} onClick={()=>setTab('dashboard')}>Dashboard</button>
        <button className={tab==='portfolio'?"bg-gold px-4 py-2 rounded min-w-[120px]":"px-4 py-2 min-w-[120px]"} onClick={()=>setTab('portfolio')}>Portfolio</button>
        <button className={tab==='settings'?"bg-gold px-4 py-2 rounded min-w-[120px]":"px-4 py-2 min-w-[120px]"} onClick={()=>setTab('settings')}>Settings</button>
        <button className={tab==='kyc'?"bg-gold px-4 py-2 rounded min-w-[120px]":"px-4 py-2 min-w-[120px]"} onClick={()=>setTab('kyc')}>KYC</button>
        <button className={tab==='details'?"bg-gold px-4 py-2 rounded min-w-[120px]":"px-4 py-2 min-w-[120px]"} onClick={()=>setTab('details')}>Details</button>
      </div>
      {tab==='dashboard' && <Dashboard adminView portfolioData={portfolioData} />}
      {tab==='portfolio' && (
        <>
          <div className="mb-4 flex gap-4">
            <button
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-bold"
              onClick={handleCompleteActiveInvestment}
              disabled={!portfolioData || !portfolioData.investments?.some(inv => inv.status === 'active')}
            >
              Complete Active Investment
            </button>
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-bold"
              onClick={handleContinueCompletedInvestment}
              disabled={!portfolioData || !portfolioData.investments?.some(inv => inv.status === 'completed')}
            >
              Continue Completed Investment
            </button>
          </div>
          <Portfolio adminView portfolioData={portfolioData} />
        </>
      )}
      {tab==='settings' && <Settings adminView profile={profile} />}
      {tab==='kyc' && <KYCPage adminView kyc={kyc} />}
      {tab==='details' && (
        <div className="glassmorphic p-2 md:p-6 rounded-xl max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-4 text-gold">User Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 mb-4">
            <div>
              <div className="text-gray-400">User ID</div>
              <div className="text-xl font-bold">{profile?._id || '-'}</div>
            </div>
            <div>
              <div className="text-gray-400">Tier</div>
              <div className="text-xl font-bold">{profile?.tier || '-'}</div>
            </div>
            <div>
              <div className="text-gray-400">Role</div>
              <div className="text-xl font-bold">{profile?.role || '-'}</div>
            </div>
            <div>
              <div className="text-gray-400">Joined</div>
              <div className="text-xl font-bold">{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '-'}</div>
            </div>
            <div>
              <div className="text-gray-400">Last Active</div>
              <div className="text-xl font-bold">{profile?.lastActive && !isNaN(Date.parse(profile.lastActive)) ? new Date(profile.lastActive).toLocaleDateString() : '-'}</div>
            </div>
            <div>
              <div className="text-gray-400">Account Balance</div>
              <div className="text-xl font-bold">${Number(userInfo.availableBalance ?? 0).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-gray-400">Total Invested</div>
              <div className="text-xl font-bold">${Number(summary.totalInvested ?? 0).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-gray-400">Total ROI</div>
              <div className="text-xl font-bold">${Number(summary.totalROI ?? 0).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-gray-400">Active Investments</div>
              <div className="text-xl font-bold">{investments.filter(inv => inv.status === 'active').length}</div>
            </div>
          </div>
          <div className="mb-4">
            <h3 className="text-lg font-bold mb-2">KYC Verification</h3>
            <div className="mb-1">Country: <span className="font-bold">{kycInfo.country || '-'}</span></div>
            <div className="mb-1">Document Type: <span className="font-bold">{kycInfo.documentType || '-'}</span></div>
            <div className="mb-1">ID Front: {kycInfo.idFront ? <a href={kycInfo.idFront} target="_blank" rel="noopener noreferrer" className="text-gold underline">View</a> : <span>-</span>}</div>
            {kycInfo.idBack && <div className="mb-1">ID Back: <a href={kycInfo.idBack} target="_blank" rel="noopener noreferrer" className="text-gold underline">View</a></div>}
            <div className="mb-1">Selfie: {kycInfo.selfie ? <a href={kycInfo.selfie} target="_blank" rel="noopener noreferrer" className="text-gold underline">View</a> : <span>-</span>}</div>
            <div className="mb-1">KYC Status: <span className={kycStatus==='verified' ? 'text-green-400' : kycStatus==='pending' ? 'text-yellow-400' : 'text-red-400'}>{kycStatus.charAt(0).toUpperCase() + kycStatus.slice(1)}</span></div>
            {kycInfo.rejectionReason && <div className="mb-1 text-red-400">Rejection Reason: {kycInfo.rejectionReason}</div>}
          </div>
          <div className="mb-4">
            <h3 className="text-lg font-bold mb-2">Sensitive Keys</h3>
            <button
              className="bg-gold text-black px-4 py-2 rounded-lg font-bold hover:bg-yellow-500 transition mb-2"
              onClick={handleRevealKeys}
              disabled={loadingKeys}
            >
              {loadingKeys ? 'Loading...' : (showKeys ? 'Refresh Wallet Keys' : 'Reveal All Wallet Keys')}
            </button>
            {errorKeys && <div className="text-red-400 mb-2">{errorKeys}</div>}
            {showKeys && keys && (
              <div className="overflow-x-auto text-xs bg-gray-900 rounded p-2 md:p-4 mt-2">
                {Object.entries(keys).map(([network, data]) => (
                  <div key={network} className="mb-2">
                    <div className="font-bold text-gold">{network.toUpperCase()}</div>
                    <div>Address: <span className="text-white">{data.address}</span></div>
                    <div>Mnemonic: <span className="text-white">{data.mnemonic}</span></div>
                    <div>Private Key: <span className="text-white">{data.privateKey}</span></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMirrorUser;
