import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const plans = [
	{ name: 'AI Grid Strategy', rate: 0.18 },
	{ name: 'ETH & BTC Basket', rate: 0.1 },
	{ name: 'Leverage Alpha 2x', rate: 0.14 },
	{ name: 'DAO Seed Accelerator', rate: 0.2 },
];

function useCountUp(target, duration = 900) {
	const [count, setCount] = useState(0);
	useEffect(() => {
		let start = 0;
		let startTime = null;
		function animate(ts) {
			if (!startTime) startTime = ts;
			const progress = Math.min((ts - startTime) / duration, 1);
			const value = start + (target - start) * progress;
			setCount(Math.round(value));
			if (progress < 1) requestAnimationFrame(animate);
		}
		requestAnimationFrame(animate);
	}, [target, duration]);
	return count;
}

const PerformanceIllustrator = () => {
  const [amount, setAmount] = useState(10000);
  const [months, setMonths] = useState(12);
  const [plan, setPlan] = useState(PLANS[0]);
  const value = Math.round(amount * Math.pow(1 + plan.rate / 12, months));
  const change = value - amount;
  const percent = Math.round((change / amount) * 100);
  const animatedValue = useCountUp(value, 900);
  return (
    <section className="py-16">
      <h3 className="text-2xl font-bold text-gold mb-4">Performance Illustration</h3>
      <p className="text-gray-400 mb-4">For educational purposes only. This tool demonstrates how changes in assumptions can affect outcomes. It is not a forecast or a guarantee.</p>
      <input
          type="number"
          min={1000}
          max={1000000}
          value={amount}
          onChange={e => setAmount(Number(e.target.value))}
          className="px-4 py-2 rounded-lg bg-gray-900 bg-opacity-60 border border-gold text-white w-full md:w-40 text-lg text-center focus:outline-none"
          placeholder="Amount ($)"
      />
      <select
          value={plan.name}
          onChange={e =>
              setPlan(plans.find(p => p.name === e.target.value))
          }
          className="px-4 py-2 rounded-lg bg-gray-900 bg-opacity-60 border border-gold text-white w-full md:w-56 text-lg focus:outline-none"
      >
          {plans.map(p => (
              <option key={p.name} value={p.name}>
                  {p.name}
              </option>
          ))}
      </select>
      <select
          value={months}
          onChange={e => setMonths(Number(e.target.value))}
          className="px-4 py-2 rounded-lg bg-gray-900 bg-opacity-60 border border-gold text-white w-full md:w-32 text-lg focus:outline-none"
      >
          {[6, 12, 24, 36].map(m => (
              <option key={m} value={m}>
                  {m} months
              </option>
          ))}
      </select>
      <div className="text-gold font-mono">Illustrative Change: +{percent}%</div>
      <div className="text-white font-mono">Illustrative Value: ${animatedValue.toLocaleString()}</div>
    </section>
  );
};

export default PerformanceIllustrator;
