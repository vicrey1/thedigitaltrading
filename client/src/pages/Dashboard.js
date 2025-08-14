import { useState, useEffect } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { FiDownload, FiGlobe, FiCopy, FiTrendingUp, FiDollarSign, FiRefreshCw, FiMessageCircle } from 'react-icons/fi';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getReferralStats } from '../services/referralAPI';
import KYCStatus from '../components/KYCStatus';
import { useUserDataRefresh } from '../contexts/UserDataRefreshContext';
import WalletIcon from '../components/WalletIcon';
import TopRightBar from '../components/TopRightBar'; // Import TopRightBar
// Removed unused import: GoalsDashboard
dayjs.extend(relativeTime);

const COLORS = ['#F7931A', '#627EEA', '#26A17B', '#FFBB28', '#FF8042', '#D4AF37'];

const Dashboard = ({ adminView = false, portfolioData: adminPortfolioData }) => {
  const [portfolioData, setPortfolioData] = useState(adminView ? adminPortfolioData : null);
  const [loading, setLoading] = useState(!adminView);
  const [range, setRange] = useState('7d');
  const [lang, setLang] = useState('en');
  // const [depositBalance, setDepositBalance] = useState(0); // Removed unused variable
  const [referralStats, setReferralStats] = useState(null);
  const [marketNews, setMarketNews] = useState([]);
  const [btcRate, setBtcRate] = useState(null);
  const [ethRate, setEthRate] = useState(null);
  const { lastRefresh } = useUserDataRefresh();


  // Find the active investment (if any)
  const activeInvestment = portfolioData?.investments?.find(inv => inv.status === 'active');

  // Filter performance data for only the active investment
  const getActiveInvestmentPerformance = () => {
    if (!activeInvestment || !activeInvestment.performance) return [];
    const perf = activeInvestment.performance;
    if (range === 'all') return perf;
    if (range === '1d') return perf.slice(-1);
    if (range === '7d') return perf.slice(-7);
    if (range === '1m') return perf.slice(-30);
    if (range === '3m') return perf.slice(-90);
    if (range === '1y') return perf.slice(-365);
    return perf;
  };

  // Get the latest value for the selected range for the active investment
  const filteredPerf = getActiveInvestmentPerformance();
  const latestPerf = filteredPerf.length > 0 ? filteredPerf[filteredPerf.length - 1] : null; // No dash to replace here, but checked for context.
  // ...existing code...

  useEffect(() => {
    if (!adminView) {
      const fetchPortfolioData = async () => {
        try {
          const response = await axios.get('/api/portfolio', {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          });
          // Debug: log full backend response
          console.log('[DASHBOARD] /api/portfolio response:', response.data);
          // Map backend response to expected frontend structure
          const data = response.data;
          // Inject performanceData into the active investment
          let investments = Array.isArray(data.investments) ? [...data.investments] : [];
          const perf = data.performanceData || [];
          const activeIdx = investments.findIndex(inv => inv.status === 'active');
          if (activeIdx !== -1) {
            investments[activeIdx] = {
              ...investments[activeIdx],
              performance: perf
            };
          }
          setPortfolioData({
            ...data,
            investments,
            performance: perf,
            allocation: data.allocationData || [],
            totalValue: data.summary?.totalValue ?? 0,
            netGainLoss: data.summary?.totalROIPercent ?? 0,
            availableBalance: data.userInfo?.availableBalance ?? 0 // Use backend availableBalance
          });
        } catch (err) {
          setPortfolioData(null);
        } finally {
          setLoading(false);
        }
      };
      // Remove fetchDepositBalance, only use backend
      const fetchReferralStats = async () => {
        try {
          const stats = await getReferralStats();
          setReferralStats(stats);
        } catch {}
      };
      fetchPortfolioData();
      fetchReferralStats();
    } else if (adminPortfolioData) {
      // Inject performanceData into the active investment for admin view
      let investments = Array.isArray(adminPortfolioData.investments) ? [...adminPortfolioData.investments] : [];
      const perf = adminPortfolioData.performanceData || [];
      const activeIdx = investments.findIndex(inv => inv.status === 'active');
      if (activeIdx !== -1) {
        investments[activeIdx] = {
          ...investments[activeIdx],
          performance: perf
        };
      }
      setPortfolioData({
        ...adminPortfolioData,
        investments,
        performance: perf,
        allocation: adminPortfolioData.allocationData || [],
        totalValue: adminPortfolioData.summary?.totalValue ?? 0,
        netGainLoss: adminPortfolioData.summary?.totalROIPercent ?? 0,
        availableBalance: adminPortfolioData.userInfo?.availableBalance ?? 0
      });
      setLoading(false);
    }
    // eslint-disable-next
  }, [adminView, adminPortfolioData, lastRefresh]);

  // Re-fetch data when lastRefresh changes (after any user action)
  useEffect(() => {
    const fetchPortfolioData = async () => {
      try {
        const response = await axios.get('/api/portfolio', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        // Debug: log full backend response
        console.log('[DASHBOARD] /api/portfolio response:', response.data);
        const data = response.data;
        // Inject performanceData into the active investment
        let investments = Array.isArray(data.investments) ? [...data.investments] : [];
        const perf = data.performanceData || [];
        const activeIdx = investments.findIndex(inv => inv.status === 'active');
        if (activeIdx !== -1) {
          investments[activeIdx] = {
            ...investments[activeIdx],
            performance: perf
          };
        }
        setPortfolioData({
          ...data,
          investments,
          performance: perf,
          allocation: data.allocationData || [],
          totalValue: data.summary?.totalValue ?? 0,
          netGainLoss: data.summary?.totalROIPercent ?? 0,
          availableBalance: data.userInfo?.availableBalance ?? 0
        });
      } catch (err) {
        setPortfolioData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchPortfolioData();
  }, [lastRefresh]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // Only refresh if not loading
      if (!loading) {
        (async () => {
          try {
            const response = await axios.get('/api/portfolio', {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            });
            // Debug: log full backend response
            console.log('[DASHBOARD] /api/portfolio response:', response.data);
            const data = response.data;
            // Inject performanceData into the active investment
            let investments = Array.isArray(data.investments) ? [...data.investments] : [];
            const perf = data.performanceData || [];
            const activeIdx = investments.findIndex(inv => inv.status === 'active');
            if (activeIdx !== -1) {
              investments[activeIdx] = {
                ...investments[activeIdx],
                performance: perf
              };
            }
            setPortfolioData({
              ...data,
              investments,
              performance: perf,
              allocation: data.allocationData || [],
              totalValue: data.summary?.totalValue ?? 0,
              netGainLoss: data.summary?.totalROIPercent ?? 0,
              availableBalance: data.userInfo?.availableBalance ?? 0
            });
          } catch {}
        })();
      }
    }, 60000); // 60 seconds
    return () => clearInterval(interval);
  }, [loading]);

  // Auto-refresh every 10 seconds for deposit confirmation
  useEffect(() => {
    const interval = setInterval(() => {
      (async () => {
        try {
          const response = await axios.get('/api/portfolio', {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          });
          // Debug: log full backend response
          console.log('[DASHBOARD] /api/portfolio response:', response.data);
          const data = response.data;
          // Inject performanceData into the active investment
          let investments = Array.isArray(data.investments) ? [...data.investments] : [];
          const perf = data.performanceData || [];
          const activeIdx = investments.findIndex(inv => inv.status === 'active');
          if (activeIdx !== -1) {
            investments[activeIdx] = {
              ...investments[activeIdx],
              performance: perf
            };
          }
          setPortfolioData({
            ...data,
            investments,
            performance: perf,
            allocation: data.allocationData || [],
            totalValue: data.summary?.totalValue ?? 0,
            netGainLoss: data.summary?.totalROIPercent ?? 0,
            availableBalance: data.userInfo?.availableBalance ?? 0
          });
        } catch {}
      })();
    }, 10000); // 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Fetch market news automatically from CoinStats API
  useEffect(() => {
    let isMounted = true;
    async function fetchNews() {
      try {
        // Fetch from backend proxy to avoid CORS and keep API key secure
        const response = await axios.get('/api/news');
        console.log('[NEWS API] /api/news response:', response.data);
        if (isMounted && response.data && response.data.result) {
          setMarketNews(response.data.result.map(item => ({
            id: item.id,
            title: item.title,
            publishedAt: item.feedDate || item.publishedAt || item.createdAt || item.date || item.time || item.timestamp
          })));
        }
      } catch (err) {
        // Removed fallback to simulated news if API fails
        setMarketNews([
          { id: 1, title: 'Crypto Hedge Funds Outperform Stocks in Q2', publishedAt: dayjs().subtract(2, 'hour').toISOString() },
          { id: 2, title: 'Solana TVL Spikes 10%', publishedAt: dayjs().subtract(4, 'hour').toISOString() },
          { id: 3, title: 'BlackRock Increases Exposure to BTC', publishedAt: dayjs().subtract(1, 'day').toISOString() },
        ]);
      }
    }
    fetchNews();
    const interval = setInterval(fetchNews, 60000); // Refresh every 60s
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

  useEffect(() => {
    // Fetch live BTC and ETH rates in USD
    const fetchRates = async () => {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd');
        const data = await res.json();
        setBtcRate(data.bitcoin.usd);
        setEthRate(data.ethereum.usd);
      } catch {}
    };
    fetchRates();
  }, []);

  useEffect(() => {
    // Debug: log marketNews to verify news links
    console.log('[DASHBOARD] marketNews:', marketNews);
  }, [marketNews]);


  if (loading || !portfolioData) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div></div>;
  }

  return (
    <div className="space-y-8 max-w-screen-xl mx-auto px-2 md:px-6 py-8">
      <TopRightBar /> {/* Add TopRightBar component */}
      {/* Top: Welcome + Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Welcome tab (2 columns) */}
        <div className="glassmorphic p-6 rounded-xl col-span-2 flex flex-col justify-center">
          <h1 className="text-3xl font-bold mb-2">Welcome back, <span className="text-gold">{portfolioData.userInfo?.name || 'Investor'}</span></h1>
          <div className="flex items-center gap-4 mt-2">
            {portfolioData.userInfo?.tier === 'Starter' ? (
              <button
                className="inline-block bg-gold text-black text-base font-extrabold px-6 py-2 rounded-full shadow-lg hover:bg-yellow-400 transition cursor-pointer border-2 border-yellow-600"
                onClick={() => window.location.href = '/dashboard/portfolio'}
                type="button"
                style={{ letterSpacing: '0.05em', boxShadow: '0 4px 16px 0 rgba(212,175,55,0.15)' }}
              >
                Starter
              </button>
            ) : (
              <span
                className="inline-block bg-gradient-to-r from-yellow-400 via-gold to-yellow-600 text-black text-lg font-extrabold px-8 py-2 rounded-full shadow-lg border-2 border-yellow-700 uppercase tracking-wider"
                style={{ letterSpacing: '0.08em', boxShadow: '0 4px 24px 0 rgba(212,175,55,0.25)' }}
              >
                {portfolioData.userInfo?.planName || portfolioData.userInfo?.tier}
              </span>
            )}
          </div>
          <div className="flex flex-col items-start gap-1 mt-2">
            {portfolioData.userInfo?.tier === 'Starter' ? (
              <>
                <button
                  className="inline-block bg-gray-400 text-black text-base font-extrabold px-6 py-2 rounded-full shadow-lg hover:bg-gray-500 transition cursor-pointer border-2 border-gray-500"
                  onClick={() => window.location.href = '/dashboard/portfolio'}
                  type="button"
                >
                  Upgrade to Investor
                </button>
                <span className="text-xs text-gray-400 mt-1 ml-1">Start your investment journey and unlock exclusive benefits.</span>
              </>
            ) : (
              <>
                <span className="text-xs text-gray-500 mt-1 ml-1">
                  {portfolioData.userInfo?.planName?.toLowerCase().includes('gold') && 'Gold status: Enjoy premium support and top-tier rewards.'}
                  {portfolioData.userInfo?.planName?.toLowerCase().includes('silver') && 'Silver status: Enhanced features and steady growth.'}
                  {portfolioData.userInfo?.planName?.toLowerCase().includes('platinum') && 'Platinum status: Elite access and maximum benefits.'}
                  {!(portfolioData.userInfo?.planName?.toLowerCase().includes('gold') || portfolioData.userInfo?.planName?.toLowerCase().includes('silver') || portfolioData.userInfo?.planName?.toLowerCase().includes('platinum')) && 'Active plan: Your investment is working for you.'}
                </span>
              </>
            )}
          </div>
        </div>
        {/* Available Balance tab (1 column) */}
        <div className="glassmorphic p-6 rounded-xl flex flex-col justify-center items-center relative overflow-hidden shadow-xl border-2 border-yellow-700">
          <div className="absolute -top-6 -right-6 opacity-10 rotate-12">
            <WalletIcon size={90} />
          </div>
          <div className="flex items-center gap-2 mb-2 z-10">
            <WalletIcon size={32} className="text-yellow-400" />
            <span className="text-lg font-bold text-yellow-300 tracking-wide">Available Balance</span>
          </div>
          <div className="text-3xl font-extrabold text-gray-100 mb-1 z-10">${typeof portfolioData.userInfo?.availableBalance === 'number' ? portfolioData.userInfo.availableBalance.toLocaleString() : '0'}</div>
          <div className="text-xs text-gray-400 z-10">Funds ready for investment or withdrawal</div>
        </div>
      </div>

      {/* Performance & Allocation Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="glassmorphic p-6 rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xl font-bold">Performance</h3>
            <select value={range} onChange={e => setRange(e.target.value)} className="bg-gray-800 text-sm rounded px-2 py-1">
              <option value="1d">1d</option>
              <option value="7d">7d</option>
              <option value="1m">1M</option>
              <option value="3m">3M</option>
              <option value="1y">1Y</option>
              <option value="all">All</option>
            </select>
          </div>
          <div className="flex gap-6 mb-2">
            <div>
              <div className="text-xs text-gray-400">Portfolio Value</div>
              <div className="text-lg font-bold text-gray-200">{latestPerf && typeof latestPerf.portfolioValue === 'number' ? `$${latestPerf.portfolioValue.toLocaleString()}` : '--'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">ROI %</div>
              <div className="text-lg font-bold text-green-400">{latestPerf ? `${latestPerf.roiPercent.toFixed(2)}%` : '--'}</div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredPerf}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#aaa" />
                <YAxis yAxisId="left" stroke="#aaa" tickFormatter={v => typeof v === 'number' ? `$${v.toLocaleString()}` : '$0'}/>
                <YAxis yAxisId="right" orientation="right" stroke="#4ade80" tickFormatter={v => `${v}%`}/>
                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#333', borderRadius: '8px' }} formatter={(value, name) => name === 'ROI %' ? `${value}%` : (typeof value === 'number' ? `$${value.toLocaleString()}` : '$0')}/>
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="portfolioValue" stroke="#D4AF37" strokeWidth={2} name="Portfolio Value" dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="roiPercent" stroke="#4ade80" strokeWidth={2} name="ROI %" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glassmorphic p-6 rounded-xl">
          <h3 className="text-xl font-bold mb-4">Asset Allocation</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={portfolioData.allocation || []} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {(portfolioData.allocation || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#333', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Key Actions Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glassmorphic p-6 rounded-xl">
          <h3 className="text-lg font-bold mb-2">Available Balance</h3>
          <div className="text-2xl font-bold mb-2">
            {typeof portfolioData.userInfo?.availableBalance === 'number' ? portfolioData.userInfo.availableBalance.toLocaleString() : '0'}
            <span className="text-xs text-gray-400">
              / {btcRate && typeof portfolioData.userInfo?.availableBalance === 'number' ? (portfolioData.userInfo.availableBalance / btcRate).toFixed(4) : '--'} BTC
              / {ethRate && typeof portfolioData.userInfo?.availableBalance === 'number' ? (portfolioData.userInfo.availableBalance / ethRate).toFixed(4) : '--'} ETH
            </span>
          </div>
          <div className="flex gap-2 mb-2">
            <button
              className="bg-gold text-black px-4 py-2 rounded-lg font-bold hover:bg-yellow-500 transition glass-card scale-100 hover:scale-105 active:scale-95 shadow-lg focus:outline-none focus:ring-2 focus:ring-gold focus:ring-opacity-50"
              onClick={() => window.location.href = '/deposit'}
            >Deposit</button>
            <button
              className="bg-gray-800 text-gold px-4 py-2 rounded-lg font-bold hover:bg-gray-700 transition glass-card scale-100 hover:scale-105 active:scale-95 shadow-lg focus:outline-none focus:ring-2 focus:ring-gold focus:ring-opacity-50"
              onClick={() => window.location.href = '/withdraw'}
            >Withdraw</button>
          </div>
          <div className="text-xs text-gray-400">Deposit via: BTC, ETH, USDT</div>
        </div>
        <div className="glassmorphic p-6 rounded-xl">
          <h3 className="text-lg font-bold mb-2">Withdrawal History</h3>
          <table className="min-w-full text-xs">
            <thead>
              <tr className="text-gold">
                <th className="p-1">Date</th>
                <th className="p-1">Amount</th>
                <th className="p-1">Status</th>
              </tr>
            </thead>
            <tbody>
              {portfolioData.recentActivity.filter(a => a.type === 'Withdrawal').length === 0 ? (
                <tr><td colSpan="3" className="text-center text-gray-400 py-2">No withdrawals found</td></tr>
              ) : (
                portfolioData.recentActivity.filter(a => a.type === 'Withdrawal').map((wd, idx) => (
                  <tr key={idx}>
                    <td className="p-1">{wd.date ? new Date(wd.date).toLocaleDateString() : ''}</td>
                    <td className="p-1">${typeof wd.amount === 'number' ? wd.amount.toLocaleString() : Number(wd.amount ?? 0).toLocaleString()}</td>
                    <td className={`p-1 ${wd.status === 'Completed' ? 'text-green-400' : wd.status === 'Pending' ? 'text-yellow-400' : 'text-gray-400'}`}>{wd.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="text-xs text-gray-400 mt-2">Next Eligible Withdrawal: {/* TODO: backend value */}</div>
        </div>
        {activeInvestment ? (
          <div className="glassmorphic p-6 rounded-xl">
            <h3 className="text-lg font-bold mb-2">Performance Metrics</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-900 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-400">ROI</div>
                <div className="text-xl font-bold text-green-400">{typeof activeInvestment.roiPercent === 'number' ? `${activeInvestment.roiPercent.toFixed(2)}%` : '0%'}</div>
              </div>
              <div className="bg-gray-900 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-400">Sharpe Ratio</div>
                <div className={activeInvestment.sharpeRatio !== null && activeInvestment.sharpeRatio !== undefined ? "text-xl font-bold text-green-400" : "text-xl font-bold"}>
                  {activeInvestment.sharpeRatio !== null && activeInvestment.sharpeRatio !== undefined ? activeInvestment.sharpeRatio.toFixed(2) : <span className="text-xs text-gray-400">Not enough data yet</span>}
                </div>
              </div>
              <div className="bg-gray-900 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-400">Alpha</div>
                <div className={activeInvestment.alpha !== null && activeInvestment.alpha !== undefined ? "text-xl font-bold text-blue-400" : "text-xl font-bold"}>
                  {activeInvestment.alpha !== null && activeInvestment.alpha !== undefined ? activeInvestment.alpha.toFixed(2) : <span className="text-xs text-gray-400">Not enough data yet</span>}
                </div>
              </div>
              <div className="bg-gray-900 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-400">Volatility</div>
                <div className={activeInvestment.volatility !== null && activeInvestment.volatility !== undefined ? "text-xl font-bold text-yellow-400" : "text-xl font-bold"}>
                  {activeInvestment.volatility !== null && activeInvestment.volatility !== undefined ? `${activeInvestment.volatility.toFixed(2)}%` : <span className="text-xs text-gray-400">Not enough data yet</span>}
                </div>
              </div>
              <div className="bg-gray-900 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-400">Max Drawdown</div>
                <div className={activeInvestment.maxDrawdown !== null && activeInvestment.maxDrawdown !== undefined ? "text-xl font-bold text-red-400" : "text-xl font-bold"}>
                  {activeInvestment.maxDrawdown !== null && activeInvestment.maxDrawdown !== undefined ? `${activeInvestment.maxDrawdown.toFixed(2)}%` : <span className="text-xs text-gray-400">Not enough data yet</span>}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="glassmorphic p-6 rounded-xl text-center text-gray-400">
            <h3 className="text-lg font-bold mb-2">Performance Metrics</h3>
            <div>No active investment. Performance metrics are only available for active investments.</div>
          </div>
        )}
      </div>

      {/* Recent Activity & Market Updates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="glassmorphic p-6 rounded-xl">
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          <div className="space-y-4 max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gold scrollbar-track-gray-900/60">
            {portfolioData.recentActivity && portfolioData.recentActivity.length > 0 ? (
              portfolioData.recentActivity.map((activity, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center p-3 border-b border-gray-800 last:border-0">
                  <div className="col-span-1 flex justify-center">
                    <div className={`p-2 rounded-lg ${
                      activity.type === 'Investment' ? 'bg-blue-500 bg-opacity-20 text-blue-500' :
                      activity.type === 'Withdrawal' ? 'bg-red-500 bg-opacity-20 text-red-500' :
                      'bg-green-500 bg-opacity-20 text-green-500'
                    }`}>
                      {activity.type === 'Investment' ? <FiTrendingUp /> :
                       activity.type === 'Withdrawal' ? <FiDollarSign /> : <FiRefreshCw />}
                    </div>
                  </div>
                  <div className="col-span-5">
                    <p className="font-medium">{activity.type}</p>
                    {activity.type === 'Withdrawal' && activity.address && (
                      <p className="text-xs text-gray-400 break-all">{activity.address}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      {activity.fund ? `${activity.fund} • ` : ''}{activity.description}
                    </p>
                  </div>
                  <div className="col-span-2 text-xs text-gray-400 text-center">
                    {activity.date ? new Date(activity.date).toLocaleDateString() : ''}
                  </div>
                  <div className="col-span-2 text-right">
                    <p className={`font-mono ${
                      activity.type === 'Withdrawal' ? 'text-red-500' : 'text-green-500'
                    }`}>
                      {activity.type === 'Withdrawal' ? '-' : '+'}${activity.amount}
                    </p>
                  </div>
                  <div className="col-span-2 text-xs text-center">
                    <span className="inline-block rounded px-2 py-1 bg-gray-800 text-gray-300">
                      {activity.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-400">
                No recent activity found
              </div>
            )}
          </div>
        </div>
        {!adminView && (
          <div className="glassmorphic p-6 rounded-xl">
            <h2 className="text-xl font-bold mb-4">Market Updates</h2>
            {marketNews.length === 0 ? (
              <div className="text-xs text-gray-400 text-center py-8">No news available at this time. Please check back later.</div>
            ) : (
              <ul className="divide-y divide-gray-800">
                {marketNews.map((news) => (
                  <li key={news.id} className="py-3">
                    <a href={news.id} target="_blank" rel="noopener noreferrer" className="font-medium text-base text-gray-200 hover:underline block" style={{fontFamily: 'serif'}}>{news.title}</a>
                    <div className="text-gray-400 text-sm">{news.publishedAt ? dayjs(news.publishedAt).fromNow() : ''}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Referral & Fund Info Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="glassmorphic p-6 rounded-xl">
          <h3 className="text-lg font-bold mb-2">Referral Program</h3>
          <div className="text-xs text-gray-300 mb-4">
            How it works: Share your referral link. When friends sign up and invest, you earn <span className="text-gold font-bold">10% of their investment profits</span> as a cash bonus. The more you invite, the more you earn!
          </div>
          {referralStats ? (
            <>
              <div className="mb-2">Your Referral Link:</div>
              <div className="flex items-center gap-2 mb-2">
            <input className="bg-gray-900 rounded px-2 py-1 text-xs w-48" value={referralStats.referralLink} readOnly />
            <button className="bg-gold text-black px-2 py-1 rounded text-xs flex items-center gap-1 glass-card scale-100 hover:scale-105 active:scale-95 shadow focus:outline-none focus:ring-2 focus:ring-gold focus:ring-opacity-50" onClick={() => {navigator.clipboard.writeText(referralStats.referralLink); window.toast && window.toast.success('Referral link copied!')}}><FiCopy /> Copy</button>
              </div>
              <div className="mb-2">Total Referred Users: <span className="font-bold">{referralStats.referredCount}</span></div>
              <div className="mb-2">Total Earned: <span className="font-bold">${referralStats.totalEarnings}</span></div>
              {((referralStats && referralStats.referredUsers) ? referralStats.referredUsers.length : 0) > 0 && (
                <div className="mb-2 text-xs text-gray-400">Referred: {(referralStats.referredUsers || []).map(u => u.email).join(', ')}</div>
              )}
            </>
          ) : (
            <div className="text-xs text-gray-400">Loading referral info...</div>
          )}
        </div>
        <div className="glassmorphic p-6 rounded-xl">
          <h3 className="text-lg font-bold mb-2">Fund Information</h3>
          <div className="mb-1" style={{fontFamily: 'serif', color: '#e5e7eb'}}>Fund Name: <span className="font-bold">LuxYield Alpha</span></div>
          <div className="mb-1" style={{fontFamily: 'serif', color: '#e5e7eb'}}>Manager: <span className="font-bold">LuxYield</span></div>
          <div className="mb-1" style={{fontFamily: 'serif', color: '#e5e7eb'}}>Fees: <span className="font-bold">2% management, 20% performance</span></div>
          <div className="text-xs text-gray-400 mt-1" style={{fontFamily: 'serif'}}>
            Annual management fee on invested capital. Performance fee applies only to net profits.
          </div>
        </div>
      </div>

      {/* KYC, Chat, Multilingual, Activity, Market Updates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="glassmorphic p-6 rounded-xl mb-6">
          <h3 className="text-lg font-bold mb-2">KYC & Security</h3>
          <KYCStatus />

        </div>
        <div className="glassmorphic p-6 rounded-xl mb-6">
          <h3 className="text-lg font-bold mb-2">Chat & Support</h3>
          <div className="flex flex-col gap-4 mb-2">
            <button
              className="w-full bg-blue-500 text-white py-4 sm:py-6 rounded-xl font-bold text-base sm:text-lg flex items-center justify-center gap-3 shadow-lg hover:bg-blue-600 transition min-h-[56px] sm:min-h-[72px]"
              onClick={() => window.location.href = '/dashboard/support'}
            >
              <FiMessageCircle className="h-6 w-6 sm:h-7 sm:w-7" />
              Support Chat
            </button>
            <button
              className="w-full bg-green-500 text-white py-4 sm:py-6 rounded-xl font-bold text-base sm:text-lg flex items-center justify-center gap-3 shadow-lg hover:bg-green-600 transition min-h-[56px] sm:min-h-[72px]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.8l-4 1 1-3.2A7.96 7.96 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              WhatsApp
            </button>
          </div>
        </div>
      </div>

      {/* Multilingual & Statement Download */}
      <div className="glassmorphic p-6 rounded-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="flex items-center gap-2">
          <FiGlobe />
          <select value={lang} onChange={e => setLang(e.target.value)} className="bg-gray-900 text-xs rounded px-2 py-1">
  <option value="en">English</option>
  <option value="fr">French</option>
  <option value="zh">Chinese</option>
  <option value="es">Spanish</option>
</select>
        </div>
        <button
          className="bg-gold text-black px-4 py-2 rounded-lg font-bold hover:bg-yellow-500 transition glass-card scale-100 hover:scale-105 active:scale-95 shadow-lg focus:outline-none focus:ring-2 focus:ring-gold focus:ring-opacity-50"
          onClick={() => window.location.href = '/statement'}
        >
          <FiDownload className="inline-block mr-2" />
          Download Statement
        </button>
      </div>
    </div>
  );
};

export default Dashboard;