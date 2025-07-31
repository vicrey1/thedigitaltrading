import React, { useState } from 'react';
import { ChevronDown } from 'https://esm.sh/lucide-react@0.381.0';
import InteractiveElement from './InteractiveElement.js';

const e = React.createElement;

const faqData = [
    {
        question: 'What is the minimum investment?',
        answer: 'The minimum investment is detailed during the account creation process. Create your account to view strategy-specific investment tiers.'
    },
    {
        question: 'How is LUXYIELD regulated?',
        answer: 'LUXYIELD Capital is a Registered Investment Adviser with the U.S. Securities and Exchange Commission (SEC). We adhere to the highest standards of fiduciary duty and regulatory compliance.'
    },
    {
        question: 'What are your fees?',
        answer: 'We operate on a transparent, performance-based fee structure that aligns our interests with yours. A detailed fee schedule is provided and discussed during the onboarding process.'
    },
    {
        question: 'How do I access my performance reports?',
        answer: 'Clients have 24/7 access to our secure online portal, which provides real-time performance data, detailed portfolio analysis, market commentary, and historical statements.'
    },
];

const FaqItem = ({ question, answer, isActive, onClick }) => {
    return e('div', { className: `faq-item glass-card ${isActive ? 'active' : ''}` },
        e('button', { className: 'faq-question w-full flex justify-between items-center text-left p-6', onClick },
            e('span', { className: 'text-lg font-semibold text-brand-light' }, question),
            e(ChevronDown, { className: 'faq-icon text-brand-accent flex-shrink-0' })
        ),
        e('div', { className: 'faq-answer px-6' },
            e('p', { className: 'text-brand-light/80' }, answer)
        )
    );
};

function Faq() {
    const [activeIndex, setActiveIndex] = useState(null);

    const handleItemClick = (index) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

    return e('section', { id: 'faq', className: 'py-20 md:py-32' },
        e('div', { className: 'container mx-auto px-6 max-w-4xl' },
            e(InteractiveElement, { depth: 0.003 },
                 e('h2', { className: 'text-center text-4xl md:text-5xl font-serif text-brand-light mb-16' }, 'Frequently Asked Questions')
            ),
             e(InteractiveElement, { depth: 0.003 },
                 e('div', { className: 'space-y-4' },
                    ...faqData.map((item, index) =>
                        e(FaqItem, {
                            key: index,
                            question: item.question,
                            answer: item.answer,
                            isActive: activeIndex === index,
                            onClick: () => handleItemClick(index)
                        })
                    )
                 )
             )
        )
    );
}

export default Faq;
