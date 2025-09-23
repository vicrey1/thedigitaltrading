import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import InteractiveElement from './InteractiveElement.js';

const e = React.createElement;

const faqData = [
    {
        question: 'How is THE DIGITAL TRADING different?',
        answer: 'We emphasize disciplined research, risk-first processes, and transparent reporting—no hype, no guarantees.',
    },
    {
        question: 'What if I\'ve been burned by agencies before?',
        answer: 'Our research and tooling can support different operating contexts. We focus on clarity, robust controls, and process. We do not make revenue promises or guarantees.',
    },
    {
        question: 'How quickly will I see results?',
        answer: 'Outcomes vary. We do not promise results or performance. We focus on process quality, documentation, and clarity so you can make informed decisions.',
    },
    {
        question: 'What are the eligibility requirements?',
        answer: 'Eligibility and minimums vary by product, jurisdiction, and risk tolerance. We onboard organizations prepared to implement disciplined processes. Please review program terms for details.',
    },
    {
        question: 'Do you work with my industry?',
        answer: 'We support a range of industries. Applicability depends on your objectives, constraints, and controls. We do not make performance claims—reach out to discuss your specific use case.',
    }
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
