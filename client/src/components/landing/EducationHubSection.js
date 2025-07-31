import React from 'react';

const EducationHubSection = () => (
  <section className="py-20 bg-transparent text-white">
    <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
      {/* Example Article */}
      <div className="backdrop-blur-xl bg-black bg-opacity-60 rounded-3xl p-6 shadow-2xl border border-gold/30 flex flex-col">
        <h3 className="text-lg font-bold mb-2">Macro Trends in Digital Assets</h3>
        <p className="text-gray-300 mb-4">Explore the latest macroeconomic factors shaping the crypto markets in 2025.</p>
        <button className="text-gold underline hover:text-yellow-400">Read Report</button>
      </div>
      <div className="backdrop-blur-xl bg-black bg-opacity-60 rounded-3xl p-6 shadow-2xl border border-gold/30 flex flex-col">
        <h3 className="text-lg font-bold mb-2">AI-Driven Trading Strategies</h3>
        <p className="text-gray-300 mb-4">How artificial intelligence is transforming fund management and risk control.</p>
        <button className="text-gold underline hover:text-yellow-400">Download Whitepaper</button>
      </div>
      <div className="backdrop-blur-xl bg-black bg-opacity-60 rounded-3xl p-6 shadow-2xl border border-gold/30 flex flex-col">
        <h3 className="text-lg font-bold mb-2">Regulatory Updates</h3>
        <p className="text-gray-300 mb-4">Stay ahead of the latest compliance and regulatory changes in digital assets.</p>
        <button className="text-gold underline hover:text-yellow-400">View Fact Sheet</button>
      </div>
    </div>
    <div className="text-center text-gray-400">Download our latest research papers and fund fact sheets for deeper insights.</div>
  </section>
);

export default EducationHubSection;
