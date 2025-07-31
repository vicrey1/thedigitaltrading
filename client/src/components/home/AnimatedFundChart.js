import React from 'react';

// Placeholder animated chart (replace with real chart lib/data for production)
export default function AnimatedFundChart({ color = '#FFD700' }) {
  return (
    <svg width="120" height="40" viewBox="0 0 120 40" fill="none" className="mx-auto my-2">
      <polyline points="0,30 20,18 40,22 60,10 80,16 100,12 120,28" stroke={color} strokeWidth="3" fill="none" strokeLinejoin="round">
        <animate attributeName="points" values="0,30 20,18 40,22 60,10 80,16 100,12 120,28;0,28 20,20 40,18 60,12 80,18 100,10 120,30;0,30 20,18 40,22 60,10 80,16 100,12 120,28" dur="3s" repeatCount="indefinite" />
      </polyline>
    </svg>
  );
}
