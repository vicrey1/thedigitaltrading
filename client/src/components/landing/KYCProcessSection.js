import React from 'react';

const KYCProcessSection = () => (
  <section className="py-20 bg-transparent text-white">
    <div className="backdrop-blur-xl bg-black bg-opacity-60 rounded-3xl p-10 shadow-2xl border border-gold/30 max-w-4xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gold text-center">Join as an Accredited Investor</h2>
      <div className="max-w-3xl mx-auto mb-8 text-lg text-gray-300 text-center">
        <p>Our onboarding process ensures compliance and security for all investors. Become part of an exclusive network with institutional-grade protection.</p>
      </div>
      <div className="flex flex-wrap justify-center gap-8 mb-8">
        <ol className="text-left space-y-2 bg-gray-900 bg-opacity-80 p-6 rounded-xl shadow-lg">
          <li><span className="text-gold font-bold">1.</span> Account Registration</li>
          <li><span className="text-gold font-bold">2.</span> Identity Verification</li>
          <li><span className="text-gold font-bold">3.</span> Risk Assessment</li>
          <li><span className="text-gold font-bold">4.</span> Fund Selection</li>
          <li><span className="text-gold font-bold">5.</span> Wallet Integration</li>
          <li><span className="text-gold font-bold">6.</span> Live Allocation</li>
        </ol>
        <div className="flex flex-col gap-4 justify-center">
          <div className="flex items-center gap-2"><span className="inline-block w-8 h-8 bg-yellow-900 rounded-full flex items-center justify-center text-gold">GDPR</span> GDPR Compliant</div>
          <div className="flex items-center gap-2"><span className="inline-block w-8 h-8 bg-yellow-900 rounded-full flex items-center justify-center text-gold">ISO</span> ISO 27001 Certified</div>
          <div className="flex items-center gap-2"><span className="inline-block w-8 h-8 bg-yellow-900 rounded-full flex items-center justify-center text-gold">🔒</span> Cold Storage Custody Partners</div>
          <div className="flex items-center gap-2"><span className="inline-block w-8 h-8 bg-yellow-900 rounded-full flex items-center justify-center text-gold">🔑</span> Multi-Signature Wallets</div>
        </div>
      </div>
    </div>
  </section>
);

export default KYCProcessSection;
