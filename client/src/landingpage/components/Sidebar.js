import React from 'react';
import { X } from 'lucide-react';

const e = React.createElement;

const sidebarLinks = [
    { href: '#about', label: 'About' },
    { href: '#aura', label: 'AURA Intelligence' },
    { href: '#philosophy', label: 'Philosophy' },
    { href: '#advanced-features', label: 'Advanced Features' },
    { href: '#how-it-works', label: 'How It Works' },
    { href: '#faq', label: 'FAQ' },
    { href: '#footer', label: 'Contact' },
];

function Sidebar({ isOpen, onClose }) {
    const navItems = sidebarLinks.map(link => 
        e('a', { key: link.href, href: link.href, className: 'sidebar-link hover:text-brand-accent transition-colors duration-300 py-2 px-2 rounded min-h-[44px] flex items-center text-brand-light', onClick: onClose }, link.label)
    );

    return e('aside', { id: 'sidebar', className: `fixed top-0 right-0 h-full w-72 sm:w-80 bg-brand-dark/95 backdrop-blur-md shadow-2xl z-50 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0 pointer-events-auto opacity-100' : 'translate-x-full pointer-events-none opacity-0'}` },
        e('div', { className: 'p-4 sm:p-6 flex flex-col h-full' },
            e('div', { className: 'flex justify-between items-center mb-8 sm:mb-12 border-b border-brand-accent/20 pb-4' },
                e('span', { className: 'text-lg sm:text-xl font-serif font-bold text-brand-accent' }, 'MENU'),
                e('button', { id: 'sidebar-close', className: 'text-brand-light hover:text-brand-accent p-2 min-h-[44px] min-w-[44px] flex items-center justify-center', onClick: onClose },
                    e(X, { className: 'h-6 w-6' })
                )
            ),
            e('nav', { className: 'flex flex-col space-y-3 sm:space-y-6 text-base sm:text-lg flex-1' }, ...navItems),
            e('a', { href: '/login', className: 'mt-auto w-full text-center text-brand-accent border border-brand-accent/50 px-4 py-3 rounded-md hover:bg-brand-accent hover:text-brand-dark transition-all duration-300 min-h-[44px] flex items-center justify-center text-sm sm:text-base' }, 'Client Login')
        )
    );
}

export default Sidebar;
