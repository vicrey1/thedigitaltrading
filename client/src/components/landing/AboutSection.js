import React from 'react';

const AboutSection = () => (
  <section className="py-20 bg-transparent text-white text-center">
    <div className="backdrop-blur-xl bg-black bg-opacity-60 rounded-3xl p-10 shadow-2xl border border-gold/30 max-w-4xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gold">About THE DIGITAL TRADING</h2>
      <p className="text-white/90 max-w-3xl mx-auto">
        We are a research and technology-focused team building disciplined digital asset capabilities. Our approach emphasizes robust controls, transparency, and documentation—no hype, no guarantees.
      </p>
      <div className="flex flex-wrap justify-center gap-8 mb-8">
        <div className="flex flex-col items-center">
          <span className="text-4xl mb-2">📊</span>
          <span className="font-semibold">Strategic Analytics</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-4xl mb-2">🎯</span>
          <span className="font-semibold">Precision Targeting</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-4xl mb-2">⚡</span>
          <span className="font-semibold">Technology Integration</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-4xl mb-2">🤝</span>
          <span className="font-semibold">Strategic Partnership</span>
        </div>
      </div>
      {/* Optional: Video embed for CEO message */}
      {/* <div className="mt-8 flex justify-center">
        <iframe width="560" height="315" src="https://www.youtube.com/embed/your-ceo-video" title="CEO Welcome" frameBorder="0" allow="autoplay; encrypted-media" allowFullScreen></iframe>
      </div> */}
    </div>
  </section>
);

export default AboutSection;
