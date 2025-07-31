import React from 'react';

const GetStartedSection = () => (
  <section className="py-20 bg-transparent text-white text-center">
    <div className="backdrop-blur-xl bg-black bg-opacity-60 rounded-3xl p-10 shadow-2xl border border-gold/30 max-w-3xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gold">Begin Your Digital Asset Journey</h2>
      <p className="text-lg mb-8 text-gray-300">Access exclusive crypto investment opportunities tailored for sophisticated portfolios.</p>
      <div className="flex flex-col md:flex-row gap-4 justify-center mb-4">
        <a href="/register" className="px-8 py-3 bg-gold text-black font-bold rounded-lg shadow-lg hover:bg-yellow-400 transition text-lg">Create Your Investor Account</a>
        <a href="#contact" className="px-8 py-3 bg-black bg-opacity-60 border border-gold text-gold font-bold rounded-lg hover:bg-gold hover:text-black transition text-lg">Request Fund Access</a>
      </div>
      <div className="text-gray-400 mt-4">Limited capacity available. <a href="#contact" className="text-gold underline hover:text-yellow-400">Contact us for institutional onboarding</a>.</div>
    </div>
  </section>
);

export default GetStartedSection;
