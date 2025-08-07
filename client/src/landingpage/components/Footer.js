import React from 'react';
import { Linkedin, Twitter } from 'https://esm.sh/lucide-react@0.381.0';

const e = React.createElement;

function Footer() {
    return e('footer', { id: 'footer', className: 'bg-black py-16' },
        e('div', { className: 'container mx-auto px-6' },
            e('div', { className: 'grid md:grid-cols-4 gap-8 text-brand-light/70' },
                e('div', null,
                    e('a', { href: '#hero', className: 'block mb-4' },
                        e('img', { src: 'https://images.stockcake.com/public/f/e/5/fe542cbf-1df2-4cb8-ae53-f967466b5d89_medium/geometric-eagle-warrior-stockcake.jpg', alt: 'Luxyield Logo', className: 'h-12 w-auto' })
                    ),
                    e('p', { className: 'text-sm' }, 'Feldstrasse 20', e('br'), '8004 Zürich, Switzerland'),
                    e('p', { className: 'text-sm mt-4' }, '© 2025 LUXYIELD Capital.', e('br'), 'All Rights Reserved.')
                ),
                e('div', null,
                    e('h3', { className: 'text-lg font-serif text-brand-accent mb-4' }, 'Navigation'),
                    e('ul', { className: 'space-y-2 text-sm' },
                        e('li', null, e('a', { href: '#about', className: 'hover:text-brand-light' }, 'About')),
                        e('li', null, e('a', { href: '#aura', className: 'hover:text-brand-light' }, 'AURA Intelligence')),
                        e('li', null, e('a', { href: '#philosophy', className: 'hover:text-brand-light' }, 'Investment Philosophy')),
                        e('li', null, e('a', { href: '#faq', className: 'hover:text-brand-light' }, 'FAQ'))
                    )
                ),
                e('div', null,
                    e('h3', { className: 'text-lg font-serif text-brand-accent mb-4' }, 'Legal'),
                    e('ul', { className: 'space-y-2 text-sm' },
                        e('li', null, e('a', { href: '/about', className: 'hover:text-brand-light' }, 'About')),
                        e('li', null, e('a', { href: '/legal', className: 'hover:text-brand-light' }, 'Legal Disclaimer')),
                        e('li', null, e('a', { href: '/legal#privacy', className: 'hover:text-brand-light' }, 'Privacy Policy')),
                        e('li', null, e('a', { href: '/legal#terms', className: 'hover:text-brand-light' }, 'Terms of Service'))
                    )
                ),
                e('div', null,
                    e('h3', { className: 'text-lg font-serif text-brand-accent mb-4' }, 'Connect'),
                    e('p', { className: 'text-sm mb-2' }, e('a', { href: 'mailto:info@luxyield.com', className: 'hover:text-brand-light' }, 'info@luxyield.com')),
                    e('p', { className: 'text-sm mb-4' }, e('a', { href: 'tel:+12125550182', className: 'hover:text-brand-light' }, '+1 (212) 555-0182')),
                    e('div', { className: 'flex space-x-4' },
                        e('a', { href: 'https://www.linkedin.com/company/luxyield', className: 'text-brand-light/70 hover:text-brand-accent' }, e(Linkedin, { className: 'h-5 w-5' })),
                        e('a', { href: 'https://twitter.com/luxyield', className: 'text-brand-light/70 hover:text-brand-accent' }, e(Twitter, { className: 'h-5 w-5' }))
                    )
                )
            )
        )
    );
}

export default Footer;
