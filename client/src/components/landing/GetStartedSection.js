import React from 'react';

const GetStartedSection = () => (
  <section className="py-20 bg-transparent text-white text-center">
    <div className="backdrop-blur-xl bg-black bg-opacity-60 rounded-3xl p-10 shadow-2xl border border-gold/30 max-w-3xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gold">Build with Institutional Discipline</h2>
      <p className="text-lg mb-8 text-gray-300">Partner with research-driven practitioners to develop, monitor, and refine digital asset strategies with transparent reporting and risk-first processes.</p>
      <div className="flex flex-col md:flex-row gap-4 justify-center mb-4">
        <a href="/register" className="px-8 py-3 bg-gold text-black font-bold rounded-lg shadow-lg hover:bg-yellow-400 transition text-lg">Schedule Consultation</a>
        <a href="#contact" className="px-8 py-3 bg-black bg-opacity-60 border border-gold text-gold font-bold rounded-lg hover:bg-gold hover:text-black transition text-lg">Explore Our Services</a>
      </div>
      <div className="text-gray-400 mt-4">Tailored solutions for every business. <a href="#contact" className="text-gold underline hover:text-yellow-400">Contact us for strategic partnership opportunities</a>.</div>
    </div>
  </section>
);

export default GetStartedSection;
