import React, { useState, useEffect } from 'react';
import { 
  FiPieChart, 
  FiDollarSign, 
  FiTrendingUp, 
  FiClock,
  FiCalendar,
  // FiInfo,
  FiRefreshCw
} from 'react-icons/fi';
import { 
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import axios from 'axios';
import InvestmentDetail from '../components/InvestmentDetail';
import { useUser } from '../contexts/UserContext';
import { useUserDataRefresh } from '../contexts/UserDataRefreshContext';
import '../custom-scrollbar.css';

// API endpoint for plans
const PLANS_API = '/api/plans';

// Move PLAN_CONFIG to the top, after imports


const Portfolio = ({ adminView = false, portfolioData: adminPortfolioData }) => {
  // Dynamically loaded plans
  const [planConfig, setPlanConfig] = useState({});
  const [investmentPlans, setInvestmentPlans] = useState([]);
  const { kycStatus, isEmailVerified } = useUser();
  const { lastRefresh, refreshUserData } = useUserDataRefresh();
  const [portfolioData, setPortfolioData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [timeRange, setTimeRange] = useState('1y');
  const [selectedInvestment, setSelectedInvestment] = useState(null);

  // Fetch investment plans from backend
  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await axios.get(PLANS_API);
        setInvestmentPlans(res.data);
        // Build planConfig for easy lookup (normalize keys to lowercase and accept multiple ROI field names)
        const configObj = {};
        res.data.forEach(plan => {
          const nameKey = (plan.name || '').trim().toLowerCase();
          configObj[nameKey] = {
            roi: plan.percentReturn ?? plan.roi ?? plan.percent ?? plan.percent_return ?? 0,
            duration: plan.durationDays ?? plan.duration,
            min: plan.minInvestment ?? plan.min,
            max: plan.maxInvestment ?? plan.max,
            color: plan.color || '#D4AF37',
            rawName: plan.name
          };
        });
        setPlanConfig(configObj);
      } catch (err) {
        console.error('Failed to fetch plans:', err);
      }
    }
    fetchPlans();
  }, []);

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [investError, setInvestError] = useState('');
  const [investLoading, setInvestLoading] = useState(false);

  // Fetch portfolio data (auto, robust)
  const fetchPortfolioData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/portfolio', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setPortfolioData(response.data);
    } catch (err) {
      setError(err.message || 'Failed to load portfolio data');
    } finally {
      setLoading(false);
    }
  };

  // Register refreshUserData only once on initial mount
  useEffect(() => {
    if (!adminView && typeof refreshUserData === 'function') {
      refreshUserData(fetchPortfolioData);
    }
    // eslint-disable-next-line
  }, []);

  // Fetch portfolio data when lastRefresh or adminView changes
  useEffect(() => {
    if (!adminView) {
      console.log('[Portfolio.js] User view effect fired');
      fetchPortfolioData();
    }
    // eslint-disable-next-line
  }, [lastRefresh, adminView]);

  useEffect(() => {
    if (adminView && adminPortfolioData && portfolioData !== adminPortfolioData) {
      console.log('[Portfolio.js] Admin view effect fired', { adminPortfolioData, portfolioData });
      setPortfolioData(adminPortfolioData);
      setLoading(false);
    }
    // eslint-disable-next-line
  }, [adminView, adminPortfolioData]);

  // Filter investments based on active tab
  const filteredInvestments = portfolioData?.investments.filter(inv => {
    if (activeTab === 'all') return true;
    return inv.status === activeTab;
  }) || [];

  // COLORS for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#D4AF37', '#8884D8'];

  // Find active investment (if any)
  const activeInvestment = portfolioData?.investments?.find(inv => inv.status === 'active');
  console.log('[PORTFOLIO] activeInvestment:', activeInvestment);
  if (activeInvestment) {
    console.log('[PORTFOLIO] activeInvestment.planName:', activeInvestment.planName);
  }
  // Calculate current value for active investment (no need for activeExpectedROI variable)
  let activeCurrentValue = 0;
  if (activeInvestment) {
    const { value } = getCurrentRoiAndValue(activeInvestment);
    activeCurrentValue = value;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glassmorphic p-6 rounded-xl text-red-400">
        Error: {error}
      </div>
    );
  }

  // Block investment modal if KYC or email not verified
  if (showPlanModal && (kycStatus !== 'verified' || !isEmailVerified)) {
    return (
      <div className="glassmorphic p-8 rounded-xl text-center mt-10">
        <h2 className="text-2xl font-bold text-yellow-400 mb-4">Verification Required</h2>
        {!isEmailVerified ? (
          <>
            <p className="text-white mb-4">You must verify your email before you can invest.</p>
            <a href="/settings" className="bg-gold text-black px-4 py-2 rounded-lg font-bold hover:bg-yellow-500 transition">Go to Email Verification</a>
          </>
        ) : (
          <>
            <p className="text-white mb-4">You must complete KYC verification before you can invest.</p>
            <a href="/kyc" className="bg-gold text-black px-4 py-2 rounded-lg font-bold hover:bg-yellow-500 transition">Go to KYC Verification</a>
          </>
        )}
      </div>
    );
  }

  // Calculate correct current ROI and value for active investments
  function getCurrentRoiAndValue(investment) {
    if (!investment) return { roi: '0.00', value: '0.00', expectedRoi: '' };
    const plan = planConfig[investment.planName];
    if (typeof investment.currentValue === 'number' && !isNaN(investment.currentValue)) {
      const roi = ((investment.currentValue - investment.initialAmount) / investment.initialAmount) * 100;
      return {
        roi: roi.toFixed(2),
        value: investment.currentValue.toFixed(2),
        expectedRoi: plan?.roi || ''
      };
    }
    if (investment.status !== 'active' || !plan) {
      return {
        roi: Number(investment.roi).toFixed(2),
        value: Number(investment.currentValue).toFixed(2),
        expectedRoi: plan?.roi || ''
      };
    }
    const roi = plan.roi;
    const start = new Date(investment.startDate);
    const end = new Date(investment.endDate);
    const now = new Date();
    const totalSeconds = (end - start) / 1000;
    const elapsedSeconds = Math.max(0, Math.min((now - start) / 1000, totalSeconds));
    const progress = totalSeconds > 0 ? elapsedSeconds / totalSeconds : 0;
    const currentRoi = roi * progress;
    const currentValue = investment.initialAmount * (1 + currentRoi / 100);
    return {
      roi: currentRoi.toFixed(2),
      value: currentValue.toFixed(2),
      expectedRoi: roi
    };
  }

  // Helper to find plan config by name (case-insensitive)
  function findPlanConfigByName(name) {
    if (!name || typeof name !== 'string') return null;
    const key = name.trim().toLowerCase();
    return planConfig[key] || null;
  }

  // Check if user has any active investment
  const hasActiveInvestment = filteredInvestments.some(inv => inv.status === 'active');

  return (
    <div className="space-y-8 px-2 sm:px-4 md:px-6 py-6 sm:py-8 w-full max-w-full overflow-x-auto">
      {/* Portfolio Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
        <h1 className="text-2xl font-bold">Investment Portfolio</h1>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-2">
          <button className="flex items-center text-sm bg-gray-800 bg-opacity-50 hover:bg-opacity-70 px-3 py-2 rounded-lg transition">
            <FiRefreshCw className="mr-2" /> Refresh
          </button>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-gray-800 bg-opacity-50 hover:bg-opacity-70 px-3 py-2 rounded-lg text-sm focus:outline-none"
          >
            <option value="1m">1 Month</option>
            <option value="3m">3 Months</option>
            <option value="6m">6 Months</option>
            <option value="1y">1 Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="glassmorphic p-4 sm:p-6 rounded-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400">Total Invested</p>
              <h2 className="text-2xl font-bold">${portfolioData.summary.totalInvested.toLocaleString()}</h2>
            </div>
            <div className="bg-blue-500 bg-opacity-20 p-3 rounded-full text-blue-500">
              <FiDollarSign size={20} />
            </div>
          </div>
        </div>
        <div className="glassmorphic p-4 sm:p-6 rounded-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400">Current Value</p>
              <h2 className="text-2xl font-bold">${Number(activeCurrentValue).toLocaleString(undefined, {maximumFractionDigits: 2})}</h2>
            </div>
            <div className="bg-green-500 bg-opacity-20 p-3 rounded-full text-green-500">
              <FiTrendingUp size={20} />
            </div>
          </div>
        </div>
        <div className="glassmorphic p-4 sm:p-6 rounded-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400">Total ROI (Expected)</p>
              <h2 className="text-2xl font-bold">
                {(() => {
                  if (!activeInvestment) return '--';
                  const cfg = findPlanConfigByName(activeInvestment.planName);
                  return cfg ? (typeof cfg.roi === 'number' ? `${cfg.roi}%` : `${cfg.roi}`) : '--';
                })()}
              </h2>
            </div>
            <div className="bg-purple-500 bg-opacity-20 p-3 rounded-full text-purple-500">
              <FiPieChart size={20} />
            </div>
          </div>
        </div>
        <div className="glassmorphic p-4 sm:p-6 rounded-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400">Active Investments</p>
              <h2 className="text-2xl font-bold">{portfolioData.summary.activeInvestments}</h2>
            </div>
            <div className="bg-yellow-500 bg-opacity-20 p-3 rounded-full text-yellow-500">
              <FiClock size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Performance Chart */}
        <div className="glassmorphic p-4 sm:p-6 rounded-xl overflow-x-auto">
          <h3 className="text-xl font-bold mb-4">Portfolio Growth</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={portfolioData.performanceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis 
                  dataKey="name" 
                  stroke="#aaa" 
                  tickFormatter={(name) => name}
                  interval={0} // Show every tick (daily)
                  tick={{ angle: -35, fontSize: 10, dy: 10 }}
                />
                <YAxis stroke="#aaa" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#333', borderRadius: '8px' }}
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Value']}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="nav"
                  name="Fund NAV"
                  stroke="#D4AF37"
                  strokeWidth={2}
                  dot={{ fill: '#D4AF37', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="benchmark"
                  name="Benchmark"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* Asset Allocation Chart */}
        <div className="glassmorphic p-4 sm:p-6 rounded-xl overflow-x-auto">
          <h3 className="text-xl font-bold mb-4">Asset Allocation</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={portfolioData.allocationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {portfolioData.allocationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#333', borderRadius: '8px' }}
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Value']}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Investments Table */}
      <div className="glassmorphic p-4 sm:p-6 rounded-xl overflow-x-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">Your Investments</h3>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg text-sm ${
                activeTab === 'all' ? 'bg-gold text-black' : 'bg-gray-800 bg-opacity-50 hover:bg-opacity-70'
              } transition`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 rounded-lg text-sm ${
                activeTab === 'active' ? 'bg-gold text-black' : 'bg-gray-800 bg-opacity-50 hover:bg-opacity-70'
              } transition`}
            >
              Active
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-4 py-2 rounded-lg text-sm ${
                activeTab === 'completed' ? 'bg-gold text-black' : 'bg-gray-800 bg-opacity-50 hover:bg-opacity-70'
              } transition`}
            >
              Completed
            </button>
          </div>
        </div>

        <div className="hidden sm:block overflow-x-auto w-full">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-left">
                <th className="pb-4">Fund</th>
                <th className="pb-4">Plan</th>
                <th className="pb-4 text-right">Invested</th>
                <th className="pb-4 text-right">Current Value</th>
                <th className="pb-4 text-right">ROI (Expected)</th>
                <th className="pb-4">Duration</th>
                <th className="pb-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvestments.map((investment) => {
                const { value } = getCurrentRoiAndValue(investment);
                return (
                  <tr key={investment.id} className="border-b border-gray-800 hover:bg-gray-800 hover:bg-opacity-30 transition">
                    <td className="py-4">
                      <div className="font-medium">{investment.fundName}</div>
                      <div className="text-sm text-gray-400">ID: {investment.id}</div>
                    </td>
                    <td className="py-4">
                      <div className="font-medium">{investment.planName}</div>
                      <div className="text-sm text-gray-400">
                        {investment.status === 'active' ? 'Active' : 'Completed'}
                      </div>
                    </td>
                    <td className="py-4 text-right font-mono">${investment.initialAmount.toLocaleString()}</td>
                    <td className="py-4 text-right font-mono">${Number(value).toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
                    <td className="py-4 text-right font-mono text-gold">
                      {(() => {
                        const cfg = findPlanConfigByName(investment.planName);
                        return cfg ? (typeof cfg.roi === 'number' ? `${cfg.roi}%` : `${cfg.roi}`) : '--';
                      })()}
                    </td>
                    <td className="py-4">
                      <div className="flex items-center">
                        <FiCalendar className="mr-2 text-gray-400" />
                        <span className="text-sm">
                          {investment.startDate ? new Date(investment.startDate).toLocaleDateString() : ''} -{' '}
                          {investment.endDate ? new Date(investment.endDate).toLocaleDateString() : ''}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <button 
                        onClick={() => setSelectedInvestment(investment)}
                        className="text-gold hover:underline text-sm font-medium"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Mobile card layout for investments */}
        <div className="sm:hidden space-y-4">
          {filteredInvestments.map((investment) => {
            const { value } = getCurrentRoiAndValue(investment);
            return (
              <div key={investment.id} className="glassmorphic p-4 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <div className="font-bold text-lg">{investment.fundName}</div>
                    <div className="text-xs text-gray-400">ID: {investment.id}</div>
                  </div>
                  <span className="px-2 py-1 rounded bg-gray-800 text-xs text-gray-200">{investment.status}</span>
                </div>
                <div className="mb-1 text-sm"><span className="font-bold">Plan:</span> {investment.planName}</div>
                <div className="mb-1 text-sm"><span className="font-bold">Invested:</span> ${investment.initialAmount.toLocaleString()}</div>
                <div className="mb-1 text-sm"><span className="font-bold">Current Value:</span> ${Number(value).toLocaleString(undefined, {maximumFractionDigits: 2})}</div>
                <div className="mb-1 text-sm"><span className="font-bold">ROI (Expected):</span> {(() => {
                  const cfg = findPlanConfigByName(investment.planName);
                  return cfg ? (typeof cfg.roi === 'number' ? `${cfg.roi}%` : `${cfg.roi}`) : '--';
                })()}</div>
                <div className="mb-1 text-sm"><span className="font-bold">Duration:</span> {investment.startDate ? new Date(investment.startDate).toLocaleDateString() : ''} - {investment.endDate ? new Date(investment.endDate).toLocaleDateString() : ''}</div>
                <button 
                  onClick={() => setSelectedInvestment(investment)}
                  className="mt-2 w-full bg-gold text-black px-4 py-2 rounded-lg font-bold hover:bg-yellow-500 transition text-sm"
                >
                  Details
                </button>
              </div>
            );
          })}
        </div>

        {filteredInvestments.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No investments found matching your criteria
          </div>
        )}
      </div>

      {/* Investment Plans Section */}
      <div className="glassmorphic p-4 sm:p-6 rounded-xl mb-8">
        <h2 className="text-xl font-bold mb-4">Investment Plans</h2>
        {investmentPlans.length === 0 ? (
          <div className="text-center py-8 text-gray-400">No plans available</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid grid-cols-2 gap-4">
              {investmentPlans.slice(0,2).map(plan => (
                <div key={plan.name} className="bg-gray-900 rounded-xl p-4 flex flex-col items-center border-2" style={{ borderColor: plan.color || '#D4AF37' }}>
                  <div className="text-2xl font-bold mb-2" style={{ color: plan.color || '#D4AF37' }}>{plan.name}</div>
                  <div className="mb-1">ROI (Expected): <span className="font-bold">{plan.percentReturn}%</span></div>
                  <div className="mb-1">Duration: <span className="font-bold">{plan.durationDays} days</span></div>
                  <div className="mb-1">Min: <span className="font-bold">${plan.minInvestment}</span></div>
                  <div className="mb-1">Max: <span className="font-bold">${plan.maxInvestment}</span></div>
                  <button className="mt-2 bg-gold text-black px-4 py-2 rounded-lg font-bold hover:bg-yellow-500 transition" onClick={() => { if (!hasActiveInvestment) { setSelectedPlan(plan); setShowPlanModal(true); }}} disabled={hasActiveInvestment}>
                    Start Investment
                  </button>
                  {hasActiveInvestment && <div className="text-xs text-red-400 mt-2">You can only have one active investment at a time.</div>}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {investmentPlans.slice(2,4).map(plan => (
                <div key={plan.name} className="bg-gray-900 rounded-xl p-4 flex flex-col items-center border-2" style={{ borderColor: plan.color || '#D4AF37' }}>
                  <div className="text-2xl font-bold mb-2" style={{ color: plan.color || '#D4AF37' }}>{plan.name}</div>
                  <div className="mb-1">ROI (Expected): <span className="font-bold">{plan.percentReturn}%</span></div>
                  <div className="mb-1">Duration: <span className="font-bold">{plan.durationDays} days</span></div>
                  <div className="mb-1">Min: <span className="font-bold">${plan.minInvestment}</span></div>
                  <div className="mb-1">Max: <span className="font-bold">${plan.maxInvestment}</span></div>
                  <button className="mt-2 bg-gold text-black px-4 py-2 rounded-lg font-bold hover:bg-yellow-500 transition" onClick={() => { setSelectedPlan(plan); setShowPlanModal(true); }}>Start Investment</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Plan Modal */}
      {showPlanModal && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl p-8 w-full max-w-md relative">
            <button className="absolute top-2 right-2 text-gold" onClick={() => setShowPlanModal(false)}>✕</button>
            <h2 className="text-xl font-bold mb-4">Invest in {selectedPlan.name} Plan</h2>
            {/* Available Balance Display */}
            <div className="mb-4 p-3 rounded-lg bg-gray-800 flex items-center justify-between">
              <span className="text-gray-300 font-medium">Available Balance</span>
              <span className="text-2xl font-bold text-gold">${portfolioData?.userInfo?.availableBalance !== undefined ? Number(portfolioData.userInfo.availableBalance).toLocaleString() : '0'}</span>
            </div>
            <div className="mb-2">ROI (Expected): <span className="font-bold">{selectedPlan.percentReturn ?? selectedPlan.roi}%</span></div>
            <div className="mb-2">Duration: <span className="font-bold">{selectedPlan.durationDays ?? selectedPlan.duration} days</span></div>
            <div className="mb-2">Min: <span className="font-bold">${selectedPlan.minInvestment ?? selectedPlan.min}</span></div>
            <div className="mb-2">Max: <span className="font-bold">${selectedPlan.maxInvestment ?? selectedPlan.max}</span></div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setInvestError('');
              setInvestLoading(true);
              if (hasActiveInvestment) {
                setInvestError('You can only have one active investment at a time.'); setInvestLoading(false); return;
              }
              if (!investmentAmount || isNaN(investmentAmount)) {
                setInvestError('Enter a valid amount'); setInvestLoading(false); return;
              }
              const amt = parseFloat(investmentAmount);
              const min = selectedPlan.minInvestment ?? selectedPlan.min;
              const max = selectedPlan.maxInvestment ?? selectedPlan.max;
              if (amt < min || amt > max) {
                setInvestError(`Amount must be between $${min} and $${max}`); setInvestLoading(false); return;
              }
              try {
                await axios.post('/api/portfolio/invest', {
                  plan: selectedPlan.name,
                  amount: amt,
                  roi: selectedPlan.percentReturn ?? selectedPlan.roi,
                  duration: selectedPlan.durationDays ?? selectedPlan.duration
                }, {
                  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setShowPlanModal(false);
                setInvestmentAmount('');
                // Always refresh user and portfolio data to update available balance
                if (typeof refreshUserData === 'function') refreshUserData();
                if (typeof fetchPortfolioData === 'function') fetchPortfolioData();
                // window.location.reload();
                // refreshUserData();
              } catch (err) {
                setInvestError(err.response?.data?.error || 'Failed to invest');
              } finally {
                setInvestLoading(false);
              }
            }}>
              <input
                type="number"
                min={selectedPlan.minInvestment ?? selectedPlan.min}
                max={selectedPlan.maxInvestment ?? selectedPlan.max}
                value={investmentAmount}
                onChange={e => setInvestmentAmount(e.target.value)}
                className="w-full p-2 rounded bg-gray-800 text-white mb-2"
                placeholder={`Enter amount ($${selectedPlan.minInvestment ?? selectedPlan.min} - $${selectedPlan.maxInvestment ?? selectedPlan.max})`}
              />
              {investError && <div className="text-red-400 mb-2">{investError}</div>}
              <button type="submit" className="mt-2 bg-gold text-black px-4 py-2 rounded-lg font-bold hover:bg-yellow-500 transition w-full" disabled={investLoading}>
                {investLoading ? 'Investing...' : 'Confirm Investment'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Recent Activity Section */}
      <div className="glassmorphic p-4 sm:p-6 rounded-xl overflow-x-auto">
        <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
        <div className="space-y-4 max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gold scrollbar-track-gray-900/60">
          {portfolioData.recentActivity && portfolioData.recentActivity.length > 0 ? (
            portfolioData.recentActivity.map((activity, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 border-b border-gray-800 last:border-0">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg mr-4 ${
                    activity.type === 'Investment' ? 'bg-blue-500 bg-opacity-20 text-blue-500' :
                    activity.type === 'Withdrawal' ? 'bg-red-500 bg-opacity-20 text-red-500' :
                    'bg-green-500 bg-opacity-20 text-green-500'
                  }`}>
                    {activity.type === 'Investment' ? <FiTrendingUp /> :
                     activity.type === 'Withdrawal' ? <FiDollarSign /> : <FiRefreshCw />}
                  </div>
                  <div>
                    <p className="font-medium">{activity.type}</p>
                    <p className="text-sm text-gray-400">
                      {activity.description} {activity.fund ? `• ${activity.fund}` : ''} • {activity.date ? new Date(activity.date).toLocaleDateString() : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-mono ${
                    activity.type === 'Withdrawal' ? 'text-red-500' : 'text-green-500'
                  }`}>
                    {activity.type === 'Withdrawal' ? '-' : '+'}${activity.amount}
                  </p>
                  <span className="text-xs text-gray-400">{activity.status}</span>
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

      {selectedInvestment && (
        <InvestmentDetail 
          investment={selectedInvestment} 
          onClose={() => setSelectedInvestment(null)} 
        />
      )}
    </div>
  );
};

export default Portfolio;