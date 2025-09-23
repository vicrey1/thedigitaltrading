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
        <source src="https://videos.pexels.com/video-files/3130284/3130284-uhd_2560_1440_30fps.mp4" type="video/mp4" />
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
        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 text-white font-serif leading-tight">
          Elevate Your Digital Presence with
          <span className="text-gold block mt-2">Institutional-Grade Digital Asset Management</span>
        </h1>
        <p className="text-lg md:text-xl mb-8 text-gray-300 max-w-2xl mx-auto leading-relaxed">
          We partner with institutions and qualified investors to implement disciplined, risk-managed digital asset strategies. We focus on process, governance, and transparency—no hype, no promises of returns.
        </p>
        <div className="flex flex-col md:flex-row gap-6 justify-center mb-10">
          <Link to="/contact" className="px-10 py-4 bg-gold text-black font-bold rounded-xl shadow-xl hover:bg-yellow-400 transition text-xl focus:ring-4 focus:ring-gold/40 focus:outline-none">
            Schedule a Consultation
          </Link>
          <Link to="#services" className="px-10 py-4 bg-black bg-opacity-70 border border-gold text-gold font-bold rounded-xl hover:bg-gold hover:text-black transition text-xl focus:ring-4 focus:ring-gold/40 focus:outline-none">
            Explore Our Services
          </Link>
        </div>
        {/* Trust Badges & Certifications */}
        <div className="flex flex-wrap justify-center gap-8 mb-6">
          <div className="flex items-center gap-2 bg-gray-900 bg-opacity-70 px-5 py-3 rounded-lg border border-gold/10">
            <span className="text-sm text-gray-200">Google Partner</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-900 bg-opacity-70 px-5 py-3 rounded-lg border border-gold/10">
            <span className="text-sm text-gray-200">Meta Business Partner</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-900 bg-opacity-70 px-5 py-3 rounded-lg border border-gold/10">
            <span className="text-sm text-gray-200">HubSpot Certified</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-900 bg-opacity-70 px-5 py-3 rounded-lg border border-gold/10">
            <span className="text-sm text-gray-200">Award Winning</span>
          </div>
        </div>
        {/* Featured In */}
        <div className="flex flex-wrap justify-center gap-8 mb-2 opacity-90">
          <span className="text-gray-400 text-sm">TechCrunch</span>
          <span className="text-gray-400 text-sm">Forbes</span>
          <span className="text-gray-400 text-sm">Entrepreneur</span>
          <span className="text-gray-400 text-sm">Marketing Land</span>
        </div>
        <div className="mt-10 text-gray-400 text-base flex flex-col items-center">
          <span className="mb-2">Trusted by leading brands worldwide</span>
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
