import React from 'react';

const ContactSupportSection = () => (
  <section id="contact" className="py-20 bg-gradient-to-br from-black via-gray-900 to-gray-800 text-white">
    <h2 className="text-3xl md:text-4xl font-bold mb-8 text-gold text-center">Contact & Support</h2>
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
      <div className="bg-gray-900 bg-opacity-80 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold mb-2">Contact Info</h3>
        <div className="mb-2">Email: <a href="mailto:contact@luxyield.com" className="text-gold">contact@luxyield.com</a></div>
        <div className="mb-2">Phone: <a href="tel:+15551234567" className="text-gold">+1 (555) 123-4567</a></div>
        <div className="mb-2">Address: Geneva, Switzerland | Singapore | Dubai</div>
      </div>
      <div className="bg-gray-900 bg-opacity-80 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold mb-2">Support Options</h3>
        <ul className="list-disc list-inside text-gray-300">
          <li>Investor Relations Portal</li>
          <li>Live Chat (for registered users)</li>
          <li>Telegram Group (Verified Investors Only)</li>
        </ul>
        <div className="mt-4 text-gray-400">Languages Supported: English, Español, 中文, Русский, Français</div>
      </div>
    </div>
  </section>
);

export default ContactSupportSection;
