import React from 'react';
import InteractiveElement from './InteractiveElement.js';
import { Cpu, ShieldCheck, Handshake } from 'https://esm.sh/lucide-react@0.381.0';

const e = React.createElement;

const PrincipleCard = ({ icon, title, text, depth }) => {
    return e(InteractiveElement, { depth: 0.003 },
        e('div', { className: 'p-8 glass-card h-full' },
            e(icon, { className: 'h-10 w-10 text-brand-accent mx-auto mb-4' }),
            e('h3', { className: 'text-xl font-bold font-serif text-brand-light mb-3' }, title),
            e('p', { className: 'text-brand-light/70' }, text)
        )
    );
};

function Philosophy() {
    return e('section', { id: 'philosophy', className: 'py-20 md:py-32' },
        e('div', { className: 'container mx-auto px-6 text-center' },
            e(InteractiveElement, { depth: 0.003 },
                e('h2', { className: 'text-4xl md:text-5xl font-serif text-brand-light mb-16' }, 'Our Guiding Principles')
            ),
            e('div', { className: 'grid md:grid-cols-3 gap-12' },
                e(PrincipleCard, {
                    icon: Cpu,
                    title: 'Technology-Driven Alpha',
                    text: 'We believe superior returns are born from superior information. Our proprietary AI, ‘AURA’, continuously analyzes terabytes of market data, identifying patterns and opportunities that are invisible to the human eye. This technological edge is the cornerstone of our strategy.',
                    depth: 0.003
                }),
                e(PrincipleCard, {
                    icon: ShieldCheck,
                    title: 'Disciplined Risk Architecture',
                    text: 'Capital preservation is not an afterthought; it is embedded in our process. Every investment is stress-tested against a matrix of volatility scenarios. We pursue growth aggressively but intelligently, with a risk framework designed for resilience in all market conditions.',
                    depth: 0.003
                }),
                e(PrincipleCard, {
                    icon: Handshake,
                    title: 'Long-Term Strategic Partnership',
                    text: 'We build enduring relationships, not transactional ones. Our strategies are crafted with a long-term horizon, focusing on compounding wealth and achieving generational goals. Your objectives define our mandate.',
                    depth: 0.003
                })
            )
        )
    );
}

export default Philosophy;
