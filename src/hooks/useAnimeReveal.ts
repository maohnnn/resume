import { useEffect } from "react";

type AnimeFn = (params: Record<string, unknown>) => unknown;

type AnimParams = Record<string, unknown> & { delay?: number };

/**
 * Apply scroll-based reveal animations using anime.js.
 * Adds IntersectionObserver on elements with `.reveal` class (inside rootEl if provided).
 * Direction can be customized via data-anim="up|down|left|right|fade".
 * Optional stagger via data-stagger-group attribute on a container.
 */
export default function useAnimeReveal(rootEl?: HTMLElement | null) {
  useEffect(() => {
    let canceled = false;
    let io: IntersectionObserver | null = null;

    const init = async () => {
      // Load anime.js v4
      let anime: AnimeFn | undefined;
      try {
        const mod = (await import("animejs")) as unknown as { default?: AnimeFn } | AnimeFn;
        anime = (typeof mod === "function" ? (mod as unknown as AnimeFn) : (mod as { default?: AnimeFn }).default) as AnimeFn;
      } catch {
        anime = undefined;
      }
      if (canceled || !anime) return;

      // Reduced motion: just reveal immediately
      const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const opts: IntersectionObserverInit = { root: null, rootMargin: "0px 0px -10% 0px", threshold: 0.05 };
      io = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          io?.unobserve(el);

          // compute direction offsets
          const dir = (el.dataset.anim || "up").toLowerCase();
          const dist = 24; // px
          const base: AnimParams = {
            targets: el,
            opacity: [0, 1],
            easing: "easeOutQuad",
            duration: 700,
          };
          if (dir === "up") base.translateY = [dist, 0];
          else if (dir === "down") base.translateY = [-dist, 0];
          else if (dir === "left") base.translateX = [dist, 0];
          else if (dir === "right") base.translateX = [-dist, 0];

          // stagger within a group
          const parent = el.closest('[data-stagger-group]') as HTMLElement | null;
          if (parent) {
            const siblings = Array.from(parent.querySelectorAll<HTMLElement>('.reveal'));
            const idx = Math.max(0, siblings.indexOf(el));
            base.delay = 50 * idx;
          }

          if (reduce) {
            el.style.opacity = '1';
            el.style.transform = 'none';
            continue;
          }

          anime(base as unknown as Record<string, unknown>);
        }
      }, opts);

      const scope = rootEl || document.body;
      const nodes = Array.from(scope.querySelectorAll<HTMLElement>('.reveal'));
      nodes.forEach((n) => io?.observe(n));
    };

    init();

    return () => {
      canceled = true;
      io?.disconnect();
    };
  }, [rootEl]);
}
