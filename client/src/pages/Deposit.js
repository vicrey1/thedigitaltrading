// src/pages/Deposit.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiCheck } from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';
import { useUserDataRefresh } from '../contexts/UserDataRefreshContext';

const Deposit = () => {
  const [amount, setAmount] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [wallets, setWallets] = useState(null);
  const [showWallets, setShowWallets] = useState(false);
  const [selectedChain, setSelectedChain] = useState(null);
  const [selectedNetwork, setSelectedNetwork] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState('');
  const [step, setStep] = useState(1); // 1: amount, 2: select crypto/network, 3: confirm sent
  const { refreshUserData } = useUserDataRefresh();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get('/api/deposit/history', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setHistory(res.data.deposits || []);
      } catch {}
    };
    fetchHistory();
  }, [success]);

  useEffect(() => {
    const fetchWallets = async () => {
      try {
        const res = await axios.get('/api/wallets', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setWallets(res.data.wallets);
      } catch {}
    };
    fetchWallets();
  }, []);

  const handleAmountSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!amount || isNaN(amount) || parseFloat(amount) < 300) {
      setError('Minimum deposit is $300'); return;
    }
    setStep(2);
    setShowWallets(true);
    setSelectedChain(null);
    setSelectedNetwork(null);
    setConfirmMsg('');
  };

  const handleConfirmSent = async () => {
    if (!selectedChain || !selectedNetwork) return;
    setConfirming(true);
    setConfirmMsg('');
    try {
      await axios.post('/api/deposit', {
        amount: parseFloat(amount),
        chain: selectedChain,
        network: selectedNetwork
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSuccess(true);
      setAmount('');
      setStep(1);
      setShowWallets(false);
      setConfirmMsg('Deposit submitted! Wait for confirmation.');
      setTimeout(() => setSuccess(false), 2000);
      refreshUserData(); // Trigger global refresh
    } catch (err) {
      setConfirmMsg(err.response?.data?.error || 'Deposit failed');
    } finally {
      setConfirming(false);
    }
  };

  // Helper: Define available networks for each crypto
  const NETWORKS = {
    BTC: ["Mainnet"],
    ETH: ["ERC20", "BEP20"],
    BNB: ["BEP20", "BEP2"],
    TRON: ["TRC20"],
    USDT: ["ERC20", "TRC20"],
    USDC: ["ERC20", "TRC20"]
  };

  // Only show main coins as options
  const COINS = ['BTC', 'ETH', 'BNB', 'TRON', 'USDT', 'USDC'];

  // Helper: Map network+token to wallet key
  const WALLET_KEY_MAP = {
    BTC: { Mainnet: 'btc' },
    ETH: { ERC20: 'eth', BEP20: 'bnb' },
    BNB: { BEP20: 'bnb', BEP2: 'bnb' },
    TRON: { TRC20: 'tron' },
    USDT: {
      ERC20: 'eth', // Use Ethereum address for all ERC20
      TRC20: 'tron' // Use Tron address for all TRC20
    },
    USDC: {
      ERC20: 'eth', // Use Ethereum address for all ERC20
      TRC20: 'tron' // Use Tron address for all TRC20
    }
  };

  // Helper: Crypto display names
  const CRYPTO_DISPLAY = {
    BTC: 'Bitcoin',
    ETH: 'Ethereum',
    BNB: 'Binance Coin',
    TRON: 'Tron',
    USDT: 'Tether (USDT)',
    USDC: 'USD Coin (USDC)'
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Deposit Funds</h1>
      <form onSubmit={handleAmountSubmit} className="glassmorphic p-6 rounded-xl mb-8">
        <label className="block text-gray-400 mb-2">Amount (USD)</label>
        <input
          type="number"
          min="300"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className="w-full bg-dark border border-gray-700 rounded-lg py-3 px-4 mb-2 focus:border-gold focus:outline-none"
          placeholder="Minimum $300"
          required
        />
        {error && <div className="text-red-400 mb-2">{error}</div>}
        <button type="submit" className="w-full py-3 rounded-lg font-bold bg-gold text-black hover:bg-yellow-600 transition" disabled={confirming}>
          Continue
        </button>
        {success && (
          <div className="flex items-center mt-4 text-green-400"><FiCheck className="mr-2" /> Deposit submitted! Wait for confirmation.</div>
        )}
      </form>
      {/* Wallet Addresses Section */}
      {step === 2 && showWallets && wallets && (
        <div className="glassmorphic p-6 rounded-xl mb-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Select Cryptocurrency</h2>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {COINS.map(chain => (
              <button
                key={chain}
                className={`px-6 py-3 rounded-xl font-bold border-2 shadow-lg text-lg transition-all duration-200 ${selectedChain === chain ? 'bg-gold text-black border-gold scale-105' : 'bg-gray-900 text-gold border-gray-700 hover:border-gold hover:scale-105'}`}
                onClick={() => { setSelectedChain(chain); setSelectedNetwork(null); }}
                type="button"
              >
                <div className="text-xl font-extrabold tracking-widest">{chain.toUpperCase()}</div>
                <div className="text-xs text-gray-400 font-normal mt-1">{CRYPTO_DISPLAY[chain] || chain}</div>
              </button>
            ))}
          </div>
          {/* Choose Network Section */}
          {selectedChain && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-3 text-center">Choose Network</h3>
              <div className="flex flex-wrap justify-center gap-3">
                {(NETWORKS[selectedChain] || ["Mainnet"]).map(net => (
                  <button
                    key={net}
                    className={`px-4 py-2 rounded-lg font-bold border transition-all duration-200 ${selectedNetwork === net ? 'bg-gold text-black border-gold scale-105' : 'bg-gray-800 text-gold border-gray-700 hover:border-gold hover:scale-105'}`}
                    onClick={() => setSelectedNetwork(net)}
                    type="button"
                  >
                    {net}
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* Show QR and Address only after network is selected */}
          {selectedChain && selectedNetwork && (() => {
            const walletKey = WALLET_KEY_MAP[selectedChain]?.[selectedNetwork];
            const wallet = walletKey ? wallets[walletKey] : null;
            if (!wallet || !wallet.address) {
              return (
                <div className="flex flex-col items-center mt-6 p-6 rounded-2xl bg-gradient-to-br from-gray-900 to-black shadow-2xl border border-gold">
                  <div className="font-bold text-lg mb-2 uppercase tracking-widest text-gold">{selectedChain} <span className="text-xs text-gray-400">({selectedNetwork})</span></div>
                  <div className="text-red-400 text-center mt-4">Wallet not available. Please contact support.</div>
                </div>
              );
            }
            return (
              <div className="flex flex-col items-center mt-6 p-6 rounded-2xl bg-gradient-to-br from-gray-900 to-black shadow-2xl border border-gold">
                <div className="font-bold text-lg mb-2 uppercase tracking-widest text-gold">{selectedChain} <span className="text-xs text-gray-400">({selectedNetwork})</span></div>
                <QRCodeSVG value={wallet.address} size={160} className="mb-4 border-4 border-gold rounded-2xl bg-white" />
                <div className="mb-2 break-all text-gold text-lg font-mono bg-gray-800 px-4 py-2 rounded-lg shadow-inner">{wallet.address}</div>
                <button className="text-xs text-blue-400 underline mb-2" onClick={() => navigator.clipboard.writeText(wallet.address)}>Copy Address</button>
                <button
                  className="mt-2 py-2 px-8 rounded-lg bg-gold text-black font-bold hover:bg-yellow-600 transition text-lg shadow-lg"
                  onClick={handleConfirmSent}
                  disabled={confirming}
                  type="button"
                >
                  {confirming ? 'Submitting...' : "I've sent the crypto"}
                </button>
                {confirmMsg && <div className="mt-2 text-green-400">{confirmMsg}</div>}
              </div>
            );
          })()}
        </div>
      )}
      <h2 className="text-xl font-bold mb-4">Deposit History</h2>
      <div className="glassmorphic p-4 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gold">
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-right">Amount</th>
              <th className="p-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 && (
              <tr><td colSpan={3} className="text-center text-gray-400 py-6">No deposits yet</td></tr>
            )}
            {history.map(dep => (
              <tr key={dep._id}>
                <td className="p-2">{new Date(dep.createdAt).toLocaleString()}</td>
                <td className="p-2 text-right">${dep.amount.toLocaleString()}</td>
                <td className={`p-2 text-center font-bold ${dep.status === 'confirmed' ? 'text-green-400' : dep.status === 'pending' ? 'text-yellow-400' : 'text-red-400'}`}>{dep.status.charAt(0).toUpperCase() + dep.status.slice(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Deposit;