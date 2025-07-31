import React, { useState } from 'react';

const faqs = [
  {
    q: 'Is LUXHEDGE regulated?',
    a: 'Yes, LUXHEDGE operates under strict regulatory compliance and partners with regulated custodians.'
  },
  {
    q: 'How secure are my assets?',
    a: 'All assets are held in institutional-grade, multi-signature wallets with 256-bit SSL encryption.'
  },
  {
    q: 'What is the minimum investment?',
    a: 'The minimum investment is $5,000, designed for serious investors.'
  },
  {
    q: 'Can I withdraw at any time?',
    a: 'Withdrawals are processed weekly, subject to compliance checks.'
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
