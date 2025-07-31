import React, { useEffect, useState } from 'react';
import axios from 'axios';

const COINS = [
  { id: 'bitcoin', symbol: 'BTC' },
  { id: 'ethereum', symbol: 'ETH' },
  { id: 'tether', symbol: 'USDT' },
  { id: 'binancecoin', symbol: 'BNB' },
  { id: 'solana', symbol: 'SOL' }
];

export default function CryptoPriceWidget({ portfolioUSD = 0 }) {
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPrices() {
      setLoading(true);
      try {
        const ids = COINS.map(c => c.id).join(',');
        const res = await axios.get(
          `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`
        );
        setPrices(res.data);
      } catch {
        setPrices({});
      }
      setLoading(false);
    }
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-card p-6 rounded-xl mb-6 shadow-lg">
      <h3 className="font-bold text-lg mb-4">Live Crypto Prices</h3>
      {loading ? <div>Loading...</div> : (
        <div className="flex flex-wrap gap-6">
          {COINS.map(coin => (
            <div key={coin.id} className="flex flex-col items-center">
              <span className="font-semibold">{coin.symbol}</span>
              <span className="text-green-400 text-xl">${prices[coin.id]?.usd?.toLocaleString() || 'N/A'}</span>
            </div>
          ))}
        </div>
      )}
      {portfolioUSD > 0 && prices['bitcoin'] && (
        <div className="mt-6">
          <div className="font-semibold">Your Portfolio Value</div>
          <div className="flex gap-4 mt-2">
            <span>${portfolioUSD.toLocaleString()} USD</span>
            <span>|
              {(portfolioUSD / prices['bitcoin'].usd).toFixed(6)} BTC
            </span>
            <span>|
              {(portfolioUSD / prices['ethereum'].usd).toFixed(6)} ETH
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
