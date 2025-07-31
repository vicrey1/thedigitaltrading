import React from 'react';

const AboutSection = () => (
  <section className="py-20 bg-transparent text-white text-center">
    <div className="backdrop-blur-xl bg-black bg-opacity-60 rounded-3xl p-10 shadow-2xl border border-gold/30 max-w-4xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gold">Who We Are</h2>
      <p className="max-w-2xl mx-auto mb-8 text-lg text-gray-300">
        LUXHEDGE is a licensed and regulated digital asset manager, delivering institutional-grade crypto investment solutions. Our strategies span spot, derivatives, yield, and structured products, with a focus on active risk management and trusted institutional partnerships.
      </p>
      <div className="flex flex-wrap justify-center gap-8 mb-8">
        <div className="flex flex-col items-center">
          <span className="text-4xl mb-2">📈</span>
          <span className="font-semibold">Active Portfolio Management</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-4xl mb-2">🛡️</span>
          <span className="font-semibold">Risk-Controlled Exposure</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-4xl mb-2">🧠</span>
          <span className="font-semibold">AI-Augmented Strategy Models</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-4xl mb-2">🏦</span>
          <span className="font-semibold">Investor-Centric Governance</span>
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
