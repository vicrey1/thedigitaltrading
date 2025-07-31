import { useState, useEffect, useRef } from 'react';

export function useIntersectionObserver(options) {
    const [isIntersecting, setIntersecting] = useState(false);
    const elementRef = useRef(null);

    useEffect(() => {
        const refCurrent = elementRef.current;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIntersecting(true);
                    observer.unobserve(entry.target);
                }
            },
            options
        );

        if (refCurrent) {
            observer.observe(refCurrent);
        }

        return () => {
            if (refCurrent) {
                observer.unobserve(refCurrent);
            }
        };
    }, [options]);

    return [elementRef, isIntersecting];
}
