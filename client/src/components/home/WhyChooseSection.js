import React, { useState } from 'react';
import { motion } from 'framer-motion';

const features = [
	{
		icon: '📊',
		title: 'Real Fund Strategies',
		desc: 'Built by professional asset managers with proven track records.',
		tooltip:
			'Our funds are managed by industry veterans with a history of outperformance.',
	},
	{
		icon: '🔒',
		title: 'Institutional-Grade Security',
		desc: 'ISO-certified, multi-sig wallets, and 256-bit SSL encryption.',
		tooltip: 'We use the same security standards as top global banks.',
	},
	{
		icon: '🧠',
		title: 'Expert-Led Asset Allocation',
		desc: 'AI-augmented models and human oversight for optimal results.',
		tooltip:
			'AI and human experts work together for optimal risk-adjusted returns.',
	},
	{
		icon: '🪪',
		title: 'Full KYC & 2FA',
		desc: 'Comprehensive investor verification and compliance.',
		tooltip:
			'Your account is protected by strict KYC and two-factor authentication.',
	},
];

const partners = [
	{ src: '/partner-custodian.png', alt: 'Custodian' },
	{ src: '/partner-auditor.png', alt: 'Auditor' },
	{ src: '/partner-compliance.png', alt: 'Compliance' },
	{ src: '/partner-analytics.png', alt: 'Analytics' },
	{ src: '/partner-custodian.png', alt: 'Custodian' }, // repeat for smooth loop
	{ src: '/partner-auditor.png', alt: 'Auditor' },
];

const WhyChooseSection = () => {
	const [hovered, setHovered] = useState(null);
	return (
		<section className="py-20 bg-transparent">
			<h2 className="text-3xl md:text-4xl font-bold mb-8 text-gold text-center font-serif">
				Why Choose LUXHEDGE?
			</h2>
			<div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
				{features.map((f, i) => (
					<motion.div
						key={f.title}
						initial={{ opacity: 0, y: 30 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ delay: i * 0.1, duration: 0.6 }}
						viewport={{ once: true }}
						className="backdrop-blur-xl bg-black bg-opacity-60 rounded-3xl p-8 shadow-glass border border-gold/30 flex flex-col items-center group relative cursor-pointer"
						onMouseEnter={() => setHovered(i)}
						onMouseLeave={() => setHovered(null)}
					>
						{/* Animated gold badge */}
						<span className="text-4xl mb-2 animate-pulse group-hover:animate-none drop-shadow-[0_0_8px_gold]">
							{f.icon}
						</span>
						<span className="text-lg font-bold text-white mb-1 font-serif">
							{f.title}
						</span>
						<span className="text-gray-300 text-sm text-center font-sans">
							{f.desc}
						</span>
						{/* Tooltip on hover */}
						{hovered === i && (
							<motion.div
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: 10 }}
								className="absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-black bg-opacity-90 text-gold text-xs rounded-lg px-4 py-2 shadow-lg z-20 border border-gold/40"
								style={{ minWidth: 180 }}
							>
								{f.tooltip}
							</motion.div>
						)}
						{/* Gold animated border on hover */}
						<span
							aria-hidden
							className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-30 transition-opacity rounded-3xl"
							style={{
								background:
									'linear-gradient(120deg, #FFD700 0%, #B8860B 100%)',
								filter: 'blur(16px)',
							}}
						/>
					</motion.div>
				))}
			</div>
			{/* Partner logo carousel */}
			<div className="relative w-full max-w-5xl mx-auto mt-12 overflow-x-hidden">
				<div
					className="flex items-center gap-12 animate-partner-scroll"
					style={{ width: 'max-content' }}
				>
					{partners.map((p, i) => (
						<img
							key={i}
							src={p.src}
							alt={p.alt}
							className="h-10 grayscale opacity-80 hover:opacity-100 hover:grayscale-0 transition duration-300 drop-shadow-[0_0_8px_gold]"
							style={{ minWidth: 120 }}
						/>
					))}
				</div>
				<style>{`
          @keyframes partner-scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-partner-scroll {
            animation: partner-scroll 24s linear infinite;
          }
        `}</style>
			</div>
		</section>
	);
};

export default WhyChooseSection;
