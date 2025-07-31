import React from 'react';

const TestimonialsSection = () => (
  <section className="py-20 bg-transparent text-white">
    <h2 className="text-3xl md:text-4xl font-bold mb-8 text-gold text-center">Testimonials & Institutional Endorsements</h2>
    <div className="flex flex-wrap justify-center gap-8 mb-12">
      {/* Example Testimonial */}
      <div className="backdrop-blur-xl bg-black bg-opacity-60 rounded-3xl p-6 w-96 shadow-2xl border border-gold/30 flex flex-col items-center">
        <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="James W." className="w-16 h-16 rounded-full mb-3 border-2 border-gold" />
        <div className="text-lg font-semibold mb-1">James W.</div>
        <div className="text-sm text-gray-400 mb-2">Family Office Manager, UK</div>
        <p className="italic text-gray-300 mb-2">“LUXHEDGE has become a core component of our digital asset allocation. Their execution is precise and consistent.”</p>
      </div>
      {/* Add more testimonials as needed */}
    </div>
    <div className="flex flex-wrap justify-center gap-8 items-center">
      {/* Example Partner Logos */}
      <img src="/partner-custodian.png" alt="Custodian" className="h-10 grayscale opacity-80" />
      <img src="/partner-auditor.png" alt="Auditor" className="h-10 grayscale opacity-80" />
      <img src="/partner-compliance.png" alt="Compliance" className="h-10 grayscale opacity-80" />
      <img src="/partner-analytics.png" alt="Analytics" className="h-10 grayscale opacity-80" />
    </div>
  </section>
);

export default TestimonialsSection;
