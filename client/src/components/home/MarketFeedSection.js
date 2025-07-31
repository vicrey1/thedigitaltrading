import React from 'react';

const feed = [
  { icon: '₿', text: 'BTC Fund returned +8.2% last month', color: '#F7931A' },
  { icon: 'Ξ', text: 'ETH Vault rebalanced for optimal exposure', color: '#627EEA' },
  { icon: '🤖', text: 'AI Grid Strategy hit new all-time high', color: '#FFD700' },
  { icon: '🧑‍💼', text: 'Sarah from Singapore deposited $12,000', color: '#B8860B' },
  { icon: '🧠', text: 'DAO Seed Accelerator closed new round', color: '#FFD700' },
];

const MarketFeedSection = () => (
  <section className="py-8 bg-transparent">
    <div className="flex items-center gap-4 px-4 mb-2">
      <span className="bg-gold rounded-full w-3 h-3 animate-pulse inline-block mr-2 shadow-gold" />
      <span className="uppercase text-gold font-bold tracking-widest text-xs">Live Market Feed</span>
    </div>
    <div className="overflow-x-auto whitespace-nowrap max-w-full relative">
      <div className="inline-flex gap-12 animate-marquee text-lg font-mono px-4 items-center">
        {feed.map((item, i) => (
          <span key={i} className="flex items-center gap-3 bg-black bg-opacity-80 rounded-xl px-5 py-2 shadow-glass border border-gold/10 hover:border-gold transition-all">
            <span className="text-2xl" style={{ color: item.color }}>{item.icon}</span>
            <span className="text-white/90">{item.text}</span>
            {/* Sparkline placeholder */}
            <svg width="48" height="16" viewBox="0 0 48 16" fill="none" className="ml-2">
              <polyline points="0,12 8,6 16,10 24,4 32,8 40,6 48,12" stroke="#FFD700" strokeWidth="2" fill="none" strokeLinejoin="round" />
            </svg>
          </span>
        ))}
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 28s linear infinite;
        }
      `}</style>
    </div>
  </section>
);

export default MarketFeedSection;
