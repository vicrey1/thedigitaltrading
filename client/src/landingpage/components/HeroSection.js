import React from 'react';
import InteractiveElement from "./InteractiveElement.js";

const e = React.createElement;

function HeroSection() {
    return e('section', { className: 'min-h-screen flex items-center justify-center relative overflow-hidden', id: 'hero' },
        e('video', { autoPlay: true, loop: true, muted: true, playsInline: true, className: 'absolute inset-0 w-full h-full object-cover z-0' },
            e('source', { src: 'https://videos.pexels.com/video-files/3209828/3209828-hd_1920_1080_25fps.mp4', type: 'video/mp4' }),
            'Your browser does not support the video tag.'
        ),
        e('div', { className: 'absolute inset-0 bg-brand-dark/80' }),
        e('div', { className: 'container mx-auto px-6 text-center relative z-10' },
            e(InteractiveElement, { depth: 0.003 },
                e('h1', { className: 'text-5xl md:text-7xl font-serif font-bold text-brand-light leading-tight mb-4' },
                    'Architects of Wealth.', e('br'), 'Engineers of Growth.'
                ),
                e('p', { className: 'max-w-3xl mx-auto text-lg md:text-xl text-brand-light/80 mb-8' }, 'LUXYIELD leverages proprietary artificial intelligence and deep market intelligence to construct resilient, high-performance portfolios for the discerning investor.'),
                e('a', { href: 'https://www.luxyield.com/register', className: 'inline-block bg-brand-accent text-brand-dark px-8 py-4 rounded-md font-bold hover:bg-yellow-300/80 transition-all duration-300 transform hover:scale-105' }, 'Create Account & Invest')
            )
        )
    );
}

export default HeroSection;
