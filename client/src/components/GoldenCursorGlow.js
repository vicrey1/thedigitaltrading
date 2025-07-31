import React, { useEffect, useRef } from 'react';

const GoldenCursorGlow = () => {
  const glowRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (glowRef.current) {
        glowRef.current.style.left = `${e.clientX - 40}px`;
        glowRef.current.style.top = `${e.clientY - 40}px`;
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div
      ref={glowRef}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: 80,
        height: 80,
        pointerEvents: 'none',
        zIndex: 1000,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,215,0,0.18) 0%, rgba(255,215,0,0.08) 60%, rgba(255,215,0,0) 100%)',
        boxShadow: '0 0 32px 8px rgba(255,215,0,0.10)',
        transition: 'opacity 0.2s',
        opacity: 0.85,
        mixBlendMode: 'lighten',
      }}
    />
  );
};

export default GoldenCursorGlow;
