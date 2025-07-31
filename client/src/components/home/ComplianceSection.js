import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const badges = [
	{
		icon: '🔒',
		label: 'ISO 27001 Certified',
		desc: 'International standard for information security management.',
	},
	{
		icon: '🛡️',
		label: 'GDPR Compliant',
		desc: 'Your data is protected under strict EU privacy laws.',
	},
	{
		icon: '🔑',
		label: 'Multi-Signature Wallets',
		desc: 'Funds are secured with multi-sig institutional custody.',
	},
	{
		icon: '📄',
		label: 'Transparent KYC & Privacy',
		desc: 'Full compliance with global KYC/AML and privacy standards.',
	},
];

const ComplianceSection = () => {
	const [modal, setModal] = useState(null);
	return (
		<section className="py-20 bg-transparent">
			<motion.div
				initial={{ opacity: 0, y: 30 }}
				whileInView={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.7 }}
				viewport={{ once: true }}
				className="max-w-4xl mx-auto backdrop-blur-xl bg-black bg-opacity-60 rounded-3xl p-10 shadow-glass border border-gold/30 text-center relative"
			>
				<h2 className="text-2xl md:text-3xl font-bold mb-6 text-gold font-serif">
					Compliance & Security
				</h2>
				<div className="flex flex-wrap justify-center gap-8 mb-6">
					{badges.map((b, i) => (
						<motion.div
							key={b.label}
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							transition={{ delay: i * 0.1, duration: 0.5 }}
							viewport={{ once: true }}
							className="flex flex-col items-center group relative cursor-pointer"
							onMouseEnter={() => setModal(i)}
							onMouseLeave={() => setModal(null)}
						>
							<span className="text-4xl mb-2 animate-pulse group-hover:animate-none drop-shadow-[0_0_8px_gold]">
								{b.icon}
							</span>
							<span className="font-semibold text-white group-hover:text-gold transition-colors">
								{b.label}
							</span>
							{/* Tooltip */}
							<AnimatePresence>
								{modal === i && (
									<motion.div
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: 10 }}
										className="absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-black bg-opacity-90 text-gold text-xs rounded-lg px-4 py-2 shadow-lg z-20 border border-gold/40"
										style={{ minWidth: 180 }}
									>
										{b.desc}
									</motion.div>
								)}
							</AnimatePresence>
						</motion.div>
					))}
				</div>
				<div className="text-gray-400 text-sm mb-2">
					256-bit SSL encryption, IP/device logging, and institutional custody partners.
				</div>
				<div className="flex justify-center gap-4 mt-4">
					<button
						onClick={() => setModal('kyc')}
						className="text-gold underline hover:text-yellow-400"
					>
						KYC Policy
					</button>
					<button
						onClick={() => setModal('privacy')}
						className="text-gold underline hover:text-yellow-400"
					>
						Privacy Policy
					</button>
				</div>
				{/* Modal for KYC/Privacy */}
				<AnimatePresence>
					{modal === 'kyc' && (
						<motion.div
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.95 }}
							className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
							onClick={() => setModal(null)}
						>
							<div
								className="bg-black bg-opacity-90 border border-gold/40 rounded-2xl p-8 max-w-lg text-left text-white shadow-2xl relative"
								onClick={(e) => e.stopPropagation()}
							>
								<h3 className="text-gold text-xl font-bold mb-4">
									KYC Policy
								</h3>
								<p className="mb-4 text-sm">
									LUXHEDGE follows strict Know Your Customer (KYC) and
									Anti-Money Laundering (AML) procedures to ensure the
									safety and compliance of all investors. All data is
									encrypted and handled with the utmost confidentiality.
								</p>
								<button
									className="absolute top-2 right-4 text-gold text-2xl"
									onClick={() => setModal(null)}
								>
									&times;
								</button>
							</div>
						</motion.div>
					)}
					{modal === 'privacy' && (
						<motion.div
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.95 }}
							className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
							onClick={() => setModal(null)}
						>
							<div
								className="bg-black bg-opacity-90 border border-gold/40 rounded-2xl p-8 max-w-lg text-left text-white shadow-2xl relative"
								onClick={(e) => e.stopPropagation()}
							>
								<h3 className="text-gold text-xl font-bold mb-4">
									Privacy Policy
								</h3>
								<p className="mb-4 text-sm">
									Your privacy is our priority. We comply with GDPR and
									global privacy standards. All personal data is encrypted,
									never sold, and only used for regulatory compliance and
									account security.
								</p>
								<button
									className="absolute top-2 right-4 text-gold text-2xl"
									onClick={() => setModal(null)}
								>
									&times;
								</button>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</motion.div>
		</section>
	);
};

export default ComplianceSection;
