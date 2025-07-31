import React from 'react';

const WhyChooseSection = () => (
  <section className="py-20 bg-transparent text-white">
    <h2 className="text-3xl md:text-4xl font-bold mb-8 text-gold text-center">Why Choose LUXHEDGE?</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
      <div className="backdrop-blur-xl bg-black bg-opacity-60 rounded-3xl p-6 shadow-2xl border border-gold/30 flex flex-col items-center">
        <span className="text-3xl mb-2">📊</span>
        <span className="font-semibold mb-1">Multi-Strategy Allocation</span>
        <span className="text-gray-400 text-sm">Diversified exposure across spot, derivatives, and yield products.</span>
      </div>
      <div className="backdrop-blur-xl bg-black bg-opacity-60 rounded-3xl p-6 shadow-2xl border border-gold/30 flex flex-col items-center">
        <span className="text-3xl mb-2">🧠</span>
        <span className="font-semibold mb-1">Proprietary Trading Algorithms</span>
        <span className="text-gray-400 text-sm">AI-driven models for alpha generation and risk control.</span>
      </div>
      <div className="backdrop-blur-xl bg-black bg-opacity-60 rounded-3xl p-6 shadow-2xl border border-gold/30 flex flex-col items-center">
        <span className="text-3xl mb-2">📁</span>
        <span className="font-semibold mb-1">Full Regulatory Compliance</span>
        <span className="text-gray-400 text-sm">Licensed, regulated, and audited for institutional trust.</span>
      </div>
      <div className="backdrop-blur-xl bg-black bg-opacity-60 rounded-3xl p-6 shadow-2xl border border-gold/30 flex flex-col items-center">
        <span className="text-3xl mb-2">🌍</span>
        <span className="font-semibold mb-1">Global Investor Access</span>
        <span className="text-gray-400 text-sm">Serving clients across Europe, Asia, and the Middle East.</span>
      </div>
      <div className="backdrop-blur-xl bg-black bg-opacity-60 rounded-3xl p-6 shadow-2xl border border-gold/30 flex flex-col items-center">
        <span className="text-3xl mb-2">💰</span>
        <span className="font-semibold mb-1">Transparent Fee Structure</span>
        <span className="text-gray-400 text-sm">No hidden fees. Clear, performance-based pricing.</span>
      </div>
      <div className="backdrop-blur-xl bg-black bg-opacity-60 rounded-3xl p-6 shadow-2xl border border-gold/30 flex flex-col items-center">
        <span className="text-3xl mb-2">📄</span>
        <span className="font-semibold mb-1">Quarterly Fund Reports</span>
        <span className="text-gray-400 text-sm">Detailed performance and risk reporting for all investors.</span>
      </div>
    </div>
  </section>
);

export default WhyChooseSection;
