import React from 'react';

const InvestmentFundsShowcase = () => (
  <section id="funds" className="py-20 bg-transparent text-white">
    <h2 className="text-3xl md:text-4xl font-bold mb-8 text-gold text-center">Our Investment Solutions</h2>
    <div className="flex flex-wrap justify-center gap-8">
      {/* Example Fund Card */}
      <div className="backdrop-blur-xl bg-black bg-opacity-60 rounded-3xl p-6 w-80 shadow-2xl border border-gold/30 hover:scale-105 transition-transform">
        <h3 className="text-xl font-bold mb-2">Synthetic Asset Fund</h3>
        <div className="text-gold mb-1">Tokenized Commodities + FX Pairs</div>
        <div className="mb-2 text-green-400">12% – 18% Annually</div>
        <div className="mb-2 text-gray-400">Min. Investment: $10,000</div>
        <div className="mb-4">
          <span className="inline-block px-3 py-1 rounded-full bg-yellow-900 text-yellow-400 text-xs">Moderate Risk</span>
        </div>
        <button className="block w-full py-2 bg-gold text-black font-bold rounded-lg hover:bg-yellow-400 transition">View Details</button>
      </div>
      {/* Add more fund cards or a carousel here */}
    </div>
    {/* Optional: Tabs for strategy/risk/liquidity */}
  </section>
);

export default InvestmentFundsShowcase;
