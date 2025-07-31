import React, { useRef, useEffect } from 'react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver.js';
import { useMousePosition } from '../hooks/useMousePosition.js';

const e = React.createElement;

function InteractiveElement({ children, depth = 0.005, className = '' }) {
    const [elementRef, isVisible] = useIntersectionObserver({ threshold: 0.1 });
    const el = useRef(null);
    const position = useMousePosition();

    useEffect(() => {
        if (el.current) {
            const moveX = (position.x - window.innerWidth / 2) * depth;
            const moveY = (position.y - window.innerHeight / 2) * depth;
            el.current.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
        }
    }, [position, depth]);
    
    const combinedClassName = `fade-in ${isVisible ? 'visible' : ''} ${className}`;

    const setRefs = (node) => {
        el.current = node;
        elementRef.current = node;
    };

    return e('div', { ref: setRefs, className: combinedClassName, style: { transition: 'transform 0.3s ease-out, opacity 0.8s ease-out' } },
        children
    );
}

export default InteractiveElement;
