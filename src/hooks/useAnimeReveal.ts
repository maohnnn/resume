import { useEffect } from "react";

interface AnimeLike {
  (params: Record<string, unknown>): unknown;
  setDashoffset: (el: Element) => number;
}

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
    let cleanupReset: (() => void) | null = null;
    let animeRef: AnimeLike | undefined;

    const revealAllNow = (scopeEl: HTMLElement) => {
      const nodes = Array.from(scopeEl.querySelectorAll<HTMLElement>('.reveal'));
      for (const n of nodes) {
        n.style.opacity = '1';
        n.style.transform = 'none';
        n.dataset.revealed = '1';
      }
    };

    const isFn = (v: unknown): v is (...args: unknown[]) => unknown => typeof v === 'function';

    const loadAnime = async (): Promise<AnimeLike | undefined> => {
      try {
        const mod = await import('animejs');
        const m = mod as Record<string, unknown> | undefined;
        const candidates: unknown[] = [];
        if (isFn(m)) candidates.push(m);
        const maybeDefault = m && m['default'];
        if (isFn(maybeDefault)) candidates.push(maybeDefault);
        const maybeAnime = m && m['anime'];
        if (isFn(maybeAnime)) candidates.push(maybeAnime);
        const fn = candidates.find(isFn) as ((p: Record<string, unknown>) => unknown) | undefined;
        if (!fn) return undefined;
        const sdoMod = m && (m['setDashoffset'] as unknown);
        const sdoDef = (maybeDefault as Record<string, unknown> | undefined)?.['setDashoffset'];
        const sdoFn = (fn as unknown as Record<string, unknown>)['setDashoffset'];
        const sdoCandidate = [sdoMod, sdoDef, sdoFn].find(isFn) as ((el: Element) => number) | undefined;
        const sdoFallback = (el: Element) => {
          try {
            const geom = el as unknown as { getTotalLength?: () => number };
            return typeof geom.getTotalLength === 'function' ? geom.getTotalLength() : 0;
          } catch { return 0; }
        };
        const call: AnimeLike = Object.assign(
          (params: Record<string, unknown>) => fn(params),
          { setDashoffset: sdoCandidate || sdoFallback },
        );
        return call;
      } catch {
        return undefined;
      }
    };

    const init = async () => {
      const scope = (rootEl && rootEl instanceof HTMLElement) ? rootEl : document.body;

      if (!animeRef) animeRef = await loadAnime();
      if (canceled) return;

      if (typeof window.IntersectionObserver === 'undefined') {
        revealAllNow(scope);
        return;
      }

      const computeReduce = () => {
        const prefersReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const override = document.documentElement.classList.contains('motion-ok');
        return prefersReduce && !override;
      };
      let reduce = computeReduce();
      const MAX_GROUP_DELAY = 400;
      const LETTER_STEP = 22;
      const LINE_STEP = 120;
      const WORD_STEP = 16;

      const setStyle = (el: HTMLElement, styles: Partial<CSSStyleDeclaration>) => {
        Object.assign(el.style, styles);
      };
      const tween = (el: HTMLElement, opts: { opacityFrom?: number; opacityTo?: number; translateFrom?: string; translateTo?: string; duration?: number; delay?: number; easing?: string; }) => {
        const {
          opacityFrom = 0,
          opacityTo = 1,
          translateFrom = 'translateY(0px)',
          translateTo = 'translateY(0px)',
          duration = 700,
          delay = 0,
          easing = 'cubic-bezier(0.22,1,0.36,1)'
        } = opts;
        setStyle(el, { willChange: 'transform,opacity', opacity: String(opacityFrom), transform: translateFrom, transition: 'none' });
        const start = () => {
          setStyle(el, { transition: `transform ${duration}ms ${easing}, opacity ${duration}ms ${easing}` });
          requestAnimationFrame(() => { setStyle(el, { opacity: String(opacityTo), transform: translateTo }); });
        };
        if (delay > 0) setTimeout(start, delay); else start();
      };
      const getStrokeLen = (el: SVGElement): number => {
        try {
          const anyEl = el as unknown as { getTotalLength?: () => number };
          return typeof anyEl.getTotalLength === 'function' ? anyEl.getTotalLength() : 0;
        } catch { return 0; }
      };
      const lineDrawNative = (shapes: SVGElement[], delay: number, duration = 1000, easing = 'cubic-bezier(0.2, 0.8, 0.2, 1)') => {
        shapes.forEach((s) => {
          const len = getStrokeLen(s);
          (s.style as CSSStyleDeclaration).strokeDasharray = `${len}`;
          (s.style as CSSStyleDeclaration).strokeDashoffset = `${len}`;
          (s.style as CSSStyleDeclaration).transition = 'none';
          const start = () => {
            (s.style as CSSStyleDeclaration).transition = `stroke-dashoffset ${duration}ms ${easing}`;
            requestAnimationFrame(() => { (s.style as CSSStyleDeclaration).strokeDashoffset = '0'; });
          };
          if (delay > 0) setTimeout(start, delay); else start();
        });
      };

      const animateOnce = (el: HTMLElement) => {
        if (el.dataset.revealed === '1') return;

        // group base delay
        let baseDelay = 0;
        const parent = el.closest('[data-stagger-group]') as HTMLElement | null;
        if (parent) {
          const siblings = Array.from(parent.querySelectorAll<HTMLElement>('.reveal'));
          const idx = Math.max(0, siblings.indexOf(el));
          baseDelay = Math.min(MAX_GROUP_DELAY, 50 * idx);
        }

        const anime = animeRef;
        const canAnime = !!anime && isFn(anime);

        // SVG line-draw support
        const wantsLineDraw = el.hasAttribute('data-line-draw') || el.classList.contains('line-draw');
        if (wantsLineDraw) {
          const shapes = el.matches('svg')
            ? Array.from(el.querySelectorAll<SVGElement>('path, line, polyline, polygon, circle, rect, ellipse'))
            : [el as unknown as SVGElement];

          if (reduce) {
            shapes.forEach((s) => {
              const len = getStrokeLen(s);
              (s.style as CSSStyleDeclaration).strokeDasharray = `${len}`;
              (s.style as CSSStyleDeclaration).strokeDashoffset = `0`;
            });
            el.style.opacity = '1';
            el.style.transform = 'none';
            el.dataset.revealed = '1';
            return;
          }

          if (canAnime && anime) {
            anime({ targets: shapes as unknown as Element, strokeDashoffset: [anime.setDashoffset, 0], easing: 'easeOutBack', duration: 1000, delay: baseDelay } as unknown as Record<string, unknown>);
            anime({ targets: el as unknown as Element, opacity: [0, 1], easing: 'linear', duration: 300, delay: baseDelay } as unknown as Record<string, unknown>);
          } else {
            lineDrawNative(shapes, baseDelay);
            tween(el, { opacityFrom: 0, opacityTo: 1, duration: 300, delay: baseDelay, easing: 'linear' });
          }
          el.dataset.revealed = '1';
          return;
        }

        const wantsLines = el.hasAttribute('data-lines') || el.classList.contains('lines');
        if (wantsLines) {
          // Prepare words
          if (!el.dataset.linesReady) {
            const text = el.textContent || "";
            const tokens = text.split(/(\s+)/);
            const frag = document.createDocumentFragment();
            for (const t of tokens) {
              if (/^\s+$/.test(t) || t === '') { frag.appendChild(document.createTextNode(t)); continue; }
              const span = document.createElement('span');
              span.className = 'word';
              span.textContent = t;
              (span.style as CSSStyleDeclaration).display = 'inline-block';
              (span.style as CSSStyleDeclaration).opacity = '0';
              frag.appendChild(span);
            }
            el.textContent = '';
            el.appendChild(frag);
            el.dataset.linesReady = '1';
          }

          const words = Array.from(el.querySelectorAll<HTMLElement>('.word'));
          if (reduce) {
            el.style.opacity = '1';
            el.style.transform = 'none';
            words.forEach(w => { w.style.opacity = '1'; w.style.transform = 'none'; });
            el.dataset.revealed = '1';
            return;
          }

          // Make parent visible before animating children
          el.style.opacity = '1';

          // Group words by visual line using offsetTop
          const lineMap = new Map<number, HTMLElement[]>();
          for (const w of words) {
            const y = w.offsetTop;
            const arr = lineMap.get(y) || [];
            arr.push(w);
            lineMap.set(y, arr);
          }
          const lines = Array.from(lineMap.keys()).sort((a,b)=>a-b);
          const byLine = lines.map((y) => lineMap.get(y) as HTMLElement[]);

          // Animate words with per-line stagger
          let index = 0;
          for (let li = 0; li < byLine.length; li++) {
            const lineWords = byLine[li];
            for (let wi = 0; wi < lineWords.length; wi++, index++) {
              const w = lineWords[wi];
              const delay = baseDelay + li * LINE_STEP + wi * WORD_STEP;
              if (canAnime && anime) {
                anime({ targets: w as unknown as Element, opacity: [0,1], translateY: [6,0], easing: 'easeOutQuad', duration: 600, delay } as unknown as Record<string, unknown>);
              } else {
                tween(w, { opacityFrom: 0, opacityTo: 1, translateFrom: 'translateY(6px)', translateTo: 'translateY(0px)', duration: 600, delay, easing: 'cubic-bezier(0.25,0.46,0.45,0.94)' });
              }
            }
          }
          el.dataset.revealed = '1';
          return;
        }

        const wantsLetters = el.hasAttribute('data-letters') || el.classList.contains('letters');
        if (wantsLetters) {
          if (!el.dataset.lettersReady) {
            const text = el.textContent || "";
            const frag = document.createDocumentFragment();
            for (const ch of text) {
              if (ch === ' ') { frag.appendChild(document.createTextNode(' ')); continue; }
              const span = document.createElement('span');
              span.className = 'char';
              span.textContent = ch;
              (span.style as CSSStyleDeclaration).display = 'inline-block';
              (span.style as CSSStyleDeclaration).opacity = '0';
              frag.appendChild(span);
            }
            el.textContent = '';
            el.appendChild(frag);
            el.dataset.lettersReady = '1';
          }

          if (reduce) {
            el.style.opacity = '1';
            el.style.transform = 'none';
            el.querySelectorAll<HTMLElement>('.char').forEach(c => { c.style.opacity = '1'; c.style.transform = 'none'; });
            el.dataset.revealed = '1';
            return;
          }

          el.style.opacity = '1';
          const chars = Array.from(el.querySelectorAll<HTMLElement>('.char'));
          const variant = (el.getAttribute('data-letters') || '').toLowerCase();
          const duration = variant === 'hero' ? 900 : 800;
          const fromY = variant === 'hero' ? 24 : 16;
          const easing = variant === 'hero' ? 'cubic-bezier(0.34,1.56,0.64,1)' : 'cubic-bezier(0.19,1,0.22,1)';

          chars.forEach((c, i) => {
            const delay = baseDelay + i * LETTER_STEP;
            if (canAnime && anime) {
              const params: Record<string, unknown> = { targets: c as unknown as Element, opacity: [0,1], translateY: [fromY,0], easing, duration, delay };
              if (variant === 'hero') params['scale'] = [1.08, 1];
              anime(params);
            } else {
              const translateFrom = `translateY(${fromY}px)`;
              const translateTo = 'translateY(0px)';
              tween(c, { opacityFrom: 0, opacityTo: 1, translateFrom, translateTo, duration, delay, easing });
            }
          });
          el.dataset.revealed = '1';
          return;
        }

        const dir = (el.dataset.anim || 'up').toLowerCase();
        const dist = 24;
        const duration = 700;
        const from = dir === 'up' ? `translateY(${dist}px)`
          : dir === 'down' ? `translateY(${-dist}px)`
          : dir === 'left' ? `translateX(${dist}px)`
          : dir === 'right' ? `translateX(${-dist}px)`
          : 'translateY(0px)';

        if (reduce) {
          el.style.opacity = '1';
          el.style.transform = 'none';
          el.dataset.revealed = '1';
          return;
        }

        if (canAnime && anime) {
          const params: Record<string, unknown> = { targets: el as unknown as Element, opacity: [0, 1], easing: 'easeOutQuad', duration, delay: baseDelay };
          if (dir === 'up') params['translateY'] = [dist, 0];
          else if (dir === 'down') params['translateY'] = [-dist, 0];
          else if (dir === 'left') params['translateX'] = [dist, 0];
          else if (dir === 'right') params['translateX'] = [-dist, 0];
          anime(params);
        } else {
          tween(el, { opacityFrom: 0, opacityTo: 1, translateFrom: from, translateTo: 'translate(0,0)', duration, delay: baseDelay });
        }
        el.dataset.revealed = '1';
      };

      const opts: IntersectionObserverInit = { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0.05 };
      const mountObserver = () => {
        io?.disconnect();
        io = new IntersectionObserver((entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const el = entry.target as HTMLElement;
            io?.unobserve(el);
            animateOnce(el);
          }
        }, opts);
        const nodes = Array.from(scope.querySelectorAll<HTMLElement>('.reveal'));
        nodes.forEach((n) => io?.observe(n));
        // Initial sweep
        const vh = window.innerHeight || 1;
        nodes.forEach((n) => {
          if (n.dataset.revealed === '1') return;
          const r = n.getBoundingClientRect();
          if (r.top < vh && r.bottom > 0) {
            io?.unobserve(n);
            animateOnce(n);
          }
        });
      };

      mountObserver();

      // Support runtime reset to replay animations
      const onReset = async () => {
        reduce = computeReduce();
        if (!animeRef) animeRef = await loadAnime();
        const nodes = Array.from(scope.querySelectorAll<HTMLElement>('.reveal'));
        nodes.forEach((n) => {
          n.dataset.revealed = '0';
          if (!reduce) {
            n.style.opacity = '0';
            n.style.transform = 'translateZ(0)';
          } else {
            n.style.opacity = '1';
            n.style.transform = 'none';
          }
        });
        mountObserver();
      };
      window.addEventListener('reveal:reset', onReset);
      cleanupReset = () => window.removeEventListener('reveal:reset', onReset);
    };

    init();

    return () => {
      canceled = true;
      io?.disconnect();
      cleanupReset?.();
    };
  }, [rootEl]);
}
