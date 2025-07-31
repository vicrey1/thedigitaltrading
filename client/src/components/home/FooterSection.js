import React, { useState } from 'react';

const socials = [
  { icon: 'fab fa-linkedin', label: 'LinkedIn', href: '#' },
  { icon: 'fab fa-twitter', label: 'Twitter', href: '#' },
  { icon: 'fab fa-telegram', label: 'Telegram', href: '#' },
  { icon: 'fab fa-discord', label: 'Discord', href: '#' },
];

const FooterSection = () => {
  const [subscribed, setSubscribed] = useState(false);
  const [email, setEmail] = useState('');
  const handleSubmit = e => {
    e.preventDefault();
    setSubscribed(true);
    setTimeout(() => setSubscribed(false), 1800);
    setEmail('');
  };
  return (
    <footer className="relative backdrop-blur-xl bg-black bg-opacity-80 border-t border-gold/20 py-10 px-4 mt-8 overflow-hidden">
      {/* Soft gold gradient overlay */}
      <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 60% 0%, #FFD70022 0%, transparent 80%)', zIndex: 0 }} />
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
        <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-center">
          <a href="/" className="hover:text-gold">Home</a>
          <a href="#about" className="hover:text-gold">About</a>
          <a href="#funds" className="hover:text-gold">Funds</a>
          <a href="/login" className="hover:text-gold">Login</a>
          <a href="/register" className="hover:text-gold">Register</a>
          <button className="hover:text-gold">Terms</button>
          <button className="hover:text-gold">Privacy</button>
          <a href="#contact" className="hover:text-gold">Contact</a>
        </div>
        <div className="flex gap-4 items-center text-xl">
          {socials.map(s => (
            <a
              key={s.label}
              href={s.href}
              className="hover:text-gold relative group"
              aria-label={s.label}
            >
              <i className={s.icon}></i>
              <span className="absolute left-1/2 -translate-x-1/2 -top-8 bg-black bg-opacity-80 text-gold text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition pointer-events-none z-20 whitespace-nowrap">
                {s.label}
              </span>
            </a>
          ))}
        </div>
      </div>
      <div className="max-w-6xl mx-auto mt-6 flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
        <form onSubmit={handleSubmit} className="flex gap-2 bg-black bg-opacity-60 rounded-lg p-2 border border-gold/20">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Stay ahead of the market. Subscribe."
            className="bg-transparent text-white px-3 py-2 focus:outline-none"
            required
          />
          <button type="submit" className="px-4 py-2 bg-gold text-black font-bold rounded-lg hover:bg-yellow-400 transition flex items-center">
            {subscribed ? <span className="text-xl">✔️</span> : 'Subscribe'}
          </button>
        </form>
        <div className="text-gray-400 text-xs">© 2025 LUXHEDGE. All Rights Reserved.</div>
      </div>
    </footer>
  );
};

export default FooterSection;
