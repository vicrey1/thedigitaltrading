import React from 'react';

const HeroSection = () => (
  <section className="relative min-h-[80vh] flex flex-col items-center justify-center text-center bg-transparent overflow-hidden">
    <div className="z-10 backdrop-blur-xl bg-black bg-opacity-60 rounded-3xl p-10 shadow-2xl border border-gold/30 max-w-3xl mx-auto mt-16">
      {/* Logo and Headline */}
      <div className="flex items-center justify-center mb-6">
        <svg width="120" height="40" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <text x="0" y="30" fontFamily="'Playfair Display', serif" fontWeight="bold" fontSize="32" fill="white">LUX</text>
          <text x="60" y="30" fontFamily="'Montserrat', sans-serif" fontWeight="bold" fontSize="32" fill="url(#gold-gradient)">HEDGE</text>
          <defs>
            <linearGradient id="gold-gradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFD700" />
              <stop offset="100%" stopColor="#BFA14A" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-white font-serif">Digital Asset Strategies for Institutional & Sophisticated Investors</h1>
      <p className="text-lg md:text-2xl mb-8 text-gray-300 max-w-2xl mx-auto">
        LUXHEDGE delivers actively managed crypto investment solutions across spot, derivatives, yield, and structured products.
      </p>
      <div className="flex flex-col md:flex-row gap-4 justify-center">
        <a href="/register" className="px-8 py-3 bg-gold text-black font-bold rounded-lg shadow-lg hover:bg-yellow-400 transition text-lg">Register Now</a>
        <a href="#funds" className="px-8 py-3 bg-black bg-opacity-60 border border-gold text-gold font-bold rounded-lg hover:bg-gold hover:text-black transition text-lg">Explore Our Funds</a>
      </div>
    </div>
    <div className="absolute inset-0 pointer-events-none z-0">
      {/* TODO: Add animated globe, circuit lines, or chart animations */}
    </div>
  </section>
);

export default HeroSection;
