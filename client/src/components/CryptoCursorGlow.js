import React, { useEffect, useState } from 'react';

const CryptoCursorGlow = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateMousePosition = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    document.addEventListener('mousemove', updateMousePosition);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', updateMousePosition);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div
      className={`fixed pointer-events-none z-50 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        left: mousePosition.x - 25,
        top: mousePosition.y - 25,
        width: '50px',
        height: '50px',
        background: 'radial-gradient(circle, rgba(249, 115, 22, 0.3) 0%, rgba(34, 197, 94, 0.2) 50%, rgba(59, 130, 246, 0.1) 100%)',
        borderRadius: '50%',
        filter: 'blur(8px)',
        transform: 'scale(1.5)',
      }}
    />
  );
};

export default CryptoCursorGlow;