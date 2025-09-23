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
    <section className="py-12 sm:py-20 bg-transparent px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        viewport={{ once: true }}
        className="max-w-2xl mx-auto backdrop-blur-xl bg-black bg-opacity-60 rounded-3xl p-6 sm:p-10 shadow-glass border border-gold/30 text-center relative w-full"
      >
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-gold font-serif leading-tight">Ready to Transform Your Digital Strategy?</h2>
        <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed">
          Join leading businesses who have elevated their digital presence with our strategic marketing expertise. Let's build your competitive advantage together.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-4 w-full max-w-lg mx-auto">
          <Link
            to="/register"
            className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-gold text-black font-bold rounded-lg shadow-lg hover:bg-yellow-400 transition text-base sm:text-lg focus:ring-4 focus:ring-gold/40 focus:outline-none min-h-[44px] flex items-center justify-center"
            onClick={handleClick}
          >
            Schedule Strategic Consultation
          </Link>
          <Link
            to="/funds"
            className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-black bg-opacity-60 border border-gold text-gold font-bold rounded-lg hover:bg-gold hover:text-black transition text-base sm:text-lg focus:ring-4 focus:ring-gold/40 focus:outline-none min-h-[44px] flex items-center justify-center"
          >
            Explore Our Services
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
      <div className="fixed bottom-4 sm:bottom-6 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 z-40 sm:max-w-xl sm:w-full">
        <div className="backdrop-blur-xl bg-black bg-opacity-70 border border-gold/30 rounded-2xl shadow-glass flex flex-col sm:flex-row items-center gap-3 sm:gap-0 sm:justify-between px-4 sm:px-6 py-3 sm:py-4">
          <span className="text-gold font-bold text-base sm:text-lg font-serif text-center sm:text-left">Ready to transform your digital strategy?</span>
          <Link
            to="/register"
            className="w-full sm:w-auto sm:ml-4 px-4 sm:px-6 py-2 bg-gold text-black font-bold rounded-lg shadow-lg hover:bg-yellow-400 transition text-base sm:text-lg focus:ring-4 focus:ring-gold/40 focus:outline-none min-h-[44px] flex items-center justify-center"
            onClick={handleClick}
          >
            Schedule Consultation
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FinalCTASection;
