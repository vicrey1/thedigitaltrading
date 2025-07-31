import React from 'react';

const FundHighlights = () => (
  <section className="py-20 bg-transparent text-white">
    <div className="max-w-5xl mx-auto">
      <h2 className="text-2xl md:text-3xl font-bold mb-8 text-gold text-center">Fund Highlights</h2>
      <div className="backdrop-blur-xl bg-black bg-opacity-60 rounded-3xl p-8 shadow-2xl border border-gold/30">
        {/* Placeholder for interactive charts and metrics */}
        <div className="mb-6">
          <span className="font-semibold">Performance Graph</span>
          <div className="h-48 bg-gray-800 rounded-lg mt-2 flex items-center justify-center text-gray-500">
            [Chart Placeholder]
          </div>
        </div>
        <div className="flex flex-wrap gap-8 justify-center">
          <div>
            <div className="text-sm text-gray-400">Sharpe Ratio</div>
            <div className="text-xl font-mono">1.42</div>
          </div>
          <div>
            <div className="text-sm text-gray-400">Max Drawdown</div>
            <div className="text-xl font-mono">-8.3%</div>
          </div>
          <div>
            <div className="text-sm text-gray-400">Cumulative Returns</div>
            <div className="text-xl font-mono">+62.5%</div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default FundHighlights;
