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

const ROICalculatorSection = () => {
	const [amount, setAmount] = useState(5000);
	const [plan, setPlan] = useState(plans[0]);
	const [months, setMonths] = useState(12);
	const roi = Math.round(amount * Math.pow(1 + plan.rate / 12, months));
	const percent = Math.round(((roi - amount) / amount) * 100);
	const animatedROI = useCountUp(roi, 900);

	// Generate bar chart data
	const bars = Array.from({ length: months + 1 }, (_, i) =>
		Math.round(amount * Math.pow(1 + plan.rate / 12, i))
	);
	const maxBar = Math.max(...bars);

	return (
		<section className="py-20 bg-transparent">
			<motion.div
				initial={{ opacity: 0, y: 30 }}
				whileInView={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.7 }}
				viewport={{ once: true }}
				className="max-w-xl mx-auto backdrop-blur-xl bg-black bg-opacity-60 rounded-3xl p-10 shadow-glass border border-gold/30 text-center"
			>
				<h2 className="text-2xl md:text-3xl font-bold mb-6 text-gold font-serif">
					ROI Calculator
				</h2>
				<div className="flex flex-col md:flex-row gap-4 mb-6 justify-center">
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
				</div>
				{/* Animated ROI output */}
				<motion.div
					key={roi}
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.5 }}
					className="mt-6 text-2xl font-bold text-gold font-mono flex flex-col items-center"
				>
					Projected ROI:{' '}
					<span className="text-4xl text-gold drop-shadow-lg">
						${animatedROI.toLocaleString()}
					</span>{' '}
					<span className="ml-2 text-lg">
						({percent > 0 ? '+' : ''}
						{percent}%)
					</span>
				</motion.div>
				{/* Gold bar chart */}
				<div className="w-full h-24 flex items-end gap-1 mt-8 mb-2">
					{bars.map((b, i) => (
						<div
							key={i}
							className="rounded-t-lg bg-gradient-to-t from-gold/60 to-gold"
							style={{
								height: `${Math.max(12, (b / maxBar) * 90)}%`,
								width: bars.length > 24 ? '2%' : '4%',
								minWidth: 3,
								transition: 'height 0.4s',
							}}
						/>
					))}
				</div>
				<div className="text-xs text-gray-400 mt-2">
					Projection based on compounding, not a guarantee. For illustration
					only.
				</div>
			</motion.div>
		</section>
	);
};

export default ROICalculatorSection;
