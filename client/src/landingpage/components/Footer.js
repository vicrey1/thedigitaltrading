import React from 'react';
import { Linkedin, Twitter } from 'lucide-react';

const e = React.createElement;

function Footer() {
    return e('footer', { id: 'footer', className: 'bg-black py-16' },
        e('div', { className: 'container mx-auto px-6' },
            e('div', { className: 'grid md:grid-cols-4 gap-8 text-brand-light/70' },
                e('div', null,
                    e('a', { href: '#hero', className: 'block mb-4' },
                        e('img', { src: 'https://images.stockcake.com/public/f/e/5/fe542cbf-1df2-4cb8-ae53-f967466b5d89_medium/geometric-eagle-warrior-stockcake.jpg', alt: 'THE DIGITAL TRADING Logo', className: 'h-12 w-auto' })
                    ),
                    e('p', { className: 'text-sm' }, '123 Digital Avenue', e('br'), 'New York, NY 10001'),
                    e('p', { className: 'text-sm mt-4' }, '© 2025 THE DIGITAL TRADING.', e('br'), 'All Rights Reserved.')
                ),
                e('div', null,
                    e('h3', { className: 'text-lg font-serif text-brand-accent mb-4' }, 'Navigation'),
                    e('ul', { className: 'space-y-2 text-sm' },
                        e('li', null, e('a', { href: '#about', className: 'hover:text-brand-light' }, 'About')),
                        e('li', null, e('a', { href: '#services', className: 'hover:text-brand-light' }, 'Our Services')),
                        e('li', null, e('a', { href: '#portfolio', className: 'hover:text-brand-light' }, 'Portfolio')),
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
                    e('p', { className: 'text-sm mb-2' }, e('a', { href: 'mailto:hello@thedigitaltrading.com', className: 'hover:text-brand-light' }, 'hello@thedigitaltrading.com')),
                    e('p', { className: 'text-sm mb-4' }, e('a', { href: 'tel:+12125550199', className: 'hover:text-brand-light' }, '+1 (212) 555-0199')),
                    e('div', { className: 'flex space-x-4' },
                        e('a', { href: 'https://www.linkedin.com/company/thedigitaltrading', className: 'text-brand-light/70 hover:text-brand-accent' }, e(Linkedin, { className: 'h-5 w-5' })),
                        e('a', { href: 'https://twitter.com/thedigitaltrading', className: 'text-brand-light/70 hover:text-brand-accent' }, e(Twitter, { className: 'h-5 w-5' }))
                    )
                )
            ),
            e('div', { className: 'mt-8 text-xs text-brand-light/60' },
                'THE DIGITAL TRADING is a digital asset research & technology company. Information is educational only and not advice. Past performance is not indicative of future results. No guarantees.'
            )
        )
    );
}

export default Footer;
