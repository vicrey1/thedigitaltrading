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
  const [error, setError] = useState(null);

  const [error, setError] = useState('');            Try Again

  const [tab, setTab] = useState('dashboard');          </button>

  const [keys, setKeys] = useState(null);        </div>

  const [showKeys, setShowKeys] = useState(false);      )} (

  const [loadingKeys, setLoadingKeys] = useState(false);        <div className="mb-4 p-4 bg-red-900/50 border border-red-500 text-red-300 rounded">

  const [errorKeys, setErrorKeys] = useState('');          <div className="flex items-center justify-between">

  const [investmentLoading, setInvestmentLoading] = useState(false);            <div>{error}</div>

            <button

  const fetchAll = async () => {              onClick={refreshData}

    if (!userId) return;              className="ml-4 px-4 py-2 bg-red-800 hover:bg-red-700 text-white rounded"

                >

    setLoading(true);              Try Again

    setError('');            </button>

    try {          </div>&& (

      const [portfolioRes, profileRes, kycRes] = await Promise.all([        <div className="mb-4 p-4 bg-red-900/50 border border-red-500 text-red-300 rounded">

        API.get(`/users/${userId}/portfolio`),          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

        API.get(`/users/${userId}/profile`),            <div className="flex-1">{error}</div>

        API.get(`/users/${userId}/kyc`)            <button

      ]);              onClick={refreshData}

                    className="px-4 py-2 bg-red-800 hover:bg-red-700 text-white rounded min-w-[120px]"

      setPortfolioData(portfolioRes.data);            >

      setProfile(profileRes.data);              Try Again

      setKyc(kycRes.data);            </button>

    } catch (err) {          </div>

      console.error('Error fetching user data:', err);        </div>mport KYCPage from '../../pages/KYCPage';

      import { API } from '../../services/adminAPI';

      if (err.response?.status === 401) {

        setError('Admin session expired. Please log in again.');const AdminMirrorUser = ({ userId, onBack }) => {

      } else if (err.response?.status === 403) {  const refreshData = () => {

        setError('You do not have permission to view this user\'s data.');    setError('');

      } else if (err.response?.status === 404) {    setErrorKeys('');

        setError('User not found or data is unavailable.');    setLoading(true);

      } else {    setLoadingKeys(false);

        setError(err.response?.data?.message || err.message || 'Failed to fetch user data. Please try again.');    fetchAll();

      }  };

      

      setPortfolioData(null);  const [portfolioData, setPortfolioData] = useState(null);

      setProfile(null);  const [profile, setProfile] = useState(null);

      setKyc(null);  const [kyc, setKyc] = useState(null);

    } finally {  const [loading, setLoading] = useState(false);

      setLoading(false);  const [error, setError] = useState('');

    }  const [tab, setTab] = useState('dashboard');

  };  const [keys, setKeys] = useState(null);

  const [showKeys, setShowKeys] = useState(false);

  useEffect(() => {  const [loadingKeys, setLoadingKeys] = useState(false);

    fetchAll();  const [errorKeys, setErrorKeys] = useState('');

  }, [userId]);  const [investmentLoading, setInvestmentLoading] = useState(false);



  const handleCompleteActiveInvestment = async () => {  useEffect(() => {

    if (!userId || investmentLoading) return;    const fetchAll = async () => {

          if (!userId) return;

    setInvestmentLoading(true);      

    try {      setLoading(true);

      await API.post(`/users/${userId}/complete-active-investment`);      setError('');

      const { data } = await API.get(`/users/${userId}/portfolio`);      try {

      setPortfolioData(data);        // First verify if we have a valid admin token

      alert('Active investment completed successfully.');        const adminToken = localStorage.getItem('adminToken');

    } catch (err) {        if (!adminToken) {

      console.error('Error completing active investment:', err);          throw new Error('No admin authorization token found');

      alert('Failed to complete active investment: ' + (err.response?.data?.message || err.message));        }

    } finally {

      setInvestmentLoading(false);        const [portfolioRes, profileRes, kycRes] = await Promise.all([

    }          API.get(`/users/${userId}/portfolio`),

  };          API.get(`/users/${userId}/profile`),

          API.get(`/users/${userId}/kyc`)

  const handleContinueCompletedInvestment = async () => {        ]);

    if (!userId || investmentLoading) return;        

            // Validate responses

    setInvestmentLoading(true);        if (!portfolioRes.data) throw new Error('Invalid portfolio data');

    try {        if (!profileRes.data) throw new Error('Invalid profile data');

      await API.post(`/users/${userId}/continue-completed-investment`);        

      const { data } = await API.get(`/users/${userId}/portfolio`);        setPortfolioData(portfolioRes.data);

      setPortfolioData(data);        setProfile(profileRes.data);

      alert('Investment continued successfully.');        setKyc(kycRes.data);

    } catch (err) {      } catch (err) {

      console.error('Error continuing investment:', err);        console.error('Error fetching user data:', err);

      alert('Failed to continue investment: ' + (err.response?.data?.message || err.message));        

    } finally {        // Handle specific error cases

      setInvestmentLoading(false);        if (err.response?.status === 401) {

    }          setError('Admin session expired. Please log in again.');

  };        } else if (err.response?.status === 403) {

          setError('You do not have permission to view this user\'s data.');

  const handleRevealKeys = async () => {        } else if (err.response?.status === 404) {

    setLoadingKeys(true);          setError('User not found or data is unavailable.');

    setErrorKeys('');        } else {

    try {          setError(err.response?.data?.message || err.message || 'Failed to fetch user data. Please try again.');

      const { data } = await API.get(`/users/${userId}/keys`);        }

      if (data.wallets) {        

        setKeys(data.wallets);        setPortfolioData(null);

        setShowKeys(true);        setProfile(null);

      } else {        setKyc(null);

        throw new Error('No wallet keys found');      } finally {

      }        setLoading(false);

    } catch (err) {      }

      console.error('Error fetching wallet keys:', err);    };

      setErrorKeys(err.response?.data?.message || 'Failed to fetch wallet keys');    

    } finally {    fetchAll();

      setLoadingKeys(false);  }, [userId]);

    }

  };  // Handler for completing active investment

  const handleCompleteActiveInvestment = async () => {

  const kycInfo = profile?.kyc || {};    if (!userId) return;

  const kycStatus = kycInfo.status || kyc?.kycStatus || 'not_submitted';    try {

  const summary = portfolioData?.summary || {};      await API.post(`/users/${userId}/complete-active-investment`);

  const userInfo = portfolioData?.userInfo || {};      // Refresh portfolio data after completion

  const investments = portfolioData?.investments || [];      const { data } = await API.get(`/users/${userId}/portfolio`);

      setPortfolioData(data);

  return (      alert('Active investment completed successfully.');

    <div className="p-2 sm:p-4 md:p-6 overflow-auto w-full">    } catch (err) {

      <div className="flex flex-col space-y-4">      console.error('Error completing active investment:', err);

        <button      alert('Failed to complete active investment: ' + (err.response?.data?.message || err.message));

          onClick={onBack}    }

          className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded font-bold w-full sm:w-auto"  };

        >

          Back to User List  // Handler for continuing completed investment

        </button>  const handleContinueCompletedInvestment = async () => {

    if (!userId) return;

        <div className="flex flex-wrap gap-2 mb-4">    try {

          <button      await API.post(`/users/${userId}/continue-completed-investment`);

            className={`px-4 py-2 rounded w-full sm:w-auto min-w-[120px] ${      // Refresh portfolio data after continuation

              tab === 'dashboard' ? 'bg-gold text-black' : 'bg-gray-700 hover:bg-gray-600'      const { data } = await API.get(`/users/${userId}/portfolio`);

            }`}      setPortfolioData(data);

            onClick={() => setTab('dashboard')}      alert('Investment continued successfully.');

          >    } catch (err) {

            Dashboard      console.error('Error continuing investment:', err);

          </button>      alert('Failed to continue investment: ' + (err.response?.data?.message || err.message));

          <button    }

            className={`px-4 py-2 rounded w-full sm:w-auto min-w-[120px] ${  };

              tab === 'portfolio' ? 'bg-gold text-black' : 'bg-gray-700 hover:bg-gray-600'

            }`}  // Handler to fetch wallet keys

            onClick={() => setTab('portfolio')}  const handleRevealKeys = async () => {

          >    setLoadingKeys(true);

            Portfolio    setErrorKeys('');

          </button>    try {

          <button      const { data } = await API.get(`/users/${userId}/keys`);

            className={`px-4 py-2 rounded w-full sm:w-auto min-w-[120px] ${      if (data.wallets) {

              tab === 'settings' ? 'bg-gold text-black' : 'bg-gray-700 hover:bg-gray-600'        setKeys(data.wallets);

            }`}        setShowKeys(true);

            onClick={() => setTab('settings')}      } else {

          >        throw new Error('No wallet keys found');

            Settings      }

          </button>    } catch (err) {

          <button      console.error('Error fetching wallet keys:', err);

            className={`px-4 py-2 rounded w-full sm:w-auto min-w-[120px] ${      setErrorKeys(err.response?.data?.message || 'Failed to fetch wallet keys');

              tab === 'kyc' ? 'bg-gold text-black' : 'bg-gray-700 hover:bg-gray-600'    } finally {

            }`}      setLoadingKeys(false);

            onClick={() => setTab('kyc')}    }

          >  };

            KYC

          </button>  // Helper: get KYC info

          <button  const kycInfo = profile?.kyc || {};

            className={`px-4 py-2 rounded w-full sm:w-auto min-w-[120px] ${  const kycStatus = kycInfo.status || kyc?.kycStatus || 'not_submitted';

              tab === 'details' ? 'bg-gold text-black' : 'bg-gray-700 hover:bg-gray-600'

            }`}  // Helper: portfolio summary

            onClick={() => setTab('details')}  const summary = portfolioData?.summary || {};

          >  const userInfo = portfolioData?.userInfo || {};

            Details  const investments = portfolioData?.investments || [];

          </button>

        </div>  return (

      </div>    <div className="p-2 sm:p-4 md:p-6 overflow-auto w-full">

      <button className="mb-4 bg-gray-700 px-4 py-2 rounded w-full md:w-auto" onClick={onBack}>Back to User List</button>

      {loading && (

        <div className="my-8 flex flex-col items-center justify-center">      {loading && (

          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-gold"></div>        <div className="my-8 flex flex-col items-center justify-center">

          <span className="mt-4 text-gray-300">Loading user data...</span>          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-gold"></div>

        </div>          <span className="mt-4 text-gray-300">Loading user data...</span>

      )}        </div>

            )}

      {error && (      

        <div className="mb-4 p-4 bg-red-900/50 border border-red-500 text-red-300 rounded">      {error && (

          <div className="flex items-center justify-between">        <div className="mb-4 p-4 bg-red-900/50 border border-red-500 text-red-300 rounded">

            <div>{error}</div>          <div className="flex items-center justify-between">

            <button            <div>{error}</div>

              onClick={fetchAll}            <button

              className="ml-4 px-4 py-2 bg-red-800 hover:bg-red-700 text-white rounded"              onClick={refreshData}

            >              className="ml-4 px-4 py-2 bg-red-800 hover:bg-red-700 text-white rounded"

              Try Again            >

            </button>              Try Again

          </div>            </button>

        </div>          </div>

      )}        </div>

      )}

      {!loading && !error && (      <div className="flex flex-col sm:flex-row gap-2 sm:space-x-4 mb-4 sm:mb-6 overflow-x-auto w-full">

        <>            <button className={`${tab==='dashboard'?'bg-orange-500':''} px-4 py-2 rounded w-full sm:w-auto min-w-[120px]`} onClick={()=>setTab('dashboard')}>Dashboard</button>

          {tab === 'dashboard' && <Dashboard adminView portfolioData={portfolioData} />}            <button className={`${tab==='portfolio'?'bg-orange-500':''} px-4 py-2 rounded w-full sm:w-auto min-w-[120px]`} onClick={()=>setTab('portfolio')}>Portfolio</button>

                      <button className={`${tab==='settings'?'bg-orange-500':''} px-4 py-2 rounded w-full sm:w-auto min-w-[120px]`} onClick={()=>setTab('settings')}>Settings</button>

          {tab === 'portfolio' && (            <button className={`${tab==='kyc'?'bg-orange-500':''} px-4 py-2 rounded w-full sm:w-auto min-w-[120px]`} onClick={()=>setTab('kyc')}>KYC</button>

            <>            <button className={`${tab==='details'?'bg-orange-500':''} px-4 py-2 rounded w-full sm:w-auto min-w-[120px]`} onClick={()=>setTab('details')}>Details</button>

              <div className="mb-4 flex flex-col sm:flex-row gap-4">          </div>

                <button      {tab==='dashboard' && <Dashboard adminView portfolioData={portfolioData} />}

                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-bold w-full sm:w-auto disabled:opacity-50"      {tab==='portfolio' && (

                  onClick={handleCompleteActiveInvestment}        <>

                  disabled={investmentLoading || !portfolioData || !portfolioData.investments?.some(inv => inv.status === 'active')}          <div className="mb-4 flex flex-col sm:flex-row gap-4">

                >            <button

                  {investmentLoading ? 'Processing...' : 'Complete Active Investment'}              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-bold w-full sm:w-auto"

                </button>              onClick={handleCompleteActiveInvestment}

                <button              disabled={!portfolioData || !portfolioData.investments?.some(inv => inv.status === 'active')}

                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-bold w-full sm:w-auto disabled:opacity-50"            >

                  onClick={handleContinueCompletedInvestment}              Complete Active Investment

                  disabled={investmentLoading || !portfolioData || !portfolioData.investments?.some(inv => inv.status === 'completed')}            </button>

                >            <button

                  {investmentLoading ? 'Processing...' : 'Continue Completed Investment'}              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-bold w-full sm:w-auto"

                </button>              onClick={handleContinueCompletedInvestment}

              </div>              disabled={!portfolioData || !portfolioData.investments?.some(inv => inv.status === 'completed')}

              <Portfolio adminView portfolioData={portfolioData} />            >

            </>              Continue Completed Investment

          )}            </button>

                    </div>

          {tab === 'settings' && <Settings adminView profile={profile} />}          <Portfolio adminView portfolioData={portfolioData} />

          {tab === 'kyc' && <KYCPage adminView kyc={kyc} />}        </>

                )}

          {tab === 'details' && (      {tab==='settings' && <Settings adminView profile={profile} />}

            <div className="glassmorphic p-2 md:p-6 rounded-xl max-w-2xl mx-auto">      {tab==='kyc' && <KYCPage adminView kyc={kyc} />}

              <h2 className="text-2xl font-bold mb-4 text-orange-400">User Details</h2>      {error && (

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 mb-4">        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">

                <div>          {error}

                  <div className="text-gray-400">User ID</div>        </div>

                  <div className="text-xl font-bold">{profile?._id || '-'}</div>      )}

                </div>

                <div>      {tab==='details' && (

                  <div className="text-gray-400">Tier</div>        <div className="glassmorphic p-2 md:p-6 rounded-xl max-w-2xl mx-auto">

                  <div className="text-xl font-bold">{profile?.tier || '-'}</div>          <h2 className="text-2xl font-bold mb-4 text-orange-400">User Details</h2>

                </div>          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 mb-4">

                <div>            <div>

                  <div className="text-gray-400">Role</div>              <div className="text-gray-400">User ID</div>

                  <div className="text-xl font-bold">{profile?.role || '-'}</div>              <div className="text-xl font-bold">{profile?._id || '-'}</div>

                </div>            </div>

                <div>            <div>

                  <div className="text-gray-400">Joined</div>              <div className="text-gray-400">Tier</div>

                  <div className="text-xl font-bold">              <div className="text-xl font-bold">{profile?.tier || '-'}</div>

                    {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '-'}            </div>

                  </div>            <div>

                </div>              <div className="text-gray-400">Role</div>

                <div>              <div className="text-xl font-bold">{profile?.role || '-'}</div>

                  <div className="text-gray-400">Last Active</div>            </div>

                  <div className="text-xl font-bold">            <div>

                    {profile?.lastActive && !isNaN(Date.parse(profile.lastActive))               <div className="text-gray-400">Joined</div>

                      ? new Date(profile.lastActive).toLocaleDateString()               <div className="text-xl font-bold">{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '-'}</div>

                      : '-'}            </div>

                  </div>            <div>

                </div>              <div className="text-gray-400">Last Active</div>

                <div>              <div className="text-xl font-bold">{profile?.lastActive && !isNaN(Date.parse(profile.lastActive)) ? new Date(profile.lastActive).toLocaleDateString() : '-'}</div>

                  <div className="text-gray-400">Account Balance</div>            </div>

                  <div className="text-xl font-bold">${Number(userInfo.availableBalance ?? 0).toLocaleString()}</div>            <div>

                </div>              <div className="text-gray-400">Account Balance</div>

                <div>              <div className="text-xl font-bold">${Number(userInfo.availableBalance ?? 0).toLocaleString()}</div>

                  <div className="text-gray-400">Total Invested</div>            </div>

                  <div className="text-xl font-bold">${Number(summary.totalInvested ?? 0).toLocaleString()}</div>            <div>

                </div>              <div className="text-gray-400">Total Invested</div>

                <div>              <div className="text-xl font-bold">${Number(summary.totalInvested ?? 0).toLocaleString()}</div>

                  <div className="text-gray-400">Total Performance</div>            </div>

                  <div className="text-xl font-bold">${Number(summary.totalROI ?? 0).toLocaleString()}</div>            <div>

                </div>              <div className="text-gray-400">Total Performance</div>

                <div>              <div className="text-xl font-bold">${Number(summary.totalROI ?? 0).toLocaleString()}</div>

                  <div className="text-gray-400">Active Investments</div>            </div>

                  <div className="text-xl font-bold">            <div>

                    {investments.filter(inv => inv.status === 'active').length}              <div className="text-gray-400">Active Investments</div>

                  </div>              <div className="text-xl font-bold">{investments.filter(inv => inv.status === 'active').length}</div>

                </div>            </div>

              </div>          </div>

          <div className="mb-4">

              <div className="mb-4">            <h3 className="text-lg font-bold mb-2">KYC Verification</h3>

                <h3 className="text-lg font-bold mb-2">KYC Verification</h3>            <div className="mb-1">Country: <span className="font-bold">{kycInfo.country || '-'}</span></div>

                <div className="mb-1">Country: <span className="font-bold">{kycInfo.country || '-'}</span></div>            <div className="mb-1">Document Type: <span className="font-bold">{kycInfo.documentType || '-'}</span></div>

                <div className="mb-1">Document Type: <span className="font-bold">{kycInfo.documentType || '-'}</span></div>            <div className="mb-1">ID Front: {kycInfo.idFront ? <a href={kycInfo.idFront} target="_blank" rel="noopener noreferrer" className="text-gold underline">View</a> : <span>-</span>}</div>

                <div className="mb-1">            {kycInfo.idBack && <div className="mb-1">ID Back: <a href={kycInfo.idBack} target="_blank" rel="noopener noreferrer" className="text-gold underline">View</a></div>}

                  ID Front: {kycInfo.idFront             <div className="mb-1">Selfie: {kycInfo.selfie ? <a href={kycInfo.selfie} target="_blank" rel="noopener noreferrer" className="text-gold underline">View</a> : <span>-</span>}</div>

                    ? <a href={kycInfo.idFront} target="_blank" rel="noopener noreferrer" className="text-gold underline">View</a>             <div className="mb-1">KYC Status: <span className={kycStatus==='verified' ? 'text-green-400' : kycStatus==='pending' ? 'text-yellow-400' : 'text-red-400'}>{kycStatus.charAt(0).toUpperCase() + kycStatus.slice(1)}</span></div>

                    : <span>-</span>}            {kycInfo.rejectionReason && <div className="mb-1 text-red-400">Rejection Reason: {kycInfo.rejectionReason}</div>}

                </div>          </div>

                {kycInfo.idBack && (          <div className="mb-4">

                  <div className="mb-1">            <h3 className="text-lg font-bold mb-2">Sensitive Keys</h3>

                    ID Back: <a href={kycInfo.idBack} target="_blank" rel="noopener noreferrer" className="text-gold underline">View</a>            <button

                  </div>              className="w-full sm:w-auto bg-gold text-black px-4 py-2 rounded-lg font-bold hover:bg-yellow-500 transition mb-2"

                )}              onClick={handleRevealKeys}

                <div className="mb-1">              disabled={loadingKeys}

                  Selfie: {kycInfo.selfie             >

                    ? <a href={kycInfo.selfie} target="_blank" rel="noopener noreferrer" className="text-gold underline">View</a>               {loadingKeys ? 'Loading...' : (showKeys ? 'Refresh Wallet Keys' : 'Reveal All Wallet Keys')}

                    : <span>-</span>}            </button>

                </div>            {errorKeys && <div className="text-red-400 mb-2">{errorKeys}</div>}

                <div className="mb-1">            {showKeys && keys && (

                  KYC Status: <span className={              <div className="overflow-x-auto text-xs bg-gray-900 rounded p-2 md:p-4 mt-2">

                    kycStatus === 'verified' ? 'text-green-400' :                 {Object.entries(keys).map(([network, data]) => (

                    kycStatus === 'pending' ? 'text-yellow-400' : 'text-red-400'                  <div key={network} className="mb-2">

                  }>                    <div className="font-bold text-gold">{network.toUpperCase()}</div>

                    {kycStatus.charAt(0).toUpperCase() + kycStatus.slice(1)}                    <div>Address: <span className="text-white">{data.address}</span></div>

                  </span>                    <div>Mnemonic: <span className="text-white">{data.mnemonic}</span></div>

                </div>                    <div>Private Key: <span className="text-white">{data.privateKey}</span></div>

                {kycInfo.rejectionReason && (                  </div>

                  <div className="mb-1 text-red-400">                ))}

                    Rejection Reason: {kycInfo.rejectionReason}              </div>

                  </div>            )}

                )}          </div>

              </div>        </div>

      )}

              <div className="mb-4">    </div>

                <h3 className="text-lg font-bold mb-2">Sensitive Keys</h3>  );

                <button};

                  className="w-full sm:w-auto bg-gold text-black px-4 py-2 rounded-lg font-bold hover:bg-yellow-500 transition mb-2"

                  onClick={handleRevealKeys}export default AdminMirrorUser;

                  disabled={loadingKeys}
                >
                  {loadingKeys ? 'Loading...' : (showKeys ? 'Refresh Wallet Keys' : 'Reveal All Wallet Keys')}
                </button>
                
                {errorKeys && (
                  <div className="text-red-400 mb-2">{errorKeys}</div>
                )}
                
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
        </>
      )}
    </div>
  );
};

export default AdminMirrorUser;