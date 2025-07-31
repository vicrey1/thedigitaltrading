import React, { useEffect, useState } from 'react';

const events = [
  'James from London joined LUXHEDGE',
  'Maria invested $25,000 in ETH & BTC Basket',
  'Wei from Singapore withdrew profits',
  'Family Office Zurich increased allocation',
  'DAO Seed Accelerator hit new milestone',
];

export default function SocialProofTicker() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % events.length), 3500);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="w-full bg-black bg-opacity-70 border-b border-gold/10 text-gold flex items-center px-6 py-2 text-sm font-mono overflow-x-auto animate-fade-in">
      <span className="mr-3 text-gold/80">★</span>
      <span>{events[idx]}</span>
    </div>
  );
}
