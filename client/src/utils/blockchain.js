// src/utils/blockchain.js
// Unified blockchain utility for Bitcoin, Ethereum, Tron, USDT (ERC20/TRC20), USDC (ERC20)
// Uses: ethers.js, bitcoinjs-lib, tronweb

import { ethers } from 'ethers';

// --- Ethereum/USDT/USDC (ERC20) ---
export async function getEthWallet({ mnemonic, privateKey, rpcUrl }) {
  let wallet;
  if (mnemonic) {
    wallet = ethers.Wallet.fromMnemonic(mnemonic);
  } else if (privateKey) {
    wallet = new ethers.Wallet(privateKey);
  } else {
    throw new Error('Mnemonic or private key required');
  }
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  return wallet.connect(provider);
}

export async function getEthBalance(wallet) {
  return ethers.utils.formatEther(await wallet.getBalance());
}

export async function sendEth(wallet, to, amountEth) {
  const tx = await wallet.sendTransaction({ to, value: ethers.utils.parseEther(amountEth) });
  return tx;
}

export async function getErc20Balance(wallet, tokenAddress) {
  const abi = ["function balanceOf(address) view returns (uint256)", "function decimals() view returns (uint8)"];
  const contract = new ethers.Contract(tokenAddress, abi, wallet);
  const [balance, decimals] = await Promise.all([
    contract.balanceOf(wallet.address),
    contract.decimals()
  ]);
  return Number(balance) / 10 ** decimals;
}

export async function sendErc20(wallet, tokenAddress, to, amount) {
  const abi = ["function transfer(address,uint256) returns (bool)", "function decimals() view returns (uint8)"];
  const contract = new ethers.Contract(tokenAddress, abi, wallet);
  const decimals = await contract.decimals();
  const tx = await contract.transfer(to, ethers.utils.parseUnits(amount, decimals));
  return tx;
}

// --- Bitcoin (all address types) ---
// NOTE: bitcoinjs-lib v6+ does not export ECPair. Use @bitcoin-js/keys or only support address generation here.
export function getBtcWallet({ mnemonic, privateKey, network = 'mainnet' }) {
  // For browser, only support address generation or use external APIs for signing/sending.
  throw new Error('Direct Bitcoin signing not supported in browser. Use external API or a different library for ECPair.');
}

export async function getBtcBalance(address) {
  // Uses Blockstream public API
  const url = `https://blockstream.info/api/address/${address}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch BTC balance');
  const data = await res.json();
  // Balance is in sats
  return data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum;
}

// --- Tron/USDT TRC20 (browser: use TronGrid REST API) ---
export async function getTrxBalance(address) {
  const res = await fetch(`https://api.trongrid.io/v1/accounts/${address}`);
  const data = await res.json();
  return data.data && data.data[0] ? data.data[0].balance / 1e6 : 0;
}

export async function getTrc20Balance(address, contract = 'TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj') {
  const res = await fetch(`https://api.trongrid.io/v1/accounts/${address}`);
  const data = await res.json();
  if (data.data && data.data[0] && data.data[0].trc20) {
    const usdt = data.data[0].trc20.find(t => t[contract]);
    return usdt ? Number(usdt[contract]) / 1e6 : 0;
  }
  return 0;
}

// Remove TronWeb usage for browser compatibility
export function getTronWallet({ mnemonic, privateKey }) {
  // Only return address for now (no signing)
  // In production, use a proper Tron wallet lib or backend for signing
  throw new Error('Tron wallet signing not supported in browser. Use TronGrid for read-only.');
}

// Add more functions for sending/receiving on each chain as needed
