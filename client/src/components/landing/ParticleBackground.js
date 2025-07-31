import React, { useRef, useEffect } from 'react';

const ParticleBackground = () => {
  const canvasRef = useRef(null);
  const particles = useRef([]);
  const mouse = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // Create tiny particles
    const numParticles = 80;
    particles.current = Array.from({ length: numParticles }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      r: Math.random() * 1.2 + 0.5,
      color: 'rgba(255,255,255,0.12)'
    }));

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (let p of particles.current) {
        // Move slightly toward mouse (less sensitive)
        const dx = mouse.current.x - p.x;
        const dy = mouse.current.y - p.y;
        p.vx += dx * 0.00001; // reduced sensitivity
        p.vy += dy * 0.00001;
        p.x += p.vx;
        p.y += p.vy;
        // Wrap around
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
        // Draw with local brightness if mouse is near
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 2 * Math.PI);
        // If mouse is close, brighten up
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 80) {
          ctx.fillStyle = 'rgba(255,255,180,0.35)';
          ctx.shadowColor = '#FFD700';
          ctx.shadowBlur = 18;
        } else {
          ctx.fillStyle = p.color;
          ctx.shadowColor = '#FFD70044';
          ctx.shadowBlur = 6;
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      animationFrameId = requestAnimationFrame(draw);
    };
    draw();
    // Mouse move
    const handleMouseMove = (e) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);
    // Resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ position: 'fixed', top: 0, left: 0, zIndex: 0 }}
    />
  );
};

export default ParticleBackground;
