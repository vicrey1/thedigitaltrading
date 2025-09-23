import React from 'react';
import PageShell from '../components/PageShell';
import { useTheme } from '../contexts/ThemeContext';

const e = React.createElement;

const values = [
    { name: 'Excellence', description: "We maintain the highest standards in everything we do, from strategic planning to campaign execution. Our commitment to excellence ensures that every project delivers exceptional results that exceed expectations." },
    { name: 'Innovation', description: "We embrace cutting-edge technologies and methodologies to stay ahead of industry trends. Our innovative approach combines proven strategies with emerging technologies to create competitive advantages for our clients." },
    { name: 'Integrity', description: "We build trust through transparent communication, honest reporting, and ethical business practices. Our clients can rely on us for straightforward advice and clear insights into their marketing performance." },
    { name: 'Partnership', description: "We view our clients as strategic partners, working collaboratively to achieve shared goals. Our success is measured by the long-term growth and success of the businesses we serve." },
];

function AboutPage() {
    const { isDarkMode, colors } = useTheme();
    
    return e(PageShell, {
        title: 'About Us',
        imageSrc: 'https://www.dgicommunications.com/wp-content/uploads/2022/11/DGI-Communications-modern-office-design.jpg',
        imageAlt: 'Modern high-tech office interior'
    },
        e('div', { className: 'max-w-4xl mx-auto' },
            e('h2', { className: `text-4xl md:text-5xl font-serif text-center mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}` }, 'Strategic Digital Excellence'),
            e('p', { className: `leading-relaxed text-center mb-12 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}` }, "THE DIGITAL TRADING was founded to develop disciplined, research-led digital asset capabilities. We emphasize transparency, robust controls, and thorough documentation—no hype, no guarantees."),
            e('div', { className: 'grid md:grid-cols-2 gap-12 items-center mb-20' },
                e('div', {},
                    e('h3', { className: `text-3xl font-serif mb-4 ${isDarkMode ? 'text-crypto-orange' : 'text-crypto-orange-dark'}` }, 'Our Mission'),
                    e('p', { className: `leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}` }, "To empower businesses with sophisticated digital marketing strategies that drive sustainable growth through innovative technology, strategic insights, and data-driven decision making. We're committed to delivering measurable results that align with our clients' long-term business objectives.")
                ),
                e('div', {},
                    e('h3', { className: `text-3xl font-serif mb-4 ${isDarkMode ? 'text-crypto-orange' : 'text-crypto-orange-dark'}` }, 'Our Vision'),
                    e('p', { className: `leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}` }, "To be the premier strategic partner for businesses seeking digital transformation, recognized for our innovative approach, exceptional results, and commitment to long-term client success in an ever-evolving digital landscape.")
                )
            ),
            e('h2', { className: `text-4xl md:text-5xl font-serif text-center mb-12 ${isDarkMode ? 'text-white' : 'text-gray-900'}` }, 'Our Core Values'),
            e('div', { className: 'grid md:grid-cols-2 gap-8' },
                ...values.map(value => e('div', { key: value.name, className: `p-6 rounded-lg border transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}` },
                    e('h4', { className: `text-2xl font-serif mb-3 ${isDarkMode ? 'text-crypto-orange' : 'text-crypto-orange-dark'}` }, value.name),
                    e('p', { className: `${isDarkMode ? 'text-gray-300' : 'text-gray-600'}` }, value.description)
                ))
            ),
            // Legal section with address
            e('div', { className: 'mt-16' },
                e('h3', { className: `text-2xl font-serif mb-4 ${isDarkMode ? 'text-crypto-orange' : 'text-crypto-orange-dark'}` }, 'Legal'),
                e('p', { className: `${isDarkMode ? 'text-gray-300' : 'text-gray-600'}` }, 'Office Address: Feldstrasse 20, 8004 Zürich, Switzerland')
            ),
            // Partnership section with address and Google Map
            e('div', { className: 'mt-16' },
                e('h3', { className: `text-2xl font-serif mb-4 ${isDarkMode ? 'text-crypto-orange' : 'text-crypto-orange-dark'}` }, 'Partnership'),
                e('p', { className: `mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}` }, 'We view our clients as partners. Our success is inextricably linked to theirs, and we cultivate deep, long-term relationships built on mutual respect and shared objectives.'),
                e('div', { className: `mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}` },
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
