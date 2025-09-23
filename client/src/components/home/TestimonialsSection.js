import React from 'react';
import { motion } from 'framer-motion';

const testimonials = [
  {
    text: "THE DIGITAL MARKETING transformed our digital strategy with a comprehensive approach that delivered sustainable growth. Their strategic insights and technology integration significantly enhanced our market position.",
    name: "Sarah Johnson",
    title: "CEO, TechStart Inc."
  },
  {
    text: "Their data-driven methodology and professional expertise helped us achieve our business objectives efficiently. The strategic partnership approach made all the difference in our digital transformation.",
    name: "Michael Chen",
    title: "Founder, GrowthLab"
  },
  {
    text: "Working with THE DIGITAL MARKETING has been exceptional. Their innovative solutions and strategic guidance have consistently exceeded our expectations and delivered measurable results.",
    name: "Emily Rodriguez",
    title: "Marketing Director, InnovateCorp"
  }
];

export default function TestimonialsSection() {
  const [idx, setIdx] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % testimonials.length), 6000);
    return () => clearInterval(t);
  }, []);
  return (
    <section className="py-20 bg-transparent">
      <h2 className="text-2xl md:text-3xl font-bold mb-8 text-gold text-center font-serif">What Our Clients Say</h2>
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
