import React from 'react';

const Footer = () => (
  <footer className="bg-black bg-opacity-90 text-gray-400 py-10 px-4">
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
      <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-center">
        <a href="/" className="hover:text-orange-400">Home</a>
        <a href="#about" className="hover:text-orange-400">About Us</a>
        <a href="#funds" className="hover:text-orange-400">Funds</a>
        <a href="/login" className="hover:text-orange-400">Login</a>
        <a href="/register" className="hover:text-orange-400">Register</a>
        <a href="/terms" className="hover:text-orange-400">Terms of Service</a>
        <a href="/privacy" className="hover:text-orange-400">Privacy Policy</a>
        <a href="#contact" className="hover:text-orange-400">Contact</a>
      </div>
      <div className="flex gap-4 items-center text-xl">
        <a href="https://linkedin.com" className="hover:text-orange-400" aria-label="LinkedIn"><i className="fab fa-linkedin"></i></a>
        <a href="https://twitter.com" className="hover:text-orange-400" aria-label="Twitter"><i className="fab fa-twitter"></i></a>
        <a href="https://telegram.org" className="hover:text-orange-400" aria-label="Telegram"><i className="fab fa-telegram"></i></a>
        <a href="https://discord.com" className="hover:text-orange-400" aria-label="Discord"><i className="fab fa-discord"></i></a>
      </div>
    </div>
    <div className="max-w-6xl mx-auto mt-6 text-xs text-center text-gray-500">
      CRYPTO TRADING is a digital asset research & technology company. Information is educational only and not advice. Past performance is not indicative of future results. No guarantees.
    </div>
  </footer>
);

export default Footer;
