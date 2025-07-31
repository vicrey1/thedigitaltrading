// Correct Solana wallet generation from mnemonic using ed25519-hd-key and @solana/web3.js
// Install dependencies: npm install bip39 ed25519-hd-key @solana/web3.js

const bip39 = require('bip39');
const ed25519 = require('ed25519-hd-key');
const solanaWeb3 = require('@solana/web3.js');

async function generateSolanaWallet() {
  // 1. Generate mnemonic
  const mnemonic = bip39.generateMnemonic();
  // 2. Derive seed from mnemonic
  const seed = await bip39.mnemonicToSeed(mnemonic);
  // 3. Use standard Solana derivation path: m/44'/501'/0'/0'
  const derivationPath = "m/44'/501'/0'/0'";
  const derivedSeed = ed25519.derivePath(derivationPath, seed.toString('hex')).key;
  // 4. Create keypair from derived seed
  const keypair = solanaWeb3.Keypair.fromSeed(derivedSeed);
  // 5. Get address and private key
  const address = keypair.publicKey.toBase58();
  const privateKey = Buffer.from(keypair.secretKey).toString('hex');
  return { mnemonic, address, privateKey };
}

// Example usage
generateSolanaWallet().then(console.log);
