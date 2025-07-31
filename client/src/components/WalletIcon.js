import React from 'react';

const WalletIcon = ({ size = 40, className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" stroke="#D4AF37" fill="#23272b"/>
    <path d="M16 3h-8a2 2 0 0 0-2 2v2h12V5a2 2 0 0 0-2-2z" stroke="#D4AF37" fill="#23272b"/>
    <circle cx="18" cy="14" r="2" fill="#D4AF37"/>
  </svg>
);

export default WalletIcon;
