import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';

const e = React.createElement;

const navLinks = [
    { href: '#hero', label: 'Home' },
    { href: '#about', label: 'About' },
    { href: '#aura', label: 'AURA Intelligence' },
    { href: '#philosophy', label: 'Philosophy' },
    { href: '#faq', label: 'FAQ' },
];

function Header({ onMenuClick }) {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navItems = navLinks.map(link => 
        e('a', { key: link.href, href: link.href, className: 'hover:text-brand-accent transition-colors duration-300' }, link.label)
    );

    return e('header', { id: 'header', className: `fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'scrolled' : ''}` },
        e('div', { className: 'container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center' },
            e('a', { href: '#hero', className: 'block' },
                e('img', {
                  src: process.env.PUBLIC_URL + '/logo192.png',
                  alt: 'The Digital Trading Logo',
                  className: 'h-12 sm:h-16 w-auto drop-shadow-lg', // responsive logo size
                  style: { filter: 'drop-shadow(0 2px 8px gold)' }
                })
            ),
            e('nav', { className: 'hidden lg:flex items-center space-x-8' }, ...navItems),
            e('div', { className: 'flex items-center space-x-2 sm:space-x-4' },
                e('a', { href: '/login', className: 'hidden md:inline-block text-brand-accent border border-brand-accent/50 px-3 sm:px-4 py-2 rounded-md hover:bg-brand-accent hover:text-brand-dark transition-all duration-300 text-xs sm:text-sm min-h-[44px] flex items-center justify-center' }, 'Client Login'),
                e('button', { id: 'sidebar-open', className: 'md:hidden text-brand-light hover:text-brand-accent p-2 min-h-[44px] min-w-[44px] flex items-center justify-center', onClick: onMenuClick },
                    e(Menu, { className: 'h-6 w-6' })
                )
            )
        )
    );
}

export default Header;
