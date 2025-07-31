import React from 'react';
import InteractiveElement from './InteractiveElement.js';

const e = React.createElement;

const TestimonialCard = ({ text, author, title, depth }) => {
    return e(InteractiveElement, { depth: 0.003 },
        e('blockquote', { className: 'p-8 glass-card border-l-4 border-brand-accent h-full' },
            e('p', { className: 'text-lg text-brand-light/90 italic mb-6' }, text),
            e('footer', { className: 'text-right' },
                e('cite', { className: 'not-italic font-bold text-brand-light' }, author),
                e('p', { className: 'text-sm text-brand-light/60' }, title)
            )
        )
    );
};

function Testimonials() {
    return e('section', { id: 'testimonials', className: 'py-20 md:py-32 bg-black/20' },
        e('div', { className: 'container mx-auto px-6' },
            e(InteractiveElement, { depth: 0.003 },
                 e('h2', { className: 'text-center text-4xl md:text-5xl font-serif text-brand-light mb-16' }, 'Trusted by Leaders')
            ),
            e('div', { className: 'grid lg:grid-cols-2 gap-12' },
                e(TestimonialCard, {
                    text: '"LUXYIELD transformed our approach to capital growth. Their synthesis of AI-driven analytics and human oversight is, without question, the future of asset management. Their performance has consistently exceeded benchmarks while mitigating downside risk."',
                    author: 'Marcus Thorne',
                    title: 'Chief Investment Officer, Tectonics Endowment Fund',
                    depth: 0.003
                }),
                e(TestimonialCard, {
                    text: '"The level of transparency and personalized service is unlike anything I\'ve experienced. I don\'t just feel like a client; I feel like a partner. They have earned my complete trust and delivered exceptional results for my family\'s wealth."',
                    author: 'Elena Vostrov',
                    title: 'Private Wealth Client & Tech Entrepreneur',
                    depth: 0.003
                })
            )
        )
    );
}

export default Testimonials;
