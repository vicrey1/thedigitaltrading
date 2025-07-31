import React, { useEffect, useState } from 'react';

const PLANS = [
  { name: 'Starter', rate: 0.0003 },
  { name: 'Silver', rate: 0.0005 },
  { name: 'Gold', rate: 0.0008 },
  { name: 'Platinum', rate: 0.0012 }
];

export default function SimulatedGrowth({ plan = 'Starter', balance = 10000 }) {
  const [simBalance, setSimBalance] = useState(balance);
  const planObj = PLANS.find(p => p.name === plan) || PLANS[0];

  useEffect(() => {
    setSimBalance(balance);
  }, [balance]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSimBalance(b => b + b * planObj.rate);
    }, 60000); // every minute
    return () => clearInterval(interval);
  }, [planObj]);

  return (
    <div className="glass-card p-4 mb-4 bg-gradient-to-r from-green-900 to-green-700 text-white">
      <span className="font-bold">Simulated Growth:</span> Your balance is now <span className="text-gold">${simBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span> USD (Plan: {planObj.name})
    </div>
  );
}
