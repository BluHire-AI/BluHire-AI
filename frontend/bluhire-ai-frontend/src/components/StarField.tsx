'use client';

import React, { useEffect, useRef } from "react";

interface Props {
  dark: boolean;
}

export default function StarField({ dark }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    /* ── sizing ── */
    let W = 0, H = 0;
    const resize = () => {
      if (!canvas) return;
      W = canvas.width  = canvas.offsetWidth || window.innerWidth;
      H = canvas.height = canvas.offsetHeight || window.innerHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    /* ── node setup ── */
    const COUNT   = 90;
    const CONNECT = 140;   // px — max distance to draw a line

    interface Node {
      x: number; y: number;
      vx: number; vy: number;
      r: number;
      phase: number;   // for glow pulse offset
    }

    const nodes: Node[] = Array.from({ length: COUNT }, () => ({
      x: Math.random() * (W || window.innerWidth),
      y: Math.random() * (H || window.innerHeight),
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r:  Math.random() * 1.5 + 0.8,
      phase: Math.random() * Math.PI * 2,
    }));

    /* ── draw ── */
    let t = 0;
    const draw = () => {
      t += 0.008;
      ctx.clearRect(0, 0, W, H);

      /* colour palette based on theme */
      const nodeColor  = dark ? "rgba(160,140,255," : "rgba(109,95,250,";
      const lineColor  = dark ? "rgba(130,110,255," : "rgba(109,95,250,";
      const glowColor  = dark ? "rgba(180,160,255," : "rgba(167,139,250,";

      /* update positions */
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0) n.x = W;
        if (n.x > W) n.x = 0;
        if (n.y < 0) n.y = H;
        if (n.y > H) n.y = 0;
      }

      /* draw connections */
      for (let i = 0; i < COUNT; i++) {
        for (let j = i + 1; j < COUNT; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > CONNECT) continue;

          const alpha = (1 - dist / CONNECT) * (dark ? 0.35 : 0.22);
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = lineColor + alpha + ")";
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }

      /* draw nodes */
      for (const n of nodes) {
        const pulse = 0.5 + 0.5 * Math.sin(t * 1.8 + n.phase);
        const alpha  = dark ? 0.5 + 0.45 * pulse : 0.35 + 0.3 * pulse;
        const gAlpha = dark ? 0.18 * pulse : 0.10 * pulse;

        /* outer glow */
        const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 6);
        grd.addColorStop(0, glowColor + gAlpha + ")");
        grd.addColorStop(1, glowColor + "0)");
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 6, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        /* core dot */
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = nodeColor + alpha + ")";
        ctx.fill();
      }

      /* shooting stars — rare streaks */
      if (Math.sin(t * 0.3) > 0.97) {
        const sx = Math.random() * W;
        const sy = Math.random() * H * 0.4;
        const len = 80 + Math.random() * 60;
        const sg = ctx.createLinearGradient(sx, sy, sx + len, sy + len * 0.4);
        sg.addColorStop(0, dark ? "rgba(200,180,255,0)" : "rgba(109,95,250,0)");
        sg.addColorStop(0.4, dark ? "rgba(200,180,255,0.7)" : "rgba(109,95,250,0.5)");
        sg.addColorStop(1, dark ? "rgba(200,180,255,0)" : "rgba(109,95,250,0)");
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + len, sy + len * 0.4);
        ctx.strokeStyle = sg;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
    };
  }, [dark]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  );
}
