import React from 'react';
import { motion } from 'framer-motion';

const MobileAppPreviewSection = () => (
  <section className="py-20 bg-transparent">
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      viewport={{ once: true }}
      className="flex flex-col md:flex-row items-center justify-center gap-12 max-w-5xl mx-auto"
    >
      <div className="relative w-64 h-[480px] bg-gradient-to-br from-gray-900 via-black to-gold/10 rounded-3xl shadow-2xl border-2 border-gold/30 flex items-center justify-center overflow-hidden">
        {/* Phone mockup */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-56 h-[440px] bg-black bg-opacity-80 rounded-2xl border border-gold/20 flex flex-col items-center justify-center p-6">
          <div className="text-gold text-lg font-bold mb-2">Portfolio Value</div>
          <div className="text-3xl font-mono text-white mb-4">$128,400</div>
          <div className="w-full h-32 bg-gray-800 bg-opacity-60 rounded-lg mb-4 flex items-center justify-center text-gray-400">[Chart]</div>
          <div className="flex flex-col gap-2 w-full">
            <div className="flex justify-between text-sm text-white"><span>BTC Fund</span><span>+8.2%</span></div>
            <div className="flex justify-between text-sm text-white"><span>ETH Vault</span><span>+6.7%</span></div>
            <div className="flex justify-between text-sm text-white"><span>AI Grid</span><span>+12.1%</span></div>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center md:items-start">
        <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gold font-serif">Track your performance anywhere</h2>
        <p className="text-gray-300 mb-6 max-w-md text-center md:text-left">The LUXHEDGE mobile app puts your portfolio, performance, and fund analytics at your fingertips. Coming soon for iOS and Android.</p>
        <div className="flex gap-4">
          <button className="px-6 py-2 bg-gold text-black font-bold rounded-lg shadow-lg opacity-70 cursor-not-allowed">App Store</button>
          <button className="px-6 py-2 bg-gold text-black font-bold rounded-lg shadow-lg opacity-70 cursor-not-allowed">Google Play</button>
        </div>
      </div>
    </motion.div>
  </section>
);

export default MobileAppPreviewSection;
