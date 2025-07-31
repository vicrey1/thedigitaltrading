// src/components/Logo.js
import React from 'react';

const Logo = ({ size = 'text-4xl' }) => {
  return (
    <div className={`font-bold ${size} flex items-center`}>
      <span className="text-white">LUX</span>
      <span className="text-gold">HEDGE</span>
    </div>
  );
};

export default Logo;