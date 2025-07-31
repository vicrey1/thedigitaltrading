import React from 'react';

const audits = [
  { name: 'CertiK', url: '#', year: 2025 },
  { name: 'Quantstamp', url: '#', year: 2024 },
];

export default function SecurityAuditSection() {
  return (
    <section className="py-20 bg-transparent">
      <h2 className="text-2xl md:text-3xl font-bold mb-8 text-gold text-center font-serif">Security Audits & Transparency</h2>
      <div className="max-w-2xl mx-auto bg-black bg-opacity-80 rounded-2xl shadow-glass border border-gold/20 p-8 text-center">
        <div className="flex flex-col gap-4">
          {audits.map(a => (
            <a key={a.name} href={a.url} className="text-gold underline hover:text-yellow-400 text-lg font-bold flex items-center justify-center gap-2">
              <span role="img" aria-label="audit">🔍</span> {a.name} Security Audit ({a.year})
            </a>
          ))}
        </div>
        <div className="mt-6 text-gray-400 text-sm">All smart contracts and infrastructure are regularly audited by top security firms. Reports available on request.</div>
      </div>
    </section>
  );
}
