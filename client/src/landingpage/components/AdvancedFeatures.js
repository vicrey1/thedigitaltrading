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
                e('h2', { className: 'text-4xl md:text-5xl font-serif text-brand-light' }, 'Advanced Platform Features'),
                e('p', { className: 'max-w-2xl mx-auto mt-4 text-brand-light/70' }, 'Our platform is built on a foundation of security, access, and unparalleled analytical power.')
            ),
            e('div', { className: 'grid md:grid-cols-2 gap-12 items-start' },
                e(FeatureCard, {
                    imgSrc: 'https://images.stockcake.com/public/5/1/c/51cd3d0b-3bac-4914-8e2f-07ea317259a6_large/abstract-network-visualization-stockcake.jpg',
                    title: 'Fortress-Grade Security',
                    subtitle: 'Multi-Layered Defense Protocol.',
                    text: 'In a world of evolving digital threats, asset security is absolute. LUXYIELD employs a multi-layered security protocol that combines 256-bit AES encryption, cold storage for digital assets, and fully segregated custodial accounts with our Tier-1 banking partners. All accounts are protected by multi-signature withdrawal requirements and are insured by leading syndicates. Your capital is shielded by an uncompromising security architecture, audited by third-party experts.',
                    depth: 0.003
                }),
                e(FeatureCard, {
                    imgSrc: 'https://images.stockcake.com/public/6/1/7/617983b8-ada4-4a78-81c4-6513b09997ac_large/global-network-visualization-stockcake.jpg',
                    title: 'Global Market Access',
                    subtitle: 'A Unified Gateway to Global Alpha.',
                    text: 'True diversification requires unrestricted access. LUXYIELD provides a unified gateway to a curated universe of investment opportunities across global public equities, fixed income, emerging markets, private equity, and digital asset classes. Our platform eliminates the complexities of international investing, allowing you to deploy capital seamlessly into high-potential markets. We provide the tools and access; you reap the benefits of a truly global portfolio.',
                    depth: 0.003
                })
            )
        )
    );
}

export default AdvancedFeatures;
