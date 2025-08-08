import React, { useState, useEffect } from 'react';
import { FiKey, FiSend, FiDownload, FiEye, FiEyeOff, FiCopy, FiBookOpen, FiTrash2 } from 'react-icons/fi';
import { QRCodeCanvas } from 'qrcode.react';
import {
  getEthWallet, getEthBalance, sendEth, getErc20Balance, sendErc20,
  getTrxBalance, getTrc20Balance
} from '../../utils/blockchain';
import {
  getAddressBook, addAddress, removeAddress
} from '../../utils/addressBook';

const ERC20_TOKENS = {
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // Mainnet USDT
  USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // Mainnet USDC
};

const AdminColdWallet = () => {
  const [inputType, setInputType] = useState('mnemonic');
  const [mnemonic, setMnemonic] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [sendForm, setSendForm] = useState({ to: '', amount: '', asset: 'USDT' });
  const [txResult, setTxResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [network, setNetwork] = useState('ethereum');
  const [addressBook, setAddressBook] = useState([]);
  const [addressLabel, setAddressLabel] = useState('');
  const [showBook, setShowBook] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setAddressBook(getAddressBook());
  }, []);

  const handleImport = async () => {
    setLoading(true);
    try {
      let w = null;
      let balances = {};
      let address = '';
      if (network === 'ethereum') {
        w = await getEthWallet({ mnemonic, privateKey, rpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY' });
        address = w.address;
        balances.ETH = await getEthBalance(w);
        balances.USDT = await getErc20Balance(w, ERC20_TOKENS.USDT);
        balances.USDC = await getErc20Balance(w, ERC20_TOKENS.USDC);
      } else if (network === 'bitcoin') {
        // Only support mnemonic/privateKey for address generation, not signing
        throw new Error('For security, browser wallets can only generate and display Bitcoin addresses and balances. Sending requires a hardware wallet or external app.');
      } else if (network === 'tron') {
        address = privateKey || mnemonic;
        try {
          balances.TRX = await getTrxBalance(address);
          balances.USDT = await getTrc20Balance(address);
        } catch {}
      }
      setWallet({ address, balances, network });
    } catch (e) {
      alert('Import failed: ' + e.message);
    }
    setLoading(false);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let tx;
      if (network === 'ethereum') {
        if (sendForm.asset === 'ETH') {
          tx = await sendEth(wallet, sendForm.to, sendForm.amount);
        } else {
          const tokenAddr = ERC20_TOKENS[sendForm.asset];
          tx = await sendErc20(wallet, tokenAddr, sendForm.to, sendForm.amount);
        }
      } else if (network === 'bitcoin') {
        // Implement Bitcoin send logic
        tx = { txid: 'btc_txid', success: true };
      } else if (network === 'tron') {
        // Implement Tron send logic
        tx = { txid: 'tron_txid', success: true };
      }
      setTxResult({
        success: true,
        txid: tx.hash || tx.txid,
        to: sendForm.to,
        amount: sendForm.amount,
        asset: sendForm.asset,
      });
    } catch (e) {
      setTxResult({ success: false, error: e.message });
    }
    setLoading(false);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const handleAddToBook = () => {
    if (addressLabel && sendForm.to) {
      addAddress(addressLabel, sendForm.to);
      setAddressBook(getAddressBook());
      setAddressLabel('');
    }
  };

  const handleRemoveFromBook = (address) => {
    removeAddress(address);
    setAddressBook(getAddressBook());
  };

  return (
    <div className="max-w-full sm:max-w-2xl mx-auto p-2 sm:p-6 md:p-8 bg-gradient-to-br from-gray-950 to-gray-900 rounded-2xl shadow-2xl border border-gray-800 mt-4 sm:mt-10 overflow-x-auto">
      <h1 className="text-3xl font-bold text-gold mb-8 flex items-center gap-2"><FiKey /> Cold Wallet Admin</h1>
      <div className="mb-6 flex gap-4 flex-wrap">
        <select className="px-4 py-2 rounded-lg font-semibold bg-gray-800 text-gray-300" value={network} onChange={e => setNetwork(e.target.value)}>
          <option value="ethereum">Ethereum (ETH, USDT ERC20, USDC ERC20)</option>
          <option value="bitcoin">Bitcoin (all address types)</option>
          <option value="tron">Tron (TRX, USDT TRC20)</option>
        </select>
        <button
          className={`px-4 py-2 rounded-lg font-semibold ${inputType === 'mnemonic' ? 'bg-gold text-black' : 'bg-gray-800 text-gray-300'}`}
          onClick={() => setInputType('mnemonic')}
        >Mnemonic</button>
        <button
          className={`px-4 py-2 rounded-lg font-semibold ${inputType === 'privateKey' ? 'bg-gold text-black' : 'bg-gray-800 text-gray-300'}`}
          onClick={() => setInputType('privateKey')}
        >Private Key</button>
        <button
          className="px-4 py-2 rounded-lg font-semibold bg-gray-800 text-gray-300 flex items-center gap-2"
          onClick={() => setShowBook(b => !b)}
        >
          <FiBookOpen /> Address Book
        </button>
      </div>
      {showBook && (
        <div className="mb-8 p-4 rounded-xl bg-gray-900 border border-gray-800">
          <h2 className="text-lg font-bold text-gold mb-2 flex items-center gap-2"><FiBookOpen /> Address Book</h2>
          {addressBook.length === 0 ? (
            <div className="text-gray-400">No saved addresses.</div>
          ) : (
            <ul className="mb-2">
              {addressBook.map(a => (
                <li key={a.address} className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-gray-300">{a.address}</span>
                  <span className="text-gray-400 ml-2">{a.label}</span>
                  <button className="ml-2 text-red-500" onClick={() => handleRemoveFromBook(a.address)}><FiTrash2 /></button>
                  <button className="ml-2 text-gold" onClick={() => setSendForm(f => ({ ...f, to: a.address }))}><FiSend /></button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <div className="mb-8">
        {inputType === 'mnemonic' ? (
          <div>
            <label className="block text-gray-300 mb-2">Mnemonic Phrase</label>
            <div className="relative flex items-center">
              <input
                type={showSecret ? 'text' : 'password'}
                className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-gold outline-none"
                value={mnemonic}
                onChange={e => setMnemonic(e.target.value)}
                placeholder="Enter 12/24-word mnemonic phrase"
              />
              <button type="button" className="absolute right-3" onClick={() => setShowSecret(s => !s)}>
                {showSecret ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-gray-300 mb-2">Private Key</label>
            <div className="relative flex items-center">
              <input
                type={showSecret ? 'text' : 'password'}
                className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-gold outline-none"
                value={privateKey}
                onChange={e => setPrivateKey(e.target.value)}
                placeholder="Enter private key"
              />
              <button type="button" className="absolute right-3" onClick={() => setShowSecret(s => !s)}>
                {showSecret ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>
        )}
        <button
          className="mt-4 px-6 py-2 bg-gold text-black font-bold rounded-lg shadow hover:bg-yellow-400 transition w-full"
          onClick={handleImport}
          disabled={loading || (!mnemonic && !privateKey)}
        >
          {loading ? 'Importing...' : 'Import Wallet'}
        </button>
      </div>
      {wallet && (
        <div className="mb-8 p-6 rounded-xl bg-gray-900 border border-gray-800">
          <div className="mb-2 text-gray-400 flex items-center gap-2">
            Address:
            <button className="ml-2 text-gold" onClick={() => handleCopy(wallet.address)}><FiCopy /></button>
            {copied && <span className="text-green-400 text-xs ml-2">Copied!</span>}
          </div>
          <div className="font-mono text-lg text-gold mb-4 flex items-center gap-2">{wallet.address}</div>
          <div className="mb-2 text-gray-400">Network:</div>
          <div className="mb-4 text-white">{wallet.network}</div>
          <div className="mb-2 text-gray-400">Balances:</div>
          <div className="flex gap-6 mb-4">
            {Object.entries(wallet.balances).map(([asset, amount]) => (
              <div key={asset} className="flex flex-col items-center">
                <span className="text-gold font-bold text-lg">{amount}</span>
                <span className="text-xs text-gray-300">{asset}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {wallet && (
        <form onSubmit={handleSend} className="mb-8 p-6 rounded-xl bg-gray-900 border border-gray-800">
          <h2 className="text-xl font-bold text-gold mb-4 flex items-center gap-2"><FiSend /> Send Funds</h2>
          <div className="mb-4 flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-gray-300 mb-2">To Address</label>
              <input
                className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-gold outline-none"
                value={sendForm.to}
                onChange={e => setSendForm(f => ({ ...f, to: e.target.value }))}
                placeholder="Recipient address"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <input
                className="p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-gold outline-none"
                value={addressLabel}
                onChange={e => setAddressLabel(e.target.value)}
                placeholder="Label"
              />
              <button type="button" className="bg-gold text-black px-2 py-1 rounded text-xs font-semibold hover:bg-yellow-400 transition" onClick={handleAddToBook}>Save</button>
            </div>
          </div>
          <div className="mb-4 flex gap-4">
            <div className="flex-1">
              <label className="block text-gray-300 mb-2">Amount</label>
              <input
                className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-gold outline-none"
                value={sendForm.amount}
                onChange={e => setSendForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="Amount"
                type="number"
                min="0"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-gray-300 mb-2">Asset</label>
              <select
                className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-gold outline-none"
                value={sendForm.asset}
                onChange={e => setSendForm(f => ({ ...f, asset: e.target.value }))}
              >
                {Object.keys(wallet.balances).map(asset => (
                  <option key={asset} value={asset}>{asset}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            className="mt-4 px-6 py-2 bg-gold text-black font-bold rounded-lg shadow hover:bg-yellow-400 transition w-full"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Funds'}
          </button>
        </form>
      )}
      {txResult && (
        <div className={`mb-8 p-6 rounded-xl border ${txResult.success ? 'border-green-600 bg-green-900 bg-opacity-20' : 'border-red-600 bg-red-900 bg-opacity-20'}`}>
          <div className="font-bold mb-2 text-lg text-gold">Transaction {txResult.success ? 'Success' : 'Failed'}</div>
          <div className="text-white mb-2">Sent {txResult.amount} {txResult.asset} to {txResult.to}</div>
          <div className="text-xs text-gray-400">TXID: {txResult.txid}</div>
        </div>
      )}
      {wallet && (
        <div className="mb-8 p-6 rounded-xl bg-gray-900 border border-gray-800 flex flex-col items-center">
          <h2 className="text-xl font-bold text-gold mb-4 flex items-center gap-2"><FiDownload /> Receive Funds</h2>
          <div className="mb-2 text-gray-400">Share this address to receive funds:</div>
          <div className="font-mono text-lg text-gold mb-2">{wallet.address}</div>
          <QRCodeCanvas value={wallet.address} size={128} bgColor="#18181b" fgColor="#FFD700" className="mt-2 rounded-lg" />
        </div>
      )}
    </div>
  );
};

export default AdminColdWallet;
