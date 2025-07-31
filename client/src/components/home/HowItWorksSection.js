import React from 'react';
import { motion } from 'framer-motion';

const steps = [
  {
    icon: '🔍',
    title: '1. Discover',
    desc: 'Browse our curated funds and strategies, each with transparent performance and risk metrics.'
  },
  {
    icon: '📝',
    title: '2. Register & Verify',
    desc: 'Create your account, complete KYC, and set up secure 2FA for maximum protection.'
  },
  {
    icon: '💸',
    title: '3. Invest',
    desc: 'Deposit funds and allocate to your chosen strategies with a few clicks.'
  },
  {
    icon: '📈',
    title: '4. Track & Grow',
    desc: 'Monitor your portfolio in real time, withdraw profits, and access advanced analytics.'
  }
];

const HowItWorksSection = () => (
  <section className="py-20 bg-transparent">
    <div className="max-w-5xl mx-auto text-center mb-12">
      <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-white font-serif">How It Works</h2>
      <p className="text-lg text-gray-400 max-w-2xl mx-auto">
        Investing with LUXHEDGE is simple, secure, and transparent. Here’s how you get started:
      </p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
      {steps.map((step, i) => (
        <motion.div
          key={step.title}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.15, duration: 0.7 }}
          viewport={{ once: true }}
          className="bg-black bg-opacity-80 rounded-3xl p-8 shadow-glass border border-gold/20 flex flex-col items-center text-center"
        >
          <span className="text-4xl mb-4 text-gold drop-shadow-[0_0_8px_black]">{step.icon}</span>
          <h3 className="text-xl font-bold text-gold mb-2">{step.title}</h3>
          <p className="text-gray-300 text-sm">{step.desc}</p>
        </motion.div>
      ))}
    </div>
  </section>
);

export default HowItWorksSection;
