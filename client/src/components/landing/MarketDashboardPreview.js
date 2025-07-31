import React from 'react';

const MarketDashboardPreview = () => (
  <section className="py-16 bg-transparent text-white">
    <div className="max-w-5xl mx-auto">
      <h2 className="text-2xl md:text-3xl font-bold mb-8 text-gold text-center">Market Dashboard Preview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Market Overview Panel */}
        <div className="backdrop-blur-xl bg-black bg-opacity-60 rounded-3xl p-6 shadow-2xl border border-gold/30 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-lg">BTC/ETH</span>
            <span className="text-2xl font-mono">$-- / $--</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Global Market Cap</span>
            <span className="font-mono">$--</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Top Performing Asset</span>
            <span className="font-mono">--</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Volatility Index</span>
            <span className="font-mono">--</span>
          </div>
        </div>
        {/* Fund Performance Snapshot */}
        <div className="backdrop-blur-xl bg-black bg-opacity-60 rounded-3xl p-6 shadow-2xl border border-gold/30 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <span className="font-semibold">AUM</span>
            <span className="text-xl font-mono">$504M</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Active Funds</span>
            <span className="font-mono">12</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Avg. Annual Return (YTD)</span>
            <span className="font-mono text-green-400">+18.6%</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Top Fund</span>
            <span className="font-mono text-gold">AI Arbitrage Fund (+27.3%)</span>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default MarketDashboardPreview;
