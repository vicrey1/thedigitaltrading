import React, { useRef, useEffect } from 'react';
import { useMousePosition } from '../hooks/useMousePosition.js';

const e = React.createElement;

function MouseGlow() {
    const position = useMousePosition();
    const glowRef = useRef(null);

    useEffect(() => {
        const element = glowRef.current;
        if (element) {
            const x = position.x - element.offsetWidth / 2;
            const y = position.y - element.offsetHeight / 2;
            element.style.transform = `translate(${x}px, ${y}px)`;
        }
    }, [position]);

    return e('div', { id: 'mouse-glow', ref: glowRef });
}

export default MouseGlow;
