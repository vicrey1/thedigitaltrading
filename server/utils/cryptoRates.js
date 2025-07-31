const axios = require('axios');

async function getCryptoUSDPrices() {
  try {
    // Use CoinGecko public API for BTC, ETH, BNB, USDT
    const res = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin,tether&vs_currencies=usd'
    );
    return {
      BTC: res.data.bitcoin.usd,
      ETH: res.data.ethereum.usd,
      BNB: res.data.binancecoin.usd,
      USDT: res.data.tether.usd,
    };
  } catch (err) {
    // Fallback to static values if API fails
    return {
      BTC: 60000,
      ETH: 3500,
      BNB: 400,
      USDT: 1,
    };
  }
}

module.exports = { getCryptoUSDPrices };
