import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Prompt from "./components/Prompt";
import TerminalOutput from "./components/TerminalOutput";
import BadgeGroup from "./components/BadgeGroup";
import useMatrix from "./hooks/useMatrix";
import { MATRIX_CHARS } from "./constants/matrix";
import { downloadFile } from "./utils/download";
import type { CommandMap, Profile } from "./types";

// React + Tailwind Matrix Terminal Resume
// - Keeps the Matrix background (with DPR-safe canvas)
// - Interactive terminal-style content
// - Export command (md/txt/html)
// - Badges with hover
// - Custom scrollbar + faster typing/caret animations via CSS

// Types
const DEFAULT_PROFILE: Profile = {
  name: "Your Name",
  title: "Full-Stack Developer",
  location: "Bangkok, TH",
  phone: "08x-xxx-xxxx",
  email: "you@email.com",
  summary: "Focus on code quality, performance, and system reliability.",
};

const PROFILE_KEY = "metrix-profile";
const loadProfile = (): Profile => {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_PROFILE, ...parsed } as Profile;
    }
  } catch (e) {
    if (import.meta && import.meta.env && import.meta.env.DEV) {
      console.warn("loadProfile: failed to parse profile from localStorage", e);
    }
  }
  return DEFAULT_PROFILE;
};
const saveProfile = (p: Profile) => {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch (e) {
    if (import.meta && import.meta.env && import.meta.env.DEV) {
      console.warn("saveProfile: failed to save profile to localStorage", e);
    }
  }
};

function buildExports(profile: Profile) {
  const md = `# ${profile.name}\n\n**${profile.title}** — ${profile.location}\n\n## Summary\n${profile.summary}\n\n## Skills\n- Frontend: Angular, Vue 3/Vite, React, TypeScript\n- Backend/DevOps: Node.js, NestJS, MongoDB, PostgreSQL, Docker, CI/CD, Cloud\n\n## Experience\n- Senior Full-Stack Developer — Siam IoT Co., Ltd. (2022–ปัจจุบัน)\n  - Module Federation ลด TTI ~40%\n  - NestJS + MongoDB พร้อม Logger/Tracing\n  - Design System + Storybook\n- Full-Stack Developer — MG Solutions (2019–2022)\n  - Dashboard real-time (MQTT/WebSocket)\n  - ย้าย Vue2 → Vue3 + Vite ลด build time ~60%\n\n## Projects\n- Learning Center — Angular · M3 · SSR\n- IoT Admin Panel — Vue 3 · Quasar · MQTT\n- Log Analytics Library — Node.js · NestJS · Decorator\n\n## Contact\n- โทร: ${profile.phone}\n- อีเมล: ${profile.email}`;

  const txt = md
    .replace(/^# .*$/m, `${profile.name}`)
    .replace(/^## /gm, "\n** ")
    .replace(/^\*\* (.*)$/gm, "$1 **");

  const html = `<!doctype html><meta charset="utf-8"><title>${profile.name}</title><pre style="font:14px/1.6 ui-monospace,Menlo,Consolas,monospace;padding:16px;color:#e5e7eb;background:#0f0f0f">${md
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
      assert("COMMANDS.skills exists", typeof commands.skills === "function");
      assert("COMMANDS.experience exists", typeof commands.experience === "function");
      assert("COMMANDS.clear exists", typeof commands.clear === "function");
      assert("COMMANDS.export exists", typeof commands["export"] === "function");

      // Matrix config
      assert("matrix chars are English alnum", chars.every((c) => /[A-Z0-9]/.test(c)));
      assert("matrix speed starts slower", speedInit <= 1.0);

      // Export unsupported must return a React element (error pill)
      const expFn = commands["export"];
      const out = expFn ? expFn("pdf") : null;
      assert("export pdf returns ReactElement", out !== null && React.isValidElement(out));

      // Report
      const failed = results.filter((r) => !r.pass);
      if (failed.length) {
        console.error("[Self-tests] Failed:", failed);
      } else {
        console.log("[Self-tests] All passed:", results.length);
      }
    }, 0);

    return () => clearTimeout(id);
  }, [commands, chars, speedInit]);
};

const MetrixResumeTerminal: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useMatrix(canvasRef);

  const [profile, setProfile] = useState<Profile>(() => loadProfile());
  useEffect(() => { saveProfile(profile); }, [profile]);

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

  const typeText = useCallback((text: string, delay = 8) => {
    // simple typing effect for plain text only
    return new Promise<void>((resolve) => {
      let out = "";
      let idx = -1;
      setLines((prev) => {
        idx = prev.length;
        return [...prev, out];
      });
      const tick = () => {
        if (out.length < text.length) {
          out += text[out.length];
          setLines((prev) => {
            const clone = [...prev] as React.ReactNode[];
            clone[idx] = out;
            return clone;
          });
          setTimeout(tick, delay);
        } else {
          // wrap final line in styled output
          setLines((prev) => {
            const clone = [...prev] as React.ReactNode[];
            clone[idx] = <TerminalOutput>{text}</TerminalOutput>;
            return clone;
          });
          resolve();
        }
      };
      setTimeout(tick, delay);
    });
  }, []);

  const commands: CommandMap = useMemo(() => ({
     whoami: () => (
       <>
         <TerminalOutput>
           <strong>{profile.title}</strong> · {profile.location}
           <br />{profile.summary}
         </TerminalOutput>
         <BadgeGroup items={stacks.core} title="Stack หลัก" />
         <BadgeGroup items={stacks.backend} title="Backend/DevOps" />
       </>
     ),
     contact: () => (
       <TerminalOutput>
         <strong>โทร</strong> {profile.phone}
         <br />
         <strong>อีเมล</strong> {profile.email}
         <br />
         <strong>ที่อยู่</strong> {profile.location}
       </TerminalOutput>
     ),
     profile: () => (
       <TerminalOutput>
         <strong>ชื่อ</strong> {profile.name}
         <br />
         <strong>ตำแหน่ง</strong> {profile.title}
         <br />
         <strong>ที่อยู่</strong> {profile.location}
         <br />
         <strong>โทร</strong> {profile.phone}
         <br />
         <strong>อีเมล</strong> {profile.email}
       </TerminalOutput>
     ),
     set: (arg?: string) => {
       const input = (arg || "").trim();
       if (!input) return (
         <span className="rounded-md bg-yellow-400/10 px-2 py-1 text-yellow-300">set: usage — set &lt;field&gt; &lt;value&gt;</span>
       );
       const m = input.match(/^(\w+)\s+(.+)$/);
       if (!m) return (
         <span className="rounded-md bg-yellow-400/10 px-2 py-1 text-yellow-300">set: invalid input</span>
       );
       const key = m[1] as keyof Profile;
       const valRaw = m[2].trim().replace(/^"|"$/g, "");
       const allowed: (keyof Profile)[] = ["name","title","location","phone","email","summary"];
       if (!allowed.includes(key)) return (
         <span className="rounded-md bg-yellow-400/10 px-2 py-1 text-yellow-300">set: unknown field "{String(key)}"</span>
       );
       setProfile((p) => ({ ...p, [key]: valRaw }));
       return null;
     },
     skills: () => (
       <>
         <TerminalOutput>
           <strong>Frontend</strong>
           <br />- Angular (90%)
           <br />- Vue 3 / Vite (85%)
           <br />- React (75%)
           <br />- TypeScript (90%)
         </TerminalOutput>
         <BadgeGroup items={stacks.core} title="Frameworks & Toolkit" />
         <TerminalOutput>
           <strong>Backend/DevOps</strong>
           <br />- Node.js (85%)
           <br />- NestJS (80%)
           <br />- MongoDB (75%), PostgreSQL (70%)
           <br />- Docker · CI/CD · Cloud (65–75%)
         </TerminalOutput>
         <BadgeGroup items={stacks.backend} title="Backend / DevOps Tools" />
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
     export: (arg?: string) => {
       const format = (arg || "md").toLowerCase();
       const { md, txt, html } = buildExports(profile);
       const name = `${profile.name.replace(/\s+/g, '-').toLowerCase()}.${format}`;
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
       return null;
     },
     clear: () => {
       setLines([]);
       return null;
     }
  }), [profile]);

  useSelfTests(commands, MATRIX_CHARS, 0.6);

  const runCommand = useCallback(async (input: string) => {
    const raw = input.trim();
    if (!raw) return;
    const [cmd, rest] = raw.split(/\s+/, 2);

    // Echo the command line
    writeLine(
      <div className="text-slate-200">
        <Prompt /> {raw}
      </div>
    );

    const fn = (commands as CommandMap)[cmd];
    if (!fn) {
      writeLine(
        <span className="rounded-md bg-red-400/10 px-2 py-1 font-semibold text-red-300">
          {`command not found: ${cmd}`}
        </span>
      );
      return;
    }
    const out = fn(rest);
    if (typeof out === "string") await typeText(out);
    else if (out) writeLine(out);
  }, [commands, typeText]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = buffer;
      setBuffer("");
      runCommand(val);
    } else if (e.key === "c" && (e.ctrlKey || e.metaKey)) {
      setBuffer("");
    }
  };

  // Show all commands once on first render
  const bootedRef = useRef(false);
  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;
    (async () => {
      const initial = [
        "whoami",
        "skills",
        "experience",
        "projects",
        "contact",
        "profile",
      ];
      for (const cmd of initial) {
        await runCommand(cmd);
      }
    })();
  }, [runCommand]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black text-[15px] md:text-[16px] leading-relaxed text-slate-200">
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0 block" />

      <div className="relative z-10 mx-auto max-w-[72ch] p-4 md:p-6">
        {/* content-column scrim to dim matrix under content */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 rounded-xl bg-black/40 md:bg-black/50" />
        <div
          ref={screenRef}
          className="max-h-[75vh] overflow-y-auto rounded-lg border border-white/10 bg-black/70 p-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur-sm"
        >
          {lines.map((ln, i) => (
            <div key={i} className="mb-2 md:mb-3 last:mb-0">{ln}</div>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-3 rounded-lg border border-white/10 bg-black/60 px-3 py-2">
          <div className="shrink-0 text-slate-400"><Prompt /></div>
          <input
            className="w-full bg-transparent text-slate-200 outline-none placeholder:text-slate-500"
            placeholder="try: whoami · skills · export md"
            value={buffer}
            onChange={(e) => setBuffer(e.target.value)}
            onKeyDown={onKeyDown}
            autoFocus
          />
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return <MetrixResumeTerminal />;
};

export default App;

