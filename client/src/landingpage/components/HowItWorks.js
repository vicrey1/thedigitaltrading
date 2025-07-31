import React from 'react';
import InteractiveElement from './InteractiveElement.js';
import { UserPlus, PiggyBank, TrendingUp } from 'https://esm.sh/lucide-react@0.381.0';

const e = React.createElement;

const StepCard = ({ icon, title, text, step, depth }) => {
    return e(InteractiveElement, { depth: 0.003, className: 'text-center' },
        e('div', { className: 'p-8 glass-card h-full' },
            e('div', { className: 'flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-full bg-brand-accent/10 border border-brand-accent/20' },
                e(icon, { className: 'h-10 w-10 text-brand-accent' })
            ),
            e('h3', { className: 'text-xl font-bold font-serif text-brand-light mb-3' }, `${step}. ${title}`),
            e('p', { className: 'text-brand-light/70' }, text)
        )
    );
};

function HowItWorks() {
    return e('section', { id: 'how-it-works', className: 'py-20 md:py-32' },
        e('div', { className: 'container mx-auto px-6' },
            e(InteractiveElement, { depth: 0.003, className: 'text-center mb-16' },
                e('h2', { className: 'text-4xl md:text-5xl font-serif text-brand-light' }, 'A Clear Path to Growth'),
                e('p', { className: 'max-w-2xl mx-auto mt-4 text-brand-light/70' }, 'Our process is engineered for clarity, efficiency, and performance. In three simple steps, you can begin your journey towards sophisticated wealth generation.')
            ),
            e('div', { className: 'grid md:grid-cols-3 gap-12 max-w-6xl mx-auto' },
                e(StepCard, { icon: UserPlus, title: 'Create Your Account', text: 'Begin by establishing your secure client profile. Our streamlined onboarding process is digital, confidential, and takes only a few minutes to complete.', step: 1, depth: 0.003 }),
                e(StepCard, { icon: PiggyBank, title: 'Fund & Strategize', text: 'Fund your account through our secure portal. Our advisors will work with you to understand your goals and align your capital with the optimal LUXYIELD strategy.', step: 2, depth: 0.003 }),
                e(StepCard, { icon: TrendingUp, title: 'Grow Your Wealth', text: 'Monitor your portfolio\'s performance through our real-time dashboard. Our team and technology work tirelessly to navigate markets and compound your growth.', step: 3, depth: 0.003 })
            )
        )
    );
}

export default HowItWorks;
