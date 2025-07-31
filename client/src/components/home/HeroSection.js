import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const HeroSection = () => {
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const sectionRef = useRef();

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 30;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 30;
      setParallax({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section ref={sectionRef} className="relative min-h-[90vh] flex flex-col items-center justify-center text-center bg-transparent overflow-hidden select-none">
      {/* Cinematic video background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
        style={{ filter: 'brightness(0.35) blur(1px)' }}
      >
        <source src="/luxhedge-cinematic-bg.mp4" type="video/mp4" />
      </video>
      {/* Parallax black glass overlay */}
      <div
        aria-hidden
        style={{
          background: 'linear-gradient(120deg, #18181b 60%, #23232a 100%)',
          opacity: 0.7,
          filter: 'blur(60px)',
          transform: `translate(${parallax.x}px, ${parallax.y}px) scale(1.1)`,
        }}
        className="absolute inset-0 z-0 pointer-events-none transition-transform duration-300"
      />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="z-10 backdrop-blur-2xl bg-gradient-to-br from-black/90 via-gray-900/80 to-black/80 rounded-3xl p-12 md:p-16 shadow-2xl border border-gold/20 max-w-3xl mx-auto mt-24 flex flex-col items-center"
      >
        <h1 className="text-5xl md:text-6xl font-extrabold mb-6 text-white font-serif drop-shadow-xl tracking-tight">
          Elevate Your Wealth
        </h1>
        <p className="text-xl md:text-2xl mb-10 text-gray-200 max-w-2xl mx-auto font-sans leading-relaxed">
          The most advanced, secure, and transparent crypto asset management platform for high-net-worth and institutional investors.
        </p>
        <div className="flex flex-col md:flex-row gap-6 justify-center mb-10">
          <Link to="/register" className="px-10 py-4 bg-gold text-black font-bold rounded-xl shadow-xl hover:bg-yellow-400 transition text-xl focus:ring-4 focus:ring-gold/40 focus:outline-none">
            Start Investing
          </Link>
          <Link to="#funds" className="px-10 py-4 bg-black bg-opacity-70 border border-gold text-gold font-bold rounded-xl hover:bg-gold hover:text-black transition text-xl focus:ring-4 focus:ring-gold/40 focus:outline-none">
            Explore Funds
          </Link>
        </div>
        {/* Trust Badges & Compliance */}
        <div className="flex flex-wrap justify-center gap-8 mb-6">
          <div className="flex items-center gap-2 bg-gray-900 bg-opacity-70 px-5 py-3 rounded-lg border border-gold/10">
            <img src="/iso-certified.svg" alt="ISO Certified" className="h-7" />
            <span className="text-sm text-gray-200">ISO 27001 Certified</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-900 bg-opacity-70 px-5 py-3 rounded-lg border border-gold/10">
            <img src="/regulated.svg" alt="Regulated" className="h-7" />
            <span className="text-sm text-gray-200">Regulated Entity</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-900 bg-opacity-70 px-5 py-3 rounded-lg border border-gold/10">
            <img src="/audited.svg" alt="Audited" className="h-7" />
            <span className="text-sm text-gray-200">Security Audited</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-900 bg-opacity-70 px-5 py-3 rounded-lg border border-gold/10">
            <img src="/insurance.svg" alt="Insured" className="h-7" />
            <span className="text-sm text-gray-200">Insured Custody</span>
          </div>
        </div>
        {/* Featured In */}
        <div className="flex flex-wrap justify-center gap-8 mb-2 opacity-90">
          <img src="/press-bloomberg.svg" alt="Bloomberg" className="h-7" />
          <img src="/press-coindesk.svg" alt="Coindesk" className="h-7" />
          <img src="/press-reuters.svg" alt="Reuters" className="h-7" />
          <img src="/press-cnbc.svg" alt="CNBC" className="h-7" />
        </div>
        <div className="mt-10 text-gray-400 text-base flex flex-col items-center">
          <span className="mb-2">Trusted by 10,000+ investors</span>
          {/* Animated scroll indicator */}
          <span className="animate-bounce text-gold text-3xl mt-2">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
              <path d="M12 5v14M19 12l-7 7-7-7" />
            </svg>
          </span>
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
