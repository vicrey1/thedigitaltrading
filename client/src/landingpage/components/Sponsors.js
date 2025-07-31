import React from 'react';
const e = React.createElement;

function Sponsors() {
    return e('section', { className: 'py-12 bg-brand-dark/50' },
        e('div', { className: 'container mx-auto px-6' },
            e('p', { className: 'text-center text-brand-light/60 mb-6 italic text-sm' }, 'Recognized for innovation and performance by leading financial authorities.'),
            e('div', { className: 'flex justify-center items-center gap-8 md:gap-12 flex-wrap opacity-60 text-brand-light/80' },
                e('span', { className: 'font-serif text-lg tracking-wider' }, "Barron's"),
                e('span', { className: 'font-serif text-xl tracking-wider uppercase' }, 'The Wall Street Journal'),
                e('span', { className: 'font-serif text-lg tracking-wider' }, 'Global Finance Review'),
                e('span', { className: 'font-serif text-lg tracking-wider' }, 'Alpha Intel Quarterly'),
                e('span', { className: 'font-serif text-2xl font-bold tracking-wider' }, 'Forbes')
            )
        )
    );
}

export default Sponsors;
