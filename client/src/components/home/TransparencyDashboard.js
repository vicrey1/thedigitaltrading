import React from 'react';

const stats = [
  { label: 'Total AUM', value: '$2.3B' },
  { label: 'Active Investors', value: '12,482' },
  { label: 'Funds Available', value: '4' },
  { label: 'Avg. 12mo ROI', value: '+8.6%' },
  { label: 'Withdrawals Processed', value: '3,200+' },
];

export default function TransparencyDashboard() {
  return (
    <section className="py-20 bg-transparent">
      <h2 className="text-2xl md:text-3xl font-bold mb-8 text-gold text-center font-serif">Transparency Dashboard</h2>
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-8 bg-black bg-opacity-80 rounded-2xl shadow-glass border border-gold/20 p-8 text-center">
        {stats.map(s => (
          <div key={s.label} className="flex flex-col items-center">
            <span className="text-gold text-2xl font-bold mb-1">{s.value}</span>
            <span className="text-gray-300 text-xs font-sans">{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
