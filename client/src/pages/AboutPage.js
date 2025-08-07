import React from 'react';
import PageShell from '../components/PageShell';

const e = React.createElement;

const values = [
    { name: 'Integrity', description: "Our clients' trust is our most valued asset. We operate with absolute transparency, ethical rigor, and a profound sense of fiduciary duty." },
    { name: 'Innovation', description: "We are in a perpetual state of evolution. We relentlessly push the boundaries of technology and financial theory to maintain our competitive edge and anticipate market transformations." },
    { name: 'Excellence', description: "We pursue excellence in every facet of our operations—from the precision of our algorithms to the quality of our client service. Good is never good enough." },
    { name: 'Partnership', description: "We view our clients as partners. Our success is inextricably linked to theirs, and we cultivate deep, long-term relationships built on mutual respect and shared objectives." },
];

function AboutPage() {
    return e(PageShell, {
        title: 'About Us',
        imageSrc: 'https://www.dgicommunications.com/wp-content/uploads/2022/11/DGI-Communications-modern-office-design.jpg',
        imageAlt: 'Modern high-tech office interior'
    },
        e('div', { className: 'max-w-4xl mx-auto' },
            e('h2', { className: 'text-4xl md:text-5xl font-serif text-brand-light text-center mb-6' }, 'Pioneering the Future of Investment'),
            e('p', { className: 'text-brand-light/80 leading-relaxed text-center mb-12' }, "LUXYIELD was founded on a single, powerful conviction: that the future of finance lies at the intersection of human expertise and artificial intelligence. Traditional investment models, constrained by human cognitive limits and emotional bias, are no longer sufficient to navigate the complexities of modern global markets. We saw an opportunity to build a new paradigm."),
            e('div', { className: 'grid md:grid-cols-2 gap-12 items-center mb-20' },
                e('div', {},
                    e('h3', { className: 'text-3xl font-serif text-brand-accent mb-4' }, 'Our Mission'),
                    e('p', { className: 'text-brand-light/80 leading-relaxed' }, "To deliver superior, risk-adjusted returns for our clients by deploying the world's most advanced proprietary AI engine, AURA, to unlock market insights unattainable through conventional analysis. We are committed to redefining the benchmarks of wealth preservation and growth.")
                ),
                e('div', {},
                    e('h3', { className: 'text-3xl font-serif text-brand-accent mb-4' }, 'Our Vision'),
                    e('p', { className: 'text-brand-light/80 leading-relaxed' }, "To be the undisputed leader in technology-driven asset management, recognized for our relentless innovation, uncompromising integrity, and unwavering dedication to client success.")
                )
            ),
            e('h2', { className: 'text-4xl md:text-5xl font-serif text-brand-light text-center mb-12' }, 'Our Core Values'),
            e('div', { className: 'grid md:grid-cols-2 gap-8' },
                ...values.map(value => e('div', { key: value.name, className: 'glass-card p-6' },
                    e('h4', { className: 'text-2xl font-serif text-brand-accent mb-3' }, value.name),
                    e('p', { className: 'text-brand-light/70' }, value.description)
                ))
            ),
            // Legal section with address
            e('div', { className: 'mt-16' },
                e('h3', { className: 'text-2xl font-serif text-brand-accent mb-4' }, 'Legal'),
                e('p', { className: 'text-brand-light/80' }, 'Office Address: Feldstrasse 20, 8004 Zürich, Switzerland')
            ),
            // Partnership section with address and Google Map
            e('div', { className: 'mt-16' },
                e('h3', { className: 'text-2xl font-serif text-brand-accent mb-4' }, 'Partnership'),
                e('p', { className: 'text-brand-light/80 mb-4' }, 'We view our clients as partners. Our success is inextricably linked to theirs, and we cultivate deep, long-term relationships built on mutual respect and shared objectives.'),
                e('div', { className: 'mb-4' },
                    e('strong', null, 'Office Address: '),
                    'Feldstrasse 20, 8004 Zürich, Switzerland'
                ),
                e('div', { className: 'mb-8' },
                    e('iframe', {
                        src: 'https://maps.google.com/maps?q=Feldstrasse%2020%2C%208004%20Z%C3%BCrich%2C%20Switzerland&t=&z=15&ie=UTF8&iwloc=&output=embed',
                        width: '100%',
                        height: '300',
                        style: { border: 0 },
                        allowFullScreen: true,
                        loading: 'lazy',
                        referrerPolicy: 'no-referrer-when-downgrade'
                    })
                )
            )
        )
    );
}

export default AboutPage;
