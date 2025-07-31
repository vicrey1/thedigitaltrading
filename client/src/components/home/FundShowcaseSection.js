import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import AnimatedFundChart from './AnimatedFundChart';

const FundShowcaseSection = () => {
	const [funds, setFunds] = useState([]);
	useEffect(() => {
		fetch('/api/funds')
			.then((res) => res.json())
			.then((data) => setFunds(data));
	}, []);
	const [hovered, setHovered] = useState(null);
	return (
		<section id="funds" className="py-20 bg-transparent">
			<h2 className="text-3xl md:text-4xl font-bold mb-8 text-gold text-center font-serif">
				Our Investment Strategies
			</h2>
			<div className="flex flex-wrap justify-center gap-8">
				{funds.map((f, i) => (
					<motion.div
						key={f.slug}
						initial={{ opacity: 0, scale: 0.95 }}
						whileInView={{ opacity: 1, scale: 1 }}
						transition={{ delay: i * 0.1, duration: 0.6 }}
						viewport={{ once: true }}
						className="backdrop-blur-xl bg-black bg-opacity-85 rounded-3xl p-8 w-80 shadow-glass border border-gold/20 hover:scale-105 hover:border-gold transition-transform group relative cursor-pointer"
						style={{
							boxShadow:
								hovered === i
									? '0 0 32px 0 #18181b'
									: undefined,
							transform:
								hovered === i
									? 'perspective(800px) rotateY(6deg) scale(1.04)'
									: undefined,
							transition: 'box-shadow 0.3s, transform 0.3s',
						}}
						onMouseEnter={() => setHovered(i)}
						onMouseLeave={() => setHovered(null)}
					>
						<span className="text-4xl mb-2 block text-gold/80 group-hover:text-gold">
							{f.icon || '🪙'}
						</span>
						<div className="text-gold text-xs mb-1 uppercase tracking-wider">
							{f.type}
						</div>
						<div className="text-xl font-bold mb-1 font-serif text-white">
							{f.title}
						</div>
						<div className="text-gold mb-2 font-mono">{f.roi}</div>
						<div className="text-gray-400 mb-4 text-sm">
							{f.description}
						</div>
						<div className="w-full h-12 flex items-center justify-center mb-2">
							<AnimatedFundChart color="#FFD700" />
						</div>
						<Link
							to={`/funds/${f.slug}`}
							className="absolute bottom-4 left-1/2 -translate-x-1/2 px-5 py-2 bg-black bg-opacity-70 border border-gold text-gold font-bold rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-all focus:ring-2 focus:ring-gold/40 focus:outline-none"
						>
							Learn More
						</Link>
					</motion.div>
				))}
			</div>
		</section>
	);
};

export default FundShowcaseSection;
