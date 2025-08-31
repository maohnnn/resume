import { useEffect } from "react";
import { MATRIX_CHARS, MATRIX_FONT_SIZE } from "../constants/matrix";
import type { MediaQueryListLegacy } from "../types";

export const useMatrix = (canvasRef: React.RefObject<HTMLCanvasElement | null>) => {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let cssW = 0, cssH = 0;

    const resize = () => {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      cssW = window.innerWidth; cssH = window.innerHeight;
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      canvas.style.width = cssW + "px";
      canvas.style.height = cssH + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    const baseSpeed = 0.6;
    let drops: { y: number; speed: number; opacity: number }[] = [];

    const resetDrops = () => {
      const columns = Math.floor(cssW / MATRIX_FONT_SIZE);
      drops = new Array(columns).fill(0).map(() => ({
        y: Math.random() * -50,
        speed: baseSpeed + Math.random() * 0.5,
        opacity: 0.5 + Math.random() * 0.5,
      }));
    };
    resetDrops();

    let raf = 0;
    let last = performance.now();
    let running = false;

    const draw = (now: number) => {
      if (!running) return;
      const dt = Math.min(32, now - last) / 16.67;
      last = now;

      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.fillRect(0, 0, cssW, cssH);
      ctx.font = `${MATRIX_FONT_SIZE}px ui-monospace,Menlo,Consolas,monospace`;
      ctx.textBaseline = "top";

      for (let i = 0; i < drops.length; i++) {
        const text = MATRIX_CHARS[(Math.random() * MATRIX_CHARS.length) | 0];
        const x = i * MATRIX_FONT_SIZE;
        const y = drops[i].y * MATRIX_FONT_SIZE;

        ctx.fillStyle = `rgba(16,185,129,${drops[i].opacity})`;
        ctx.shadowColor = "rgba(16,185,129,0.8)";
        ctx.shadowBlur = 10;
        ctx.fillText(text, x, y);

        ctx.fillStyle = `rgba(16,185,129,${drops[i].opacity * 0.5})`;
        ctx.shadowBlur = 0;
        ctx.fillText(text, x, y - MATRIX_FONT_SIZE);

        if (y > cssH && Math.random() > 0.975) drops[i].y = 0;
        drops[i].y += drops[i].speed * dt;
      }

      raf = requestAnimationFrame(draw);
    };

    const start = () => {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(draw);
    };
    const stop = () => {
      if (!running) return;
      running = false;
      cancelAnimationFrame(raf);
    };

    const drawStatic = () => {
      ctx.clearRect(0, 0, cssW, cssH);
      ctx.font = `${MATRIX_FONT_SIZE}px ui-monospace,Menlo,Consolas,monospace`;
      ctx.textBaseline = "top";
      ctx.shadowBlur = 0;
      const columns = Math.floor(cssW / MATRIX_FONT_SIZE);
      const rows = Math.floor(cssH / MATRIX_FONT_SIZE);
      for (let i = 0; i < columns; i++) {
        const x = i * MATRIX_FONT_SIZE;
        const samples = 2 + Math.floor(Math.random() * 3);
        for (let s = 0; s < samples; s++) {
          const y = Math.floor(Math.random() * rows) * MATRIX_FONT_SIZE;
          const opacity = 0.2 + Math.random() * 0.5;
          const text = MATRIX_CHARS[(Math.random() * MATRIX_CHARS.length) | 0];
          ctx.fillStyle = `rgba(16,185,129,${opacity})`;
          ctx.fillText(text, x, y);
        }
      }
    };

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduceMotion = mq.matches;

    const onMqChange = (e: MediaQueryListEvent) => {
      reduceMotion = e.matches;
      if (reduceMotion) {
        stop();
        drawStatic();
      } else {
        resetDrops();
        start();
      }
    };

    const mqlLegacy = mq as MediaQueryListLegacy;
    if (mqlLegacy.addEventListener) mqlLegacy.addEventListener("change", onMqChange);
    else if (mqlLegacy.addListener) mqlLegacy.addListener(onMqChange);

    const onResize = () => { resize(); resetDrops(); if (reduceMotion) drawStatic(); };
    window.addEventListener("resize", onResize);

    const onBlur = () => stop();
    const onFocus = () => { if (!reduceMotion) start(); };
    const onVisibility = () => { if (document.hidden) stop(); else if (!reduceMotion) start(); };
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    if (reduceMotion) drawStatic(); else start();

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
};

export default useMatrix;

