import React from 'react';

const press = [
  { src: '/press-bloomberg.png', alt: 'Bloomberg' },
  { src: '/press-wsj.png', alt: 'Wall Street Journal' },
  { src: '/press-ft.png', alt: 'Financial Times' },
  { src: '/press-coindesk.png', alt: 'Coindesk' },
];

export default function PressMentions() {
  return (
    <section className="py-8 bg-transparent">
      <div className="flex justify-center items-center gap-10 opacity-80">
        {press.map((p, i) => (
          <img key={i} src={p.src} alt={p.alt} className="h-8 grayscale hover:grayscale-0 transition" />
        ))}
      </div>
    </section>
  );
}
