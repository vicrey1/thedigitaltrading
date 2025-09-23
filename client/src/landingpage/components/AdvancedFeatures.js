import React from 'react';
import InteractiveElement from './InteractiveElement.js';

const e = React.createElement;

const FeatureCard = ({ imgSrc, title, subtitle, text, depth }) => {
    return e(InteractiveElement, { depth: 0.003, className: 'glass-card p-8' },
        e('img', { src: imgSrc, alt: `${title} Visual`, className: 'rounded-lg mb-6 w-full h-48 object-cover' }),
        e('h3', { className: 'text-2xl font-bold font-serif text-brand-light mb-3' }, title),
        e('p', { className: 'text-brand-accent italic mb-4' }, subtitle),
        e('p', { className: 'text-sm text-brand-light/70 leading-relaxed' }, text)
    );
};

function AdvancedFeatures() {
    return e('section', { id: 'advanced-features', className: 'py-20 md:py-32 relative bg-black/20' },
        e('div', { className: 'absolute inset-0 bg-cover bg-center bg-fixed opacity-10', style: { backgroundImage: "url('https://images.stockcake.com/public/e/d/3/ed3f8fd9-a879-4749-9331-412d250bf97d_large/digital-finance-visualization-stockcake.jpg')" } }),
        e('div', { className: 'container mx-auto px-6 relative' },
            e(InteractiveElement, { depth: 0.003, className: 'text-center mb-16' },
                e('h2', { className: 'text-4xl md:text-5xl font-serif text-brand-light' }, 'The Revenue-Generating Machine'),
                e('p', { className: 'max-w-2xl mx-auto mt-4 text-brand-light/70' }, 'Our research and engineering stack emphasizes clarity, controls, and repeatable process. This is an educational overview—no guarantees.')
            ),
            e('div', { className: 'grid md:grid-cols-2 gap-12 items-start' },
                e(FeatureCard, {
                    imgSrc: 'https://images.stockcake.com/public/5/1/c/51cd3d0b-3bac-4914-8e2f-07ea317259a6_large/abstract-network-visualization-stockcake.jpg',
                    title: 'AI-Powered Revenue Optimization',
                    subtitle: 'Turn Data Into Dollars, Automatically.',
                    text: 'Our research platform analyzes diverse market and network data to support disciplined decision-making. We continuously test, monitor, and refine models to improve robustness and transparency over time.',
                    depth: 0.003
                }),
                e(FeatureCard, {
                    imgSrc: 'https://images.stockcake.com/public/6/1/7/617983b8-ada4-4a78-81c4-6513b09997ac_large/global-network-visualization-stockcake.jpg',
                    title: 'The $10M Funnel System',
                    subtitle: 'From Cold Traffic to Loyal Customers, Automatically.',
                    text: 'This is the exact funnel system that generated over $10M for our clients last year. We map your customer\'s entire journey from first click to final purchase, then optimize every touchpoint for maximum conversion. Email sequences that sell while you sleep. Retargeting ads that bring back 67% of abandoned carts. Social proof that converts skeptics into buyers. It\'s like having a 24/7 sales team that never asks for a raise.',
                    depth: 0.003
                })
            )
        )
    );
}

export default AdvancedFeatures;
