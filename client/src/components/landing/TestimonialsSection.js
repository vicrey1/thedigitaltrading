import React from 'react';

const TestimonialsSection = () => (
  <section className="py-20 bg-transparent text-white">
    <h2 className="text-3xl md:text-4xl font-bold mb-8 text-orange-400 text-center">Client Success Stories</h2>
    <div className="flex flex-wrap justify-center gap-8 mb-12">
      {/* Example Testimonial */}
      <div className="backdrop-blur-xl bg-black bg-opacity-60 rounded-3xl p-6 w-96 shadow-2xl border border-orange-400/30 flex flex-col items-center">
        <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="James W." className="w-16 h-16 rounded-full mb-3 border-2 border-orange-400" />
        <div className="text-lg font-semibold mb-1">Emma Rodriguez</div>
        <div className="text-sm text-gray-400 mb-2">CMO, Global Retail Brand</div>
        <p className="italic text-gray-300 mb-2">"CRYPTO TRADING provided disciplined guidance and clear documentation that improved our internal decision-making processes."</p>
      </div>
      {/* Add more testimonials as needed */}
    </div>
    <div className="flex flex-wrap justify-center gap-8 items-center">
      {/* Example Partner Logos */}
      <span className="text-gray-400 text-sm">Google</span>
      <span className="text-gray-400 text-sm">Meta</span>
      <span className="text-gray-400 text-sm">HubSpot</span>
      <span className="text-gray-400 text-sm">Salesforce</span>
    </div>
  </section>
);

export default TestimonialsSection;
