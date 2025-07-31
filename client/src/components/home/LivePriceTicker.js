import React, { useEffect, useState } from 'react';

const coins = [
  { symbol: 'BTC', name: 'Bitcoin', color: '#F7931A' },
  { symbol: 'ETH', name: 'Ethereum', color: '#627EEA' },
  { symbol: 'SOL', name: 'Solana', color: '#00FFA3' },
  { symbol: 'USDT', name: 'Tether', color: '#26A17B' },
];

export default function LivePriceTicker() {
  const [prices, setPrices] = useState({});
  useEffect(() => {
    async function fetchPrices() {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,tether&vs_currencies=usd');
        const data = await res.json();
        setPrices({
          BTC: data.bitcoin.usd,
          ETH: data.ethereum.usd,
          SOL: data.solana.usd,
          USDT: data.tether.usd,
        });
      } catch {}
    }
    fetchPrices();
    const interval = setInterval(fetchPrices, 15000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="w-full bg-black bg-opacity-80 border-b border-gold/20 text-gold flex items-center gap-8 px-6 py-2 text-sm font-mono overflow-x-auto animate-fade-in">
      {coins.map(c => (
        <span key={c.symbol} className="flex items-center gap-2 min-w-[90px]">
          <span style={{ color: c.color, fontWeight: 700 }}>{c.symbol}</span>
          <span className="text-white">${prices[c.symbol]?.toLocaleString() || '--'}</span>
        </span>
      ))}
    </div>
  );
}
