import React from 'react';
import { motion } from 'framer-motion';

const metrics = [
	{ icon: '📊', label: 'Avg. ROI (12mo)', value: 8.6, suffix: '%', prefix: '+', decimals: 1 },
	{ icon: '🏦', label: 'Total AUM', value: 2.3, suffix: ' Billion', prefix: '$', decimals: 1 },
	{ icon: '👥', label: 'Verified Investors', value: 12482, suffix: '+', prefix: '', decimals: 0 },
	{ icon: '🌐', label: 'Global Coverage', value: 65, suffix: ' Countries', prefix: '', decimals: 0 },
];

function useCountUp(target, duration = 1200, decimals = 0) {
	const [count, setCount] = React.useState(0);
	React.useEffect(() => {
		let start = 0;
		let startTime = null;
		function animate(ts) {
			if (!startTime) startTime = ts;
			const progress = Math.min((ts - startTime) / duration, 1);
			const value = start + (target - start) * progress;
			setCount(Number(value.toFixed(decimals)));
			if (progress < 1) requestAnimationFrame(animate);
		}
		requestAnimationFrame(animate);
	}, [target, duration, decimals]);
	return count;
}

function MetricCard({ icon, label, value, suffix, prefix, decimals, i }) {
	const count = useCountUp(value, 1200, decimals);
	return (
		<motion.div
			initial={{ opacity: 0, y: 30, scale: 0.95 }}
			whileInView={{ opacity: 1, y: 0, scale: 1 }}
			transition={{ delay: i * 0.15, duration: 0.7 }}
			viewport={{ once: true }}
			className="backdrop-blur-xl bg-black bg-opacity-80 rounded-3xl p-8 shadow-glass border border-gold/20 flex flex-col items-center group hover:scale-105 hover:border-gold transition-transform relative overflow-hidden"
		>
			<span className="text-4xl mb-2 text-gold/80 group-hover:text-gold drop-shadow-[0_0_8px_black]">
				{icon}
			</span>
			<span className="text-3xl font-bold text-gold mb-1 font-serif flex items-end">
				{prefix}
				{count}
				{suffix}
			</span>
			<span className="text-gray-300 text-sm font-sans">{label}</span>
		</motion.div>
	);
}

const MetricsSection = () => {
	return (
		<section className="py-16 bg-transparent">
			<div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
				{metrics.map((m, i) => (
					<MetricCard key={m.label} {...m} i={i} />
				))}
			</div>
		</section>
	);
};

export default MetricsSection;
