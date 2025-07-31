import React from 'react';
import InteractiveElement from './InteractiveElement.js';

const e = React.createElement;

function Aura() {
    return e('section', { id: 'aura', className: 'py-20 md:py-32 bg-black/20' },
        e('div', { className: 'container mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center' },
            e(InteractiveElement, { depth: 0.003, className: 'order-2 lg:order-1' },
                e('h2', { className: 'text-4xl md:text-5xl font-serif text-brand-light mb-4' }, 'The AURA Engine: AI-Powered Alpha'),
                e('p', { className: 'text-brand-accent italic mb-6' }, 'Where Predictive Analytics Meets Proactive Investment.'),
                e('p', { className: 'text-brand-light/80 leading-relaxed' },
                    'At the core of LUXYIELD lies ', e('span', { className: 'aura-style' }, 'AURA'),
                    ', our proprietary Analytical Universal Reasoning Architecture. ', e('span', { className: 'aura-style' }, 'AURA'),
                    ' is more than an algorithm; it is a cognitive financial engine that processes over 1.5 petabytes of data daily—from global equity markets and sentiment analysis to geopolitical risk vectors and esoteric alternative data. By identifying non-linear patterns invisible to human analysts, ',
                    e('span', { className: 'aura-style' }, 'AURA'), ' constructs predictive models that empower our strategists to act with decisive, data-backed conviction. This is our unfair advantage, institutionalized for your portfolio.'
                )
            ),
            e(InteractiveElement, { depth: 0.003, className: 'order-1 lg:order-2' },
                e('img', { src: 'https://images.stockcake.com/public/a/a/d/aad1a097-7b62-4b3e-bd67-d1ba1e21f19e_large/glowing-abstract-network-stockcake.jpg', alt: 'Abstract visualization of the AURA AI data network', className: 'rounded-lg shadow-2xl object-cover w-full h-full' })
            )
        )
    );
}

export default Aura;
