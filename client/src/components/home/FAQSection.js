import React, { useState } from 'react';

const faqs = [
  {
    q: 'How do you measure campaign success?',
    a: 'We use comprehensive analytics to track key performance indicators including engagement rates, conversion metrics, and long-term business growth. Our reporting provides clear insights into campaign effectiveness and strategic recommendations.'
  },
  {
    q: 'What makes your approach different?',
    a: 'Our strategic methodology combines data-driven insights with innovative technology solutions. We focus on sustainable growth through comprehensive market analysis, competitive intelligence, and customized digital strategies tailored to your business objectives.'
  },
  {
    q: 'What investment level do you recommend?',
    a: 'We work with businesses ready to make strategic investments in their digital presence. Our recommendations are based on your specific goals, market position, and growth objectives to ensure optimal resource allocation.'
  },
  {
    q: 'Do you work across different industries?',
    a: 'Yes, our strategic framework adapts to various industries and business models. We have experience across technology, professional services, e-commerce, and other sectors, applying industry-specific insights to drive results.'
  },
];

export default function FAQSection() {
  const [open, setOpen] = useState(null);
  return (
    <section className="py-20 bg-transparent">
      <h2 className="text-2xl md:text-3xl font-bold mb-8 text-gold text-center font-serif">Frequently Asked Questions</h2>
      <div className="max-w-2xl mx-auto divide-y divide-gold/10 bg-black bg-opacity-70 rounded-2xl shadow-glass">
        {faqs.map((f, i) => (
          <div key={i} className="py-4 px-6 cursor-pointer" onClick={() => setOpen(open === i ? null : i)}>
            <div className="flex justify-between items-center text-lg text-white font-serif">
              <span>{f.q}</span>
              <span className="text-gold text-xl">{open === i ? '-' : '+'}</span>
            </div>
            {open === i && <div className="mt-2 text-gray-300 text-base font-sans">{f.a}</div>}
          </div>
        ))}
      </div>
    </section>
  );
}
