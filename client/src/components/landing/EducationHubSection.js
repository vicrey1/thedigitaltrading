import React from 'react';

const EducationHubSection = () => (
  <section className="py-20 bg-transparent text-white">
    <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
      {/* Example Article */}
      <div className="backdrop-blur-xl bg-black bg-opacity-60 rounded-3xl p-6 shadow-2xl border border-gold/30 flex flex-col">
        <h3 className="text-lg font-bold mb-2">Digital Asset Market Outlook 2025</h3>
        <p className="text-gray-300 mb-4">Explore macro trends, on-chain signals, and regulatory developments shaping digital asset markets in 2025.</p>
        <button className="text-gold underline hover:text-yellow-400">Read Report</button>
      </div>
      <div className="backdrop-blur-xl bg-black bg-opacity-60 rounded-3xl p-6 shadow-2xl border border-gold/30 flex flex-col">
        <h3 className="text-lg font-bold mb-2">AI-Assisted Research & Automation</h3>
        <p className="text-gray-300 mb-4">Master measuring and managing portfolio performance and risk with clear frameworks and practical tools.</p>
        <button className="text-gold underline hover:text-yellow-400">Download Whitepaper</button>
      </div>
      <div className="backdrop-blur-xl bg-black bg-opacity-60 rounded-3xl p-6 shadow-2xl border border-gold/30 flex flex-col">
        <h3 className="text-lg font-bold mb-2">Performance Analytics Guide</h3>
        <p className="text-gray-300 mb-4">Master the art of measuring and interpreting performance outcomes using clear, repeatable methods.</p>
        <button className="text-gold underline hover:text-yellow-400">View Guide</button>
      </div>
    </div>
    <div className="text-center text-gray-400">Download our latest research notes and methodology briefs for deeper insight.</div>
  </section>
);

export default EducationHubSection;
