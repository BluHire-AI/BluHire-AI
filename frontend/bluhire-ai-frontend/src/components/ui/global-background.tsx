'use client';

import React, { useEffect, useRef } from 'react';

export function GlobalBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Re-size listener
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Define particle properties
    interface Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      twinkleSpeed: number;
    }

    const particles: Particle[] = [];
    const particleCount = 45; // Subtle, low density

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.5 + 0.5,
        speedX: (Math.random() - 0.5) * 0.15,
        speedY: (Math.random() - 0.5) * 0.15,
        opacity: Math.random() * 0.4 + 0.1,
        twinkleSpeed: Math.random() * 0.01 + 0.002,
      });
    }

    // Drifting glow coordinates
    let glowX = width / 2;
    let glowY = height / 3;
    let glowTargetX = width / 2;
    let glowTargetY = height / 3;

    // Drifting radial glow destination logic
    const driftGlow = () => {
      glowTargetX = width / 2 + (Math.random() - 0.5) * 200;
      glowTargetY = height / 3 + (Math.random() - 0.5) * 150;
    };
    const glowInterval = setInterval(driftGlow, 4000);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw drifting radial background glows
      // Lerp glow position
      glowX += (glowTargetX - glowX) * 0.01;
      glowY += (glowTargetY - glowY) * 0.01;

      const gradient = ctx.createRadialGradient(glowX, glowY, 50, glowX, glowY, Math.max(width, height) * 0.6);
      gradient.addColorStop(0, 'rgba(139, 92, 246, 0.04)'); // Purple glow center
      gradient.addColorStop(0.5, 'rgba(79, 70, 229, 0.02)');  // Indigo mid-glow
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');          // Outer space
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // 2. Draw drifting particles & twinkling stars
      particles.forEach((p) => {
        // Drifting movement
        p.x += p.speedX;
        p.y += p.speedY;

        // Wrap around boundaries
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Twinkling opacity fluctuation
        p.opacity += p.twinkleSpeed;
        if (p.opacity > 0.65 || p.opacity < 0.08) {
          p.twinkleSpeed = -p.twinkleSpeed;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        ctx.shadowBlur = p.size > 1.2 ? 4 : 0;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(glowInterval);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
