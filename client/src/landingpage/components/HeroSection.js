import React from 'react';
import InteractiveElement from "./InteractiveElement.js";

const e = React.createElement;

function HeroSection() {
    return e('section', { className: 'min-h-screen flex items-center justify-center relative overflow-hidden', id: 'hero' },
        e('video', { autoPlay: true, loop: true, muted: true, playsInline: true, className: 'absolute inset-0 w-full h-full object-cover z-0' },
            e('source', { src: 'https://videos.pexels.com/video-files/3130284/3130284-uhd_2560_1440_30fps.mp4', type: 'video/mp4' }),
            'Your browser does not support the video tag.'
        ),
        e('div', { className: 'absolute inset-0 bg-brand-dark/80' }),
        e('div', { className: 'container mx-auto px-6 text-center relative z-10' },
            e(InteractiveElement, { depth: 0.003 },
                e('h1', { className: 'text-5xl md:text-7xl font-serif font-bold text-white leading-tight mb-4' },
                    'Transform Your Crypto', e('br'), 'Institutional-Grade Digital Asset Strategies.'
                ),
                e('p', { className: 'max-w-3xl mx-auto text-lg md:text-xl text-gray-300 mb-8' }, 'We build disciplined, risk-first processes for digital assets with transparent reporting and robust controls—no hype, no guarantees.'),
                e('a', { href: '/register', className: 'inline-block bg-orange-500 text-white px-8 py-4 rounded-md font-bold hover:bg-orange-600 transition-all duration-300 transform hover:scale-105' }, 'Create Account')
            )
        )
    );
}

export default HeroSection;
