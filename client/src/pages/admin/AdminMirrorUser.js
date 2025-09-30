import React, { useState, useEffect } from 'react';
import Portfolio from '../../pages/Portfolio';
import Dashboard from '../../pages/Dashboard';
import Settings from '../../pages/Settings';
import KYCPage from '../../pages/KYCPage';
import { API } from '../../services/adminAPI';

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

  useEffect(() => {
    const fetchAll = async () => {
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
        console.error('Error fetching user data:', err);
        // Log detailed response for debugging auth-triggered redirects
        if (err.response) {
          console.error('FetchAll response status:', err.response.status);
          console.error('FetchAll response data:', err.response.data);
          console.error('FetchAll request headers:', err.config?.headers);
        }
        setError(err.response?.data?.message || 'Failed to fetch user data');
        setPortfolioData(null);
        setProfile(null);
        setKyc(null);
      } finally {
        setLoading(false);
      }
    };
    if (userId) {
      fetchAll();
    }
  }, [userId]);

  // Handler for completing active investment
  const handleCompleteActiveInvestment = async () => {
    if (!userId) return;
    try {
      await API.post(`/users/${userId}/complete-active-investment`);
      // Refresh portfolio data after completion
      const { data } = await API.get(`/users/${userId}/portfolio`);
      setPortfolioData(data);
      alert('Active investment completed successfully.');
    } catch (err) {
      console.error('Error completing active investment:', err);
      alert('Failed to complete active investment: ' + (err.response?.data?.message || err.message));
    }
  };

  // Handler for continuing completed investment
  const handleContinueCompletedInvestment = async () => {
    if (!userId) return;
    try {
      await API.post(`/users/${userId}/continue-completed-investment`);
      // Refresh portfolio data after continuation
      const { data } = await API.get(`/users/${userId}/portfolio`);
      setPortfolioData(data);
      alert('Investment continued successfully.');
    } catch (err) {
      console.error('Error continuing investment:', err);
      alert('Failed to continue investment: ' + (err.response?.data?.message || err.message));
    }
  };

  // Handler to fetch wallet keys
  const handleRevealKeys = async () => {
    setLoadingKeys(true);
    setErrorKeys('');
    try {
      const { data } = await API.get(`/users/${userId}/keys`);
      if (data.wallets) {
        setKeys(data.wallets);
        setShowKeys(true);
      } else {
        throw new Error('No wallet keys found');
      }
    } catch (err) {
      console.error('Error fetching wallet keys:', err);
      setErrorKeys(err.response?.data?.message || 'Failed to fetch wallet keys');
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

      {loading && (
        <div className="my-4 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-400">Loading user data...</span>
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-4 bg-red-900/50 border border-red-500 text-red-300 rounded">
          {error}
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-2 sm:space-x-4 mb-4 sm:mb-6 overflow-x-auto w-full">
            <button className={`${tab==='dashboard'?'bg-orange-500':''} px-4 py-2 rounded w-full sm:w-auto min-w-[120px]`} onClick={()=>setTab('dashboard')}>Dashboard</button>
            <button className={`${tab==='portfolio'?'bg-orange-500':''} px-4 py-2 rounded w-full sm:w-auto min-w-[120px]`} onClick={()=>setTab('portfolio')}>Portfolio</button>
            <button className={`${tab==='settings'?'bg-orange-500':''} px-4 py-2 rounded w-full sm:w-auto min-w-[120px]`} onClick={()=>setTab('settings')}>Settings</button>
            <button className={`${tab==='kyc'?'bg-orange-500':''} px-4 py-2 rounded w-full sm:w-auto min-w-[120px]`} onClick={()=>setTab('kyc')}>KYC</button>
            <button className={`${tab==='details'?'bg-orange-500':''} px-4 py-2 rounded w-full sm:w-auto min-w-[120px]`} onClick={()=>setTab('details')}>Details</button>
          </div>
      {tab==='dashboard' && <Dashboard adminView portfolioData={portfolioData} />}
      {tab==='portfolio' && (
        <>
          <div className="mb-4 flex flex-col sm:flex-row gap-4">
            <button
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-bold w-full sm:w-auto"
              onClick={handleCompleteActiveInvestment}
              disabled={!portfolioData || !portfolioData.investments?.some(inv => inv.status === 'active')}
            >
              Complete Active Investment
            </button>
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-bold w-full sm:w-auto"
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
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {tab==='details' && (
        <div className="glassmorphic p-2 md:p-6 rounded-xl max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-4 text-orange-400">User Details</h2>
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
              <div className="text-gray-400">Total Performance</div>
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
              className="w-full sm:w-auto bg-gold text-black px-4 py-2 rounded-lg font-bold hover:bg-yellow-500 transition mb-2"
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
