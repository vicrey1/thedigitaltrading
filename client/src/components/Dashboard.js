import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DepositModal from '../components/DepositModal';
import WithdrawalModal from '../components/WithdrawalModal';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CryptoPriceWidget from './CryptoPriceWidget';
import BlockchainTransactions from './BlockchainTransactions';
import CryptoNewsFeed from './CryptoNewsFeed';
import SimulatedGrowth from './SimulatedGrowth';
import FakeTransactionLogs from './FakeTransactionLogs';
import AutoProfitReport from './AutoProfitReport';
import FakeUserActivity from './FakeUserActivity';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const fundTypes = ['Spot Market', 'Derivatives', 'Yield Farming', 'NFT Fund', 'Arbitrage'];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get('/api/user/dashboard', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setDashboardData(response.data);
      } catch (err) {
        setError('Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

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

  // Fallback demo wallet if none found
  const walletAddresses = dashboardData?.userInfo?.wallets
    ? Object.values(dashboardData.userInfo.wallets).map(w => w.address).filter(Boolean)
    : ['0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe']; // Vitalik's wallet as demo

  return (
    <div>
      <SimulatedGrowth plan={dashboardData?.userInfo?.tier || 'Starter'} balance={dashboardData?.summary?.totalBalance || 10000} />
      <AutoProfitReport />
      <FakeTransactionLogs />
      <FakeUserActivity />
      <CryptoPriceWidget portfolioUSD={dashboardData?.summary?.totalBalance || 0} />
      <BlockchainTransactions walletAddresses={walletAddresses} />
      <CryptoNewsFeed />
      <div className="glass-card p-6 rounded-xl mb-4">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, <span className="text-gold-gradient">{dashboardData.userInfo.name}</span>
        </h1>
        <p className="text-gray-400">Your portfolio is performing better than 87% of investors</p>
      </div>
      {/* Add your dashboard content here, e.g. charts, quick actions, etc. */}
      <button onClick={() => setIsDepositOpen(true)} className="mr-2 px-4 py-2 bg-gold rounded">Deposit</button>
      <button onClick={() => setIsWithdrawOpen(true)} className="px-4 py-2 bg-blue-500 rounded">Withdraw</button>
      <DepositModal isOpen={isDepositOpen} onClose={() => setIsDepositOpen(false)} fundTypes={fundTypes} />
      <WithdrawalModal isOpen={isWithdrawOpen} onClose={() => setIsWithdrawOpen(false)} investments={dashboardData.investments} />
      <ToastContainer position="bottom-right" autoClose={5000} />
    </div>
  );
};

export default Dashboard;