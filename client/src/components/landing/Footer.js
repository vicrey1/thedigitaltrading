import React from 'react';

const Footer = () => (
  <footer className="bg-black bg-opacity-90 text-gray-400 py-10 px-4">
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
      <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-center">
        <a href="/" className="hover:text-gold">Home</a>
        <a href="#about" className="hover:text-gold">About Us</a>
        <a href="#funds" className="hover:text-gold">Funds</a>
        <a href="/login" className="hover:text-gold">Login</a>
        <a href="/register" className="hover:text-gold">Register</a>
        <a href="/terms" className="hover:text-gold">Terms of Service</a>
        <a href="/privacy" className="hover:text-gold">Privacy Policy</a>
        <a href="#contact" className="hover:text-gold">Contact</a>
      </div>
      <div className="flex gap-4 items-center text-xl">
        <a href="https://linkedin.com" className="hover:text-gold" aria-label="LinkedIn"><i className="fab fa-linkedin"></i></a>
        <a href="https://twitter.com" className="hover:text-gold" aria-label="Twitter"><i className="fab fa-twitter"></i></a>
        <a href="https://telegram.org" className="hover:text-gold" aria-label="Telegram"><i className="fab fa-telegram"></i></a>
        <a href="https://discord.com" className="hover:text-gold" aria-label="Discord"><i className="fab fa-discord"></i></a>
      </div>
    </div>
    <div className="max-w-6xl mx-auto mt-6 text-xs text-center text-gray-500">
      LUXHEDGE is a registered digital asset manager offering institutional investment products. All investments carry risk. Past performance does not guarantee future returns.
    </div>
  </footer>
);

export default Footer;
