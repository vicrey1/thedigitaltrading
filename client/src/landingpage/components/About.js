import React from 'react';
import InteractiveElement from './InteractiveElement.js';

const e = React.createElement;

function About() {
    return e('section', { id: 'about', className: 'py-20 md:py-32' },
        e('div', { className: 'container mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center' },
            e(InteractiveElement, { depth: 0.003 },
                e('img', { src: 'https://officebanao.com/wp-content/uploads/2025/03/modern-minimalist-office-black-white-1-1200x675.jpg', alt: 'A sleek, modern high-tech corporate office', className: 'rounded-lg shadow-2xl object-cover w-full h-full' })
            ),
            e(InteractiveElement, { depth: 0.003 },
                e('h2', { className: 'text-4xl md:text-5xl font-serif text-brand-light mb-6' }, 'Beyond Investment. ', e('br'), 'A Partnership in Prosperity.'),
                e('p', { className: 'text-brand-light/80 leading-relaxed mb-4' }, 'Founded on the principle that modern capital markets demand a more intelligent approach, LUXYIELD stands at the intersection of financial acumen and technological innovation. We are not merely managers of capital; we are stewards of our clients\' futures.'),
                e('p', { className: 'text-brand-light/80 leading-relaxed' }, 'Our mission is to demystify market complexity, delivering absolute returns through a disciplined, data-first methodology. We commit to transparency, security, and a bespoke service model that aligns our success directly with yours.')
            )
        )
    );
}

export default About;
