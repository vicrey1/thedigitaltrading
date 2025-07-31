import React from 'react';
import { motion } from 'framer-motion';

const testimonials = [
  {
    name: 'Olivia R.',
    text: 'LUXHEDGE gave me access to strategies I never thought possible. The returns and transparency are unmatched.',
    title: 'Private Investor, London',
  },
  {
    name: 'Michael S.',
    text: 'The onboarding was seamless and the team is always available. I trust LUXHEDGE with my digital assets.',
    title: 'Entrepreneur, Singapore',
  },
  {
    name: 'Sophia L.',
    text: 'The performance dashboard and compliance focus make LUXHEDGE stand out from every other platform.',
    title: 'Family Office, Zurich',
  },
];

export default function TestimonialsSection() {
  const [idx, setIdx] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % testimonials.length), 6000);
    return () => clearInterval(t);
  }, []);
  return (
    <section className="py-20 bg-transparent">
      <h2 className="text-2xl md:text-3xl font-bold mb-8 text-gold text-center font-serif">What Our Investors Say</h2>
      <div className="max-w-2xl mx-auto">
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.7 }}
          className="backdrop-blur-xl bg-black bg-opacity-80 rounded-3xl p-10 shadow-glass border border-gold/20 text-center"
        >
          <blockquote className="text-xl text-white mb-6 font-serif">“{testimonials[idx].text}”</blockquote>
          <div className="text-gold font-bold">{testimonials[idx].name}</div>
          <div className="text-gray-400 text-sm">{testimonials[idx].title}</div>
        </motion.div>
      </div>
    </section>
  );
}
