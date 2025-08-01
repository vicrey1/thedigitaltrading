// scripts/backfill_wallets.js
const mongoose = require('mongoose');
const User = require('../models/User');
const bitcoin = require('bitcoinjs-lib');
const bip39 = require('bip39');
const ethers = require('ethers');
// Robust TronWeb import/instantiation for all versions
let TronWeb;
try {
  const TronWebImport = require('tronweb');
  TronWeb = TronWebImport && TronWebImport.default ? TronWebImport.default : TronWebImport;
} catch (e) {
  TronWeb = require('tronweb');
}

const MONGO_URI = process.env.MONGO_URI;

async function generateWallets() {
  // BTC
  const btcMnemonic = bip39.generateMnemonic();
  const btcSeed = await bip39.mnemonicToSeed(btcMnemonic);
  const btcNode = bitcoin.bip32.fromSeed(btcSeed);
  const btcKeyPair = btcNode.derivePath("m/44'/0'/0'/0/0");
  const { address: btcAddress } = bitcoin.payments.p2pkh({ pubkey: btcKeyPair.publicKey });
  const btcPrivateKey = btcKeyPair.toWIF();
  // ETH/BNB (EVM)
  const ethWallet = ethers.Wallet.createRandom();
  const ethAddress = ethWallet.address;
  const ethPrivateKey = ethWallet.privateKey;
  const ethMnemonic = ethWallet.mnemonic.phrase;
  // TRON
  const tronWeb = new TronWeb({ fullHost: 'https://api.trongrid.io' });
  const tronAccount = await tronWeb.createAccount();
  const tronAddress = tronAccount.address.base58;
  const tronPrivateKey = tronAccount.privateKey;
  const tronMnemonic = '';
  // USDT & USDC (ERC20 = ETH, TRC20 = TRON)
  return {
    btc: { address: btcAddress, privateKey: btcPrivateKey, mnemonic: btcMnemonic },
    eth: { address: ethAddress, privateKey: ethPrivateKey, mnemonic: ethMnemonic },
    bnb: { address: ethAddress, privateKey: ethPrivateKey, mnemonic: ethMnemonic },
    tron: { address: tronAddress, privateKey: tronPrivateKey, mnemonic: tronMnemonic },
    usdt_erc20: { address: ethAddress, privateKey: ethPrivateKey, mnemonic: ethMnemonic },
    usdt_trc20: { address: tronAddress, privateKey: tronPrivateKey, mnemonic: tronMnemonic },
    usdc_erc20: { address: ethAddress, privateKey: ethPrivateKey, mnemonic: ethMnemonic },
    usdc_trc20: { address: tronAddress, privateKey: tronPrivateKey, mnemonic: tronMnemonic }
  };
}

async function backfill() {
  await mongoose.connect(MONGO_URI);
  const users = await User.find();
  let updated = 0;
  for (const user of users) {
    let needsUpdate = false;
    if (!user.wallets || typeof user.wallets !== 'object') user.wallets = {};
    const wallets = user.wallets;
    if (!wallets.btc || !wallets.btc.address) needsUpdate = true;
    if (!wallets.eth || !wallets.eth.address) needsUpdate = true;
    if (!wallets.bnb || !wallets.bnb.address) needsUpdate = true;
    if (!wallets.tron || !wallets.tron.address) needsUpdate = true;
    if (needsUpdate) {
      const newWallets = await generateWallets();
      user.wallets = { ...wallets, ...newWallets };
      await user.save();
      updated++;
      console.log(`Updated wallets for user ${user.email || user.username}`);
    }
  }
  console.log(`Backfill complete. Updated ${updated} users.`);
  process.exit(0);
}

backfill().catch(e => { console.error(e); process.exit(1); });
