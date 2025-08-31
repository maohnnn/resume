import { useEffect } from "react";
import type { MediaQueryListLegacy } from "../types";

// Simple particles background animation (dark theme friendly)
export default function useParticles(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let cssW = 0, cssH = 0, dpr = 1;
    const resize = () => {
      dpr = Math.max(1, window.devicePixelRatio || 1);
      cssW = window.innerWidth; cssH = window.innerHeight;
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      canvas.style.width = cssW + "px";
      canvas.style.height = cssH + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    type Particle = { x: number; y: number; vx: number; vy: number; r: number; };
    let particles: Particle[] = [];
    const initParticles = () => {
      const count = Math.floor((cssW * cssH) / 28000); // adaptive density
      particles = new Array(Math.max(24, count)).fill(0).map(() => ({
        x: Math.random() * cssW,
        y: Math.random() * cssH,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: 1 + Math.random() * 1.5,
      }));
    };
    initParticles();

    let raf = 0;
    let running = false;

    const draw = () => {
      if (!running) return;
      ctx.clearRect(0, 0, cssW, cssH);

      // subtle vignette gradient
      const g = ctx.createRadialGradient(cssW * 0.5, cssH * 0.5, 0, cssW * 0.5, cssH * 0.5, Math.max(cssW, cssH) * 0.7);
      g.addColorStop(0, "rgba(18,18,18,0.6)");
      g.addColorStop(1, "rgba(0,0,0,0.9)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, cssW, cssH);

      // draw links
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x, dy = p.y - q.y;
          const dist2 = dx * dx + dy * dy;
          if (dist2 < 120 * 120) {
            const a = 1 - Math.sqrt(dist2) / 120;
            ctx.strokeStyle = `rgba(127,255,212,${a * 0.25})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
      }

      // draw particles
      for (const p of particles) {
        ctx.fillStyle = "#7fffd4";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();

        p.x += p.vx; p.y += p.vy;
        if (p.x < -10) p.x = cssW + 10; else if (p.x > cssW + 10) p.x = -10;
        if (p.y < -10) p.y = cssH + 10; else if (p.y > cssH + 10) p.y = -10;
      }

      raf = requestAnimationFrame(draw);
    };

    const start = () => { if (!running) { running = true; raf = requestAnimationFrame(draw); } };
    const stop = () => { if (running) { running = false; cancelAnimationFrame(raf); } };

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduceMotion = mq.matches;
    const onMqChange = (e: MediaQueryListEvent) => {
      reduceMotion = e.matches;
      if (reduceMotion) stop(); else start();
    };

    const mqlLegacy = mq as MediaQueryListLegacy;
    if (mqlLegacy.addEventListener) mqlLegacy.addEventListener("change", onMqChange);
    else if (mqlLegacy.addListener) mqlLegacy.addListener(onMqChange);

    const onResize = () => { resize(); initParticles(); if (!reduceMotion) start(); };
    window.addEventListener("resize", onResize);
    const onBlur = () => stop();
    const onFocus = () => { if (!reduceMotion) start(); };
    const onVisibility = () => { if (document.hidden) stop(); else if (!reduceMotion) start(); };
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    if (reduceMotion) {
      // draw one static frame
      ctx.fillStyle = "#0c0c0c"; ctx.fillRect(0, 0, cssW, cssH);
      for (const p of particles) {
        ctx.fillStyle = "#233";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      start();
    }

    return () => {
      stop();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      if (mqlLegacy.removeEventListener) mqlLegacy.removeEventListener("change", onMqChange);
      else if (mqlLegacy.removeListener) mqlLegacy.removeListener(onMqChange);
    };
  }, [canvasRef]);
}

