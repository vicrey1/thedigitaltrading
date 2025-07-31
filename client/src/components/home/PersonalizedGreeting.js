import React from 'react';

// Simulate user context (replace with real auth/user context in production)
const user = {
  name: 'Alex',
  portfolioValue: 128400,
  avatar: null,
};

export default function PersonalizedGreeting() {
  if (!user) return null;
  return (
    <div className="w-full bg-black bg-opacity-70 border-b border-gold/10 flex items-center gap-4 px-6 py-3 text-white text-lg font-serif animate-fade-in">
      <span className="rounded-full bg-gold/20 w-10 h-10 flex items-center justify-center text-2xl font-bold">
        {user.avatar || user.name[0]}
      </span>
      <span>
        Welcome back, <span className="text-gold font-bold">{user.name}</span>! Portfolio Value: <span className="text-gold font-mono">${user.portfolioValue.toLocaleString()}</span>
      </span>
    </div>
  );
}
