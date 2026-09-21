import React, { useEffect, useRef } from 'react';

/**
 * CyberBackground - Living Cyberpunk Particle & Constellation Canvas
 * Provides depth, subtle motion, and high-tech ambience to the entire portal.
 */
const CyberBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = null;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Mouse tracker for interactive depth
    const mouse = { x: -1000, y: -1000, radius: 140 };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initParticles();
    };

    window.addEventListener('resize', handleResize, { passive: true });

    // Soft ambient starry particles
    const particleColors = [
      'rgba(56, 189, 248, ',   // Soft Sky Blue
      'rgba(129, 140, 248, ',  // Soft Indigo
      'rgba(148, 163, 184, ',  // Cool Slate
      'rgba(99, 102, 241, '    // Deep Iris
    ];

    let particles = [];
    const PARTICLE_COUNT = Math.min(55, Math.floor((width * height) / 22000));

    function initParticles() {
      particles = [];
      const count = Math.min(55, Math.floor((width * height) / 22000));
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.45,
          vy: (Math.random() - 0.5) * 0.45,
          radius: Math.random() * 1.8 + 0.8,
          baseAlpha: Math.random() * 0.45 + 0.25,
          colorBase: particleColors[Math.floor(Math.random() * particleColors.length)],
          pulseSpeed: Math.random() * 0.02 + 0.01,
          pulseAngle: Math.random() * Math.PI * 2
        });
      }
    }

    initParticles();

    // Draw single frame
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Subtle cyber grid scan / vignette
      const len = particles.length;

      // Update & Draw Nodes
      for (let i = 0; i < len; i++) {
        const p = particles[i];

        if (!prefersReducedMotion) {
          p.x += p.vx;
          p.y += p.vy;
          p.pulseAngle += p.pulseSpeed;

          // Wrap around edges
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;
          if (p.y < -10) p.y = height + 10;
          if (p.y > height + 10) p.y = -10;

          // Mouse push/attract interaction
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius && dist > 0) {
            const force = (mouse.radius - dist) / mouse.radius;
            p.x -= (dx / dist) * force * 1.2;
            p.y -= (dy / dist) * force * 1.2;
          }
        }

        const currentAlpha = p.baseAlpha * 0.7 + Math.sin(p.pulseAngle) * 0.08;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.colorBase}${Math.max(0.08, currentAlpha)})`;
        ctx.fill();

        // Draw subtle connections to nearby nodes
        for (let j = i + 1; j < len; j++) {
          const p2 = particles[j];
          const cdx = p.x - p2.x;
          const cdy = p.y - p2.y;
          const cdist = Math.sqrt(cdx * cdx + cdy * cdy);

          if (cdist < 95) {
            const lineAlpha = (1 - cdist / 95) * 0.08;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(148, 163, 184, ${lineAlpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      if (!prefersReducedMotion) {
        animId = requestAnimationFrame(render);
      }
    };

    render();

    // Pause animation when tab is not visible to save CPU/battery
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (animId) cancelAnimationFrame(animId);
      } else {
        if (!prefersReducedMotion) {
          animId = requestAnimationFrame(render);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="cyber-ambient-canvas"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.35
      }}
      aria-hidden="true"
    />
  );
};

export default CyberBackground;
