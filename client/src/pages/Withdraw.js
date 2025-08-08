// src/pages/Withdraw.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCheck, FiInfo, FiClock, FiDollarSign, FiCopy } from 'react-icons/fi';
import { submitWithdrawal, verifyWithdrawalPin } from '../services/withdrawalAPI';
import WithdrawalHistory from '../components/WithdrawalHistory';
import { getUserWithdrawals } from '../services/userWithdrawalAPI';
import { useUser } from '../contexts/UserContext';
import { useUserDataRefresh } from '../contexts/UserDataRefreshContext';
import axios from 'axios';

const Withdraw = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const { kycStatus } = useUser();
  const { refreshUserData } = useUserDataRefresh();
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('ERC20');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [availableBalance, setAvailableBalance] = useState(0);
  const [lockedBalance, setLockedBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [currency, setCurrency] = useState('USDT');
  const [liveRate, setLiveRate] = useState(null);
  const navigate = useNavigate();

  // Available networks and currencies
  const networks = [
    { id: 'BTC', name: 'Bitcoin', currencies: ['BTC'] },
    { id: 'ERC20', name: 'ERC20 (Ethereum)', currencies: ['USDT', 'ETH'] },
    { id: 'TRC20', name: 'TRC20 (Tron)', currencies: ['USDT'] },
    { id: 'BEP20', name: 'BEP20 (Binance Smart Chain)', currencies: ['USDT', 'BNB'] },
  ];

  // Fetch user balances
  useEffect(() => {
    // Fetch user withdrawals from backend
    const fetchWithdrawals = async () => {
      try {
        const data = await getUserWithdrawals();
        setWithdrawals(data);
      } catch (err) {
        setWithdrawals([]);
      }
    };
    fetchWithdrawals();

    // Fetch dashboard available balance from backend
    const fetchBalances = async () => {
      try {
        const res = await axios.get('/api/portfolio', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setAvailableBalance(res.data.userInfo?.availableBalance ?? 0);
        setLockedBalance(res.data.userInfo?.lockedBalance ?? 0);
        // Optionally, set other balances if needed
      } catch (err) {
        setAvailableBalance(0);
        setLockedBalance(0);
      } finally {
        setLoading(false);
      }
    };

    fetchBalances();
  }, []);

  // In your withdrawal form (step 1), add a currency selector if needed, or set currency based on network selection
  // For now, set currency automatically based on network
  useEffect(() => {
    if (selectedNetwork === 'BTC') setCurrency('BTC');
    else if (selectedNetwork === 'ERC20') setCurrency('USDT'); // or 'ETH' if you want to support both
    else if (selectedNetwork === 'TRC20') setCurrency('USDT');
    else if (selectedNetwork === 'BEP20') setCurrency('USDT'); // or 'BNB'
  }, [selectedNetwork]);

  // Fetch live crypto rates for confirmation step
  useEffect(() => {
    if (step === 2) {
      const fetchRate = async () => {
        let url = '';
        if (currency === 'BTC') url = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd';
        else if (currency === 'ETH') url = 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd';
        else if (currency === 'BNB') url = 'https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd';
        else if (currency === 'USDT') url = 'https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=usd';
        if (!url) return;
        try {
          const res = await fetch(url);
          const data = await res.json();
          if (currency === 'BTC') setLiveRate(data.bitcoin.usd);
          else if (currency === 'ETH') setLiveRate(data.ethereum.usd);
          else if (currency === 'BNB') setLiveRate(data.binancecoin.usd);
          else if (currency === 'USDT') setLiveRate(data.tether.usd);
        } catch {
          setLiveRate(null);
        }
      };
      fetchRate();
    }
  }, [step, currency]);

  // Calculate live crypto amount for confirmation step
  const liveCryptoAmount = liveRate ? (parseFloat(amount) / liveRate).toFixed(8) : '--';

  // Ensure currency is always BTC when network is BTC before submitting
  const handleConfirmWithdrawal = async () => {
    setIsSubmitting(true);
    try {
      let submitCurrency = currency;
      let submitNetwork = selectedNetwork;
      if (selectedNetwork === 'BTC') {
        submitCurrency = 'BTC';
        submitNetwork = 'BTC';
      }
      const result = await submitWithdrawal({
        amount: parseFloat(amount),
        currency: submitCurrency,
        network: submitNetwork,
        address: walletAddress,
        pin
      });
      if (!result || !result.cryptoCurrency || !result.cryptoAmount || !result.conversionRate) {
        setPinError('Withdrawal failed. Please try again.');
        setIsSubmitting(false);
        return;
      }
      // Simulate server response delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      // Generate fake transaction ID
      const fakeId = `WD-${Math.random().toString(36).substr(2, 10).toUpperCase()}`;
      setTransactionId(fakeId);
      setStep(3);
      refreshUserData(); // Trigger global refresh
    } catch (error) {
      setPinError(error?.msg || 'Withdrawal error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewWithdrawal = () => {
    setAmount('');
    setWalletAddress('');
    setTransactionId('');
    setStep(1);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    if (window.toast) window.toast.success('Copied!');
  };

  // Helper: Validate wallet address for each network
  function validateWalletAddress(address, network) {
    if (!address) return false;
    switch (network) {
      case 'BTC':
        // Accept all valid Bitcoin address types: Legacy (1), P2SH (3), Bech32 (bc1)
        // Legacy (P2PKH): 1..., 26-35 chars
        // P2SH: 3..., 26-35 chars
        // Bech32: bc1..., 42-62 chars
        return (
          (address.startsWith('1') && address.length >= 26 && address.length <= 35) ||
          (address.startsWith('3') && address.length >= 26 && address.length <= 35) ||
          (address.toLowerCase().startsWith('bc1') && address.length >= 42 && address.length <= 62)
        );
      case 'ERC20':
        // Ethereum address check (starts with 0x, 42 chars)
        return /^0x[a-fA-F0-9]{40}$/.test(address);
      case 'TRC20':
        // Tron address check (starts with T, 34 chars)
        return /^T[a-zA-Z0-9]{33}$/.test(address);
      case 'BEP20':
        // BEP20 uses Ethereum address format
        return /^0x[a-fA-F0-9]{40}$/.test(address);
      default:
        return false;
    }
  }

  // Validate PIN with backend before proceeding to confirmation
  const handleAmountSubmit = async (e) => {
    e.preventDefault();
    setPinError('');
    if (!/^[0-9]{6}$/.test(pin)) {
      setPinError('PIN must be exactly 6 digits.');
      return;
    }
    try {
      await verifyWithdrawalPin(pin);
      setStep(2);
    } catch (error) {
      setPinError(error?.msg || 'Invalid withdrawal PIN.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 p-4 sm:p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
      </div>
    );
  }

  if (kycStatus !== 'verified') {
    return (
      <div className="glassmorphic p-4 sm:p-8 rounded-xl text-center mt-6 sm:mt-10 overflow-auto">
        <h2 className="text-2xl font-bold text-yellow-400 mb-4">KYC Required</h2>
        <p className="text-white mb-4">You must complete KYC verification before you can withdraw funds.</p>
        <a href="/dashboard/kyc" className="bg-gold text-black px-4 py-2 rounded-lg font-bold hover:bg-yellow-500 transition">Go to KYC Verification</a>
      </div>
    );
  }

  return (
    <div className="max-w-4xl w-full mx-auto p-2 sm:p-4 overflow-auto">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row items-center mb-4 sm:mb-6 gap-2 sm:gap-0">
        {step > 1 && (
          <button 
            onClick={() => setStep(step - 1)}
            className="mr-4 p-2 rounded-full hover:bg-gray-800 transition"
          >
            <FiArrowLeft size={20} />
          </button>
        )}
        <h1 className="text-xl sm:text-2xl font-bold text-center w-full">
          {step === 1 && 'Withdraw Funds'}
          {step === 2 && 'Confirm Withdrawal'}
          {step === 3 && 'Withdrawal Submitted'}
        </h1>
      </div>

      {/* Step Indicator */}
      <div className="flex justify-between items-center mb-8 max-w-md mx-auto">
        {[1, 2, 3].map((stepNumber) => (
          <React.Fragment key={stepNumber}>
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full ${
                step >= stepNumber ? 'bg-gold text-black' : 'bg-gray-800 text-gray-400'
              } font-medium`}
            >
              {stepNumber}
            </div>
            {stepNumber < 3 && (
              <div
                className={`flex-1 h-1 mx-2 ${
                  step > stepNumber ? 'bg-gold' : 'bg-gray-800'
                }`}
              ></div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Withdrawal Form */}
      {step === 1 && (
        <div className="glassmorphic p-6 rounded-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-800 bg-opacity-30 p-4 rounded-lg">
              <h3 className="text-lg font-bold mb-2 flex items-center">
                <FiDollarSign className="mr-2 text-gold" /> Available Balance
              </h3>
              <p className="text-2xl">${availableBalance.toLocaleString()}</p>
              <p className="text-sm text-gray-400 mt-2">Ready to withdraw</p>
            </div>
            <div className="bg-gray-800 bg-opacity-30 p-4 rounded-lg">
              <h3 className="text-lg font-bold mb-2 flex items-center">
                <FiClock className="mr-2 text-gold" /> Locked Balance
              </h3>
              <p className="text-2xl">${lockedBalance.toLocaleString()}</p>
              <p className="text-sm text-gray-400 mt-2">In active investments</p>
            </div>
          </div>

          <form onSubmit={handleAmountSubmit}>
            <div className="mb-6">
              <label className="block text-gray-400 mb-2">Withdrawal Amount (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  $
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="10"
                  max={availableBalance}
                  step="0.01"
                  className="w-full bg-dark border border-gray-700 rounded-lg py-3 pl-8 pr-4 focus:border-gold focus:outline-none"
                  placeholder={`Max $${availableBalance.toLocaleString()}`}
                  required
                />
              </div>
              {amount && parseFloat(amount) > availableBalance && (
                <p className="text-red-400 text-sm mt-2">
                  Amount exceeds available balance
                </p>
              )}
              {amount && parseFloat(amount) < 10 && (
                <p className="text-red-400 text-sm mt-2">
                  Minimum withdrawal is $10
                </p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-gray-400 mb-2">Withdrawal Network</label>
              <select
                value={selectedNetwork}
                onChange={(e) => setSelectedNetwork(e.target.value)}
                className="w-full bg-dark border border-gray-700 rounded-lg py-3 px-4 focus:border-gold focus:outline-none"
              >
                {networks.map((network) => (
                  <option key={network.id} value={network.id}>
                    {network.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-gray-400 mb-2">Destination Wallet Address</label>
              <div className="relative">
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="w-full bg-dark border border-gray-700 rounded-lg py-3 px-4 pr-10 focus:border-gold focus:outline-none"
                  placeholder={
                    selectedNetwork === 'BTC' ? 'e.g. 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' :
                    selectedNetwork === 'ERC20' ? 'e.g. 0x...' :
                    selectedNetwork === 'TRC20' ? 'e.g. T...' :
                    selectedNetwork === 'BEP20' ? 'e.g. 0x...' :
                    ''
                  }
                  required
                />
                {walletAddress && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(walletAddress)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gold"
                  >
                    <FiCopy />
                  </button>
                )}
              </div>
              {!validateWalletAddress(walletAddress, selectedNetwork) && walletAddress && (
                <p className="text-red-400 text-xs mt-2">Invalid wallet address for selected network.</p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Ensure the address supports the selected network
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-gray-400 mb-2">6-Digit Withdrawal PIN</label>
              <input
                type="password"
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full bg-dark border border-gray-700 rounded-lg py-3 px-4 focus:border-gold focus:outline-none"
                placeholder="Enter your 6-digit PIN"
                required
                maxLength={6}
                minLength={6}
                pattern="[0-9]{6}"
              />
              {pinError && <p className="text-red-400 text-xs mt-2">{pinError}</p>}
            </div>

            <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg mb-6">
              <div className="flex items-start">
                <FiInfo className="text-gold mt-1 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-300 mb-1">
                    Withdrawals are processed within 24 hours. A network fee may apply.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={
                !amount || 
                parseFloat(amount) > availableBalance || 
                parseFloat(amount) < 10 ||
                !walletAddress ||
                !validateWalletAddress(walletAddress, selectedNetwork)
              }
              className={`w-full py-3 rounded-lg font-bold ${
                !amount || 
                parseFloat(amount) > availableBalance || 
                parseFloat(amount) < 10 ||
                !walletAddress ||
                !validateWalletAddress(walletAddress, selectedNetwork)
                  ? 'bg-gray-700 cursor-not-allowed'
                  : 'bg-gold text-black hover:bg-yellow-600'
              } transition`}
            >
              Continue
            </button>
          </form>
        </div>
      )}

      {/* Step 2: Confirmation */}
      {step === 2 && (
        <div className="glassmorphic p-6 rounded-xl max-w-lg mx-auto">
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-6">Confirm Your Withdrawal</h3>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-400">Amount (USD)</span>
                <span className="font-medium">${amount} USD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Conversion Rate</span>
                <span className="font-medium">
                  1 {currency} = ${liveRate ? parseFloat(liveRate).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '--'} USD
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Network</span>
                <span className="font-medium">
                  {networks.find(n => n.id === selectedNetwork)?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Destination Address</span>
                <span className="font-mono text-sm break-all text-right">
                  {walletAddress}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-800 pt-4">
                <span className="text-gray-400">You Will Receive</span>
                <span className="font-medium">{liveCryptoAmount} {currency}</span>
              </div>
            </div>

            <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg mb-6">
              <div className="flex items-start">
                <FiInfo className="text-gold mt-1 mr-3 flex-shrink-0" />
                <p className="text-sm text-gray-300">
                  Please verify the destination address carefully. Withdrawals cannot be reversed.
                </p>
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-3 rounded-lg font-bold border border-gray-600 hover:bg-gray-800 transition"
            >
              Back
            </button>
            <button
              onClick={handleConfirmWithdrawal}
              disabled={isSubmitting}
              className={`flex-1 py-3 rounded-lg font-bold bg-gold text-black hover:bg-yellow-600 transition ${
                isSubmitting ? 'opacity-75' : ''
              }`}
            >
              {isSubmitting ? 'Processing...' : 'Confirm Withdrawal'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Success */}
      {step === 3 && (
        <div className="glassmorphic p-6 rounded-xl text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-green-500 bg-opacity-20 p-4 rounded-full text-green-500">
              <FiCheck size={40} />
            </div>
          </div>
          
          <h3 className="text-2xl font-bold mb-4">Withdrawal Submitted!</h3>
          <p className="text-gray-400 mb-6">
            Your withdrawal request for {liveCryptoAmount} {currency} (≈ ${amount} USD) has been received.<br/>
            You will be notified once your withdrawal is processed.
          </p>
          <div className="glassmorphic p-4 rounded-lg mb-8">
            <p className="text-sm text-gray-400 mb-1">Transaction ID</p>
            <p className="font-mono text-gold">{transactionId}</p>
            <button
              onClick={() => copyToClipboard(transactionId)}
              className="text-xs text-gray-400 hover:text-gold mt-2 flex items-center justify-center mx-auto"
            >
              <FiCopy className="mr-1" /> Copy
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/portfolio')}
              className="py-3 rounded-lg font-bold border border-gray-600 hover:bg-gray-800 transition"
            >
              View Portfolio
            </button>
            <button
              onClick={handleNewWithdrawal}
              className="py-3 rounded-lg font-bold bg-gold text-black hover:bg-yellow-600 transition"
            >
              New Withdrawal
            </button>
          </div>
        </div>
      )}
      <div className="mt-12">
        <h2 className="text-xl font-bold mb-4">Withdrawal History</h2>
        <WithdrawalHistory withdrawals={withdrawals} />
      </div>
    </div>
  );
}

export default Withdraw;