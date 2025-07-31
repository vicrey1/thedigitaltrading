import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const FinalCTASection = () => {
  const [confetti, setConfetti] = useState(false);
  const handleClick = () => {
    setConfetti(true);
    setTimeout(() => setConfetti(false), 1200);
  };
  return (
    <section className="py-20 bg-transparent">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        viewport={{ once: true }}
        className="max-w-2xl mx-auto backdrop-blur-xl bg-black bg-opacity-60 rounded-3xl p-10 shadow-glass border border-gold/30 text-center relative"
      >
        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gold font-serif">Join thousands of investors growing with LUXHEDGE.</h2>
        <div className="flex flex-col md:flex-row gap-4 justify-center mb-4">
          <Link
            to="/register"
            className="px-8 py-3 bg-gold text-black font-bold rounded-lg shadow-lg hover:bg-yellow-400 transition text-lg focus:ring-4 focus:ring-gold/40 focus:outline-none animate-pulse hover:animate-none"
            onClick={handleClick}
          >
            Open Your Account
          </Link>
          <Link
            to="/funds"
            className="px-8 py-3 bg-black bg-opacity-60 border border-gold text-gold font-bold rounded-lg hover:bg-gold hover:text-black transition text-lg focus:ring-4 focus:ring-gold/40 focus:outline-none"
          >
            View Investment Plans
          </Link>
        </div>
        {/* Confetti effect */}
        <AnimatePresence>
          {confetti && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
            >
              <span className="text-6xl select-none" role="img" aria-label="confetti">🎉</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      {/* Sticky CTA bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-xl w-full px-4">
        <div className="backdrop-blur-xl bg-black bg-opacity-70 border border-gold/30 rounded-2xl shadow-glass flex items-center justify-between px-6 py-4">
          <span className="text-gold font-bold text-lg font-serif">Ready to elevate your portfolio?</span>
          <Link
            to="/register"
            className="ml-4 px-6 py-2 bg-gold text-black font-bold rounded-lg shadow-lg hover:bg-yellow-400 transition text-lg focus:ring-4 focus:ring-gold/40 focus:outline-none animate-pulse hover:animate-none"
            onClick={handleClick}
          >
            Get Started
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FinalCTASection;
