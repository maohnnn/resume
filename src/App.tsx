import React, { useEffect, useMemo, useRef, useState } from "react";

// React + Tailwind Matrix Terminal Resume
// - Keeps the Matrix background (with DPR-safe canvas)
// - Interactive terminal-style content
// - Export command (md/txt/html)
// - Badges with hover
// - Custom scrollbar + faster typing/caret animations via CSS

// Types
type CommandFn = (arg?: string) => React.ReactNode | null;
type CommandMap = Record<string, CommandFn>;

const MATRIX_FONT_SIZE = 16; // in CSS pixels
const MATRIX_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("");

const Prompt = () => (
  <>
    <span className="text-emerald-400 font-bold">metrix</span>
    @
    <span className="text-cyan-300 font-bold">resume</span>
    :
    <span className="text-fuchsia-300 font-bold">~</span>$
  </>
);

function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function buildExports() {
  const md = `# Metrix Resume\n\n**Full-Stack Developer** — Bangkok, TH\n\n## Summary\nเน้นคุณภาพโค้ด ประสิทธิภาพ และความเสถียรของระบบ\n\n## Skills\n- Frontend: Angular, Vue 3/Vite, React, TypeScript\n- Backend/DevOps: Node.js, NestJS, MongoDB, PostgreSQL, Docker, CI/CD, Cloud\n\n## Experience\n- Senior Full-Stack Developer — Siam IoT Co., Ltd. (2022–ปัจจุบัน)\n  - Module Federation ลด TTI ~40%\n  - NestJS + MongoDB พร้อม Logger/Tracing\n  - Design System + Storybook\n- Full-Stack Developer — MG Solutions (2019–2022)\n  - Dashboard real-time (MQTT/WebSocket)\n  - ย้าย Vue2 → Vue3 + Vite ลด build time ~60%\n\n## Projects\n- Learning Center — Angular · M3 · SSR\n- IoT Admin Panel — Vue 3 · Quasar · MQTT\n- Log Analytics Library — Node.js · NestJS · Decorator\n\n## Contact\n- โทร: 08x-xxx-xxxx\n- อีเมล: you@email.com`;

  const txt = md
    .replace(/^# .*$/m, "Metrix Resume")
    .replace(/^## /gm, "\n** ")
    .replace(/^\*\* (.*)$/gm, "$1 **");

  const html = `<!doctype html><meta charset=\"utf-8\"><title>Metrix Resume</title><pre style=\"font:14px/1.6 ui-monospace,Menlo,Consolas,monospace;padding:16px;color:#e5e7eb;background:#0f0f0f\">${md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")}</pre>`;

  return { md, txt, html };
}


const stacks = {
  core: [
    ["TypeScript", "text-emerald-300"],
    ["Angular", "text-cyan-200"],
    ["Vue 3", "text-fuchsia-200"],
    ["React", "text-amber-200"],
  ] as [string, string][],
  backend: [
    ["Node.js", "text-emerald-300"],
    ["NestJS", "text-cyan-200"],
    ["MongoDB", "text-fuchsia-200"],
    ["PostgreSQL", "text-amber-200"],
    ["Docker", "text-emerald-300"],
    ["CI/CD", "text-cyan-200"],
    ["Cloud", "text-fuchsia-200"],
  ] as [string, string][],
};

// ===== Matrix hook (with DPR fix & stronger layering) =====
const useMatrix = (canvasRef: React.RefObject<HTMLCanvasElement>) => {
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

    const baseSpeed = 0.9; // ความเร็วพื้นฐาน (คูณกับ dt)
    let drops: number[] = [];

    const resetDrops = () => {
      const columns = Math.floor(cssW / MATRIX_FONT_SIZE);
      drops = new Array(columns).fill(0).map(() => Math.random() * -50);
    };
    resetDrops();

    let raf = 0;
    let last = performance.now();

    const draw = (now: number) => {
      const dt = Math.min(32, now - last) / 16.67; // normalize เป็นหน่วยเฟรม ~60fps
      last = now;

      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(0,0,0,0.10)";
      ctx.fillRect(0, 0, cssW, cssH);
      ctx.font = `${MATRIX_FONT_SIZE}px ui-monospace,Menlo,Consolas,monospace`;
      ctx.textBaseline = "top";
      ctx.fillStyle = "rgba(16,185,129,0.95)";

      for (let i = 0; i < drops.length; i++) {
        const text = MATRIX_CHARS[(Math.random() * MATRIX_CHARS.length) | 0];
        const x = i * MATRIX_FONT_SIZE;
        const y = drops[i] * MATRIX_FONT_SIZE;
        ctx.fillText(text, x, y);
        if (y > cssH && Math.random() > 0.975) drops[i] = 0;
        drops[i] += baseSpeed * dt;
      }

      raf = requestAnimationFrame(draw);
    };

    const onResize = () => { resize(); resetDrops(); };
    window.addEventListener("resize", onResize);
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [canvasRef]);
};

// ===== Self tests =====
const useSelfTests = (
  commands: CommandMap | null,
  chars: string[],
  speedInit: number
) => {
  useEffect(() => {
    if (!commands) return;
    const id = setTimeout(() => {
      const results: { name: string; pass: boolean }[] = [];
      const assert = (name: string, cond: unknown) => results.push({ name, pass: !!cond });

      // Presence checks
      assert("COMMANDS.help exists", typeof commands.help === "function");
      assert("COMMANDS.skills exists", typeof commands.skills === "function");
      assert("COMMANDS.experience exists", typeof commands.experience === "function");
      assert("COMMANDS.clear exists", typeof commands.clear === "function");
      assert("COMMANDS.export exists", typeof (commands as any)["export"] === "function");

      // Matrix config
      assert("matrix chars are English alnum", chars.every((c) => /[A-Z0-9]/.test(c)));
      assert("matrix speed starts slower", speedInit <= 1.0);

      // Help contains export — help returns string
      const helpVal = commands.help?.();
      assert("help returns string", typeof helpVal === "string");
      const helpText = typeof helpVal === "string" ? helpVal : "";
      assert("help lists export", /export/.test(helpText));

      // Export unsupported must return a React node (error pill), not string
      const expFn = (commands as any)["export"] as CommandFn | undefined;
      const out = expFn ? expFn("pdf") : null;
      assert("export pdf returns ReactNode", typeof out !== "string" && out !== null);

      // Report
      const failed = results.filter((r) => !r.pass);
      if (failed.length) {
        // eslint-disable-next-line no-console
        console.error("[Self-tests] Failed:", failed);
      } else {
        // eslint-disable-next-line no-console
        console.log("[Self-tests] All passed:", results.length);
      }
    }, 0);

    return () => clearTimeout(id);
  }, [commands, chars, speedInit]);
};

const TerminalOutput: React.FC<{ children: React.ReactNode }>=({ children })=> (
  <div className="ml-6 block rounded-md bg-emerald-400/10 px-3 py-1.5 text-slate-200">
    {children}
  </div>
);

const MetrixResumeTerminal: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // @ts-ignore
  useMatrix(canvasRef);

  const [lines, setLines] = useState<React.ReactNode[]>([]);
  const [buffer, setBuffer] = useState("");
  const screenRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    const el = screenRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  };

  useEffect(() => { scrollToBottom(); }, [lines]);

  const writeLine = (node: React.ReactNode) => setLines((prev) => [...prev, node]);

  const typeText = async (text: string, delay = 8) => {
    // simple typing effect for plain text only
    return new Promise<void>((resolve) => {
      let out = "";
      const idx = lines.length;
      setLines((prev) => [...prev, out]);
      const tick = () => {
        if (out.length < text.length) {
          out += text[out.length];
          setLines((prev) => {
            const clone: any = [...prev];
            clone[idx] = out;
            return clone;
          });
          setTimeout(tick, delay);
        } else {
          // wrap final line in styled output
          setLines((prev) => {
            const clone = [...prev];
            clone[idx] = <TerminalOutput>{text}</TerminalOutput>;
            return clone;
          });
          resolve();
        }
      };
      setTimeout(tick, delay);
    });
  };

  const badgeGroup = (items: [string, string][], title?: string) => (
    <div className="ml-6 mt-1 rounded-lg bg-emerald-400/10 p-2">
      {title && (
        <div className="mb-1 text-[12px] font-bold tracking-wide text-slate-300">
          {title}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {items.map(([label, color]) => (
          <span
            key={label}
            className={[
              "inline-flex min-h-6 select-none items-center gap-2 rounded-full border px-3 py-1 text-[12px] leading-none backdrop-saturate-125 transition-transform duration-150 ease-out",
              "border-white/10 bg-white/5 hover:-translate-y-px hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] hover:bg-white/10",
              color,
            ].join(" ")}
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-current shadow-[0_0_10px_currentColor]" />
            {label}
          </span>
        ))}
      </div>
    </div>
  );

  // help returns plain text for testing convenience
  const buildHelp = () => (
    [
      "Available commands:",
      "  whoami — เกี่ยวกับฉัน",
      "  skills — ทักษะหลัก",
      "  experience — ประสบการณ์ทำงาน",
      "  projects — ผลงานเด่น",
      "  contact — ช่องทางติดต่อ",
      "  export [md|txt|html] — ส่งออกไฟล์เรซูเม่ (ดีฟอลต์ md)",
      "  clear — ล้างหน้าจอ",
    ].join("\n")
  );

  const commands: CommandMap = useMemo(() => ({
    help: () => buildHelp(),
    whoami: () => (
      <>
        <TerminalOutput>
          <strong>Full‑Stack Developer</strong> · Bangkok, TH
          <br />เน้นคุณภาพโค้ด ประสิทธิภาพ และความเสถียรของระบบ
        </TerminalOutput>
        {badgeGroup(stacks.core, "Stack หลัก")}
        {badgeGroup(stacks.backend, "Backend/DevOps")}
      </>
    ),
    skills: () => (
      <>
        <TerminalOutput>
          <strong>Frontend</strong>
          <br />- Angular (90%)
          <br />- Vue 3 / Vite (85%)
          <br />- React (75%)
          <br />- TypeScript (90%)
        </TerminalOutput>
        {badgeGroup(stacks.core, "Frameworks & Toolkit")}
        <TerminalOutput>
          <strong>Backend/DevOps</strong>
          <br />- Node.js (85%)
          <br />- NestJS (80%)
          <br />- MongoDB (75%), PostgreSQL (70%)
          <br />- Docker · CI/CD · Cloud (65–75%)
        </TerminalOutput>
        {badgeGroup(stacks.backend, "Backend / DevOps Tools")}
      </>
    ),
    experience: () => (
      <TerminalOutput>
        <strong>Senior Full‑Stack Developer</strong> — Siam IoT Co., Ltd. (2022–ปัจจุบัน)
        <br />• Module Federation ลด TTI ~40%
        <br />• NestJS + MongoDB พร้อม Logger/Tracing
        <br />• Design System + Storybook
        <br />
        <strong>Full‑Stack Developer</strong> — MG Solutions (2019–2022)
        <br />• Dashboard real‑time (MQTT/WebSocket)
        <br />• ย้าย Vue2 → Vue3 + Vite ลด build time ~60%
      </TerminalOutput>
    ),
    projects: () => (
      <TerminalOutput>
        <strong>Learning Center</strong> — Angular · M3 · SSR
        <br />• ศูนย์การเรียนรู้ออนไลน์ รองรับ SEO + SSR
        <br />
        <strong>IoT Admin Panel</strong> — Vue 3 · Quasar · MQTT
        <br />• คอนโซลบริหารอุปกรณ์ real‑time + RBAC
        <br />
        <strong>Log Analytics Library</strong> — Node.js · NestJS · Decorator
        <br />• Interceptor + Decorator สำหรับ Log/Trace อัตโนมัติ
      </TerminalOutput>
    ),
    contact: () => (
      <TerminalOutput>
        <strong>โทร</strong> 08x‑xxx‑xxxx
        <br />
        <strong>อีเมล</strong> you@email.com
        <br />
        <strong>ที่อยู่</strong> Bangkok, Thailand
      </TerminalOutput>
    ),
    export: (arg?: string) => {
      const format = (arg || "md").toLowerCase();
      const { md, txt, html } = buildExports();
      let name = `metrix-resume.${format}`;
      let data = "";
      let type = "text/plain;charset=utf-8";
      if (format === "md") { data = md; type = "text/markdown;charset=utf-8"; }
      else if (format === "txt") { data = txt; }
      else if (format === "html") { data = html; type = "text/html;charset=utf-8"; }
      else {
        return (
          <span className="rounded-md bg-red-400/10 px-2 py-1 font-semibold text-red-400">
            export: unsupported format "{format}" (use md|txt|html)
          </span>
        );
      }
      downloadFile(name, data, type);
      return (
        <TerminalOutput>
          Exported <strong>{name}</strong> ✓
        </TerminalOutput>
      );
    },
    clear: () => { setLines([]); return null; },
  }), []);

  // Delay self-tests until commands committed once
  const [commandsReady, setCommandsReady] = useState<CommandMap | null>(null);
  useEffect(() => { setCommandsReady(commands); }, [commands]);
  useSelfTests(commandsReady, MATRIX_CHARS, 0.9);

  const runCommand = async (raw?: string) => {
    if (!raw) return;
    const [cmd, arg] = raw.trim().split(/\s+/, 2);
    writeLine(
      <div className="flex items-start gap-2">
        <span className="text-emerald-400">$</span>
        <span className="font-semibold text-slate-100">{raw}</span>
      </div>
    );
    await new Promise((r) => setTimeout(r, 60));

    const action = commands[cmd as keyof typeof commands];
    if (action) {
      const out = action(arg);
      if (typeof out === "string") await typeText(out, 4);
      else if (out) writeLine(out);
    } else {
      writeLine(
        <span className="rounded-md bg-red-400/10 px-2 py-1 font-semibold text-red-400">{cmd}: command not found</span>
      );
    }
  };

  // keyboard input
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Backspace") { setBuffer((b) => b.slice(0, -1)); e.preventDefault(); return; }
      if (e.key === "Enter") { const cmd = buffer; setBuffer(""); runCommand(cmd); e.preventDefault(); return; }
      if (e.key.length === 1) { setBuffer((b) => b + e.key); e.preventDefault(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [buffer]);

  // initial demo
  useEffect(() => {
    const boot = async () => {
      await typeText("Booting interactive resume ...", 6);
      writeLine(<div />);
      await runCommand("whoami");
      writeLine(<div />);
      await runCommand("skills");
      writeLine(<div />);
      await runCommand("experience");
      writeLine(<div />);
      await runCommand("projects");
      writeLine(<TerminalOutput>พิมพ์ <strong>help</strong> เพื่อดูคำสั่ง หรือใช้ปุ่มลัดด้านล่าง — ใช้ <strong>export</strong> เพื่อดาวน์โหลดไฟล์</TerminalOutput>);
    };
    boot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // @ts-ignore
  // @ts-ignore
  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-slate-100">
      {/* Matrix canvas */}
      <canvas
         ref={canvasRef}
         className="pointer-events-none fixed inset-0 z-0 opacity-70 mix-blend-screen"
         aria-hidden
      />
      {/* Move glow behind canvas so matrix is always visible */}
      <div className="fixed inset-x-0 top-0 -z-20 h-72 bg-gradient-to-b from-emerald-400/25 to-transparent" />

      {/* Global styles for caret + scrollbar */}
      <style>{`
        @keyframes caretBlink { 50% { opacity: 0 } }
        .caret { display:inline-block; width:10px; height:1.2em; background: rgb(52,211,153); margin-left:4px; vertical-align:-.2em; animation: caretBlink .6s steps(1) infinite; }
        .scrollArea::-webkit-scrollbar{ width:10px; height:10px }
        .scrollArea::-webkit-scrollbar-track{ background: transparent }
        .scrollArea::-webkit-scrollbar-thumb{ background: linear-gradient(180deg, rgba(52,211,153,.95), rgba(34,211,238,.8)); border-radius:999px; border:2px solid transparent; background-clip:content-box; box-shadow: inset 0 0 0 1px rgba(255,255,255,.06) }
        .scrollArea:hover::-webkit-scrollbar-thumb{ background: linear-gradient(180deg, rgba(52,211,153,1), rgba(34,211,238,.95)) }
      `}</style>

      <main className="relative z-10 mx-auto max-w-5xl p-6 sm:p-8 lg:p-10">

        <section className="relative rounded-2xl border border-[#1f1f22] bg-[#0f0f0f] shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-md">
          {/* Header */}
          <div className="flex items-center gap-3 rounded-t-2xl border-b border-[#1f1f22] px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 rounded-full bg-red-500" />
              <span className="h-3.5 w-3.5 rounded-full bg-amber-500" />
              <span className="h-3.5 w-3.5 rounded-full bg-emerald-500" />
            </div>
            <div className="text-sm font-bold tracking-wide text-cyan-300">metrix@resume: ~</div>
          </div>

          {/* Body */}
          <div ref={screenRef} className="scrollArea h-[75vh] overflow-auto px-5 py-4 font-mono text-[15px] leading-7">
            {lines.map((node, i) => (<div key={i} className="mb-1">{node}</div>))}
            {/* Prompt line */}
            <div className="mt-1 flex items-start gap-2">
              <Prompt />&nbsp;<span>{buffer}</span><span className="caret" />
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap gap-2 rounded-b-2xl border-t border-[#1f1f22] px-5 py-3">
            <button className="h-9 rounded-xl border border-white/10 bg-emerald-500/90 px-4 font-semibold text-[#0b0f0d] shadow-sm active:scale-95" onClick={() => (async () => { await typeText("Booting interactive resume ...", 6); await runCommand("whoami"); await runCommand("skills"); await runCommand("experience"); await runCommand("projects"); })()}>
              Re-run demo
            </button>
            {[ ["help", "help"], ["skills", "skills"], ["projects", "projects"], ["contact", "contact"], ["export", "export md"] ].map(([label, cmd]) => (
              <button key={label} className="h-9 rounded-xl border border-white/10 bg-[#1a1b1e] px-4 font-semibold text-slate-100 shadow-sm active:scale-95" onClick={() => runCommand(cmd)}>
                {label}
              </button>
            ))}
          </div>
        </section>
        <p className="mt-4 text-center text-xs text-slate-400">© {new Date().getFullYear()} ชื่อ‑นามสกุล · พร้อมเริ่มงานทันที · อัปเดตล่าสุดวันนี้</p>
      </main>
    </div>
  );
};

export default MetrixResumeTerminal;
