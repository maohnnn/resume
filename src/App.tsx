import React, { useRef, useState, useEffect, useCallback } from "react";
import useParticles from "./hooks/useParticles";
import useAnimeReveal from "./hooks/useAnimeReveal";
import type { Profile } from "./types";

const DEFAULT_PROFILE: Profile = {
  name: "Tanadol Moungmontree",
  title: "Full-Stack Developer",
  location: "Bangkok, TH",
  phone: "+66-63-412-3699",
  email: "tanadol.mo@gmail.com",
  summary: "Full‑stack developer focused on TypeScript, Angular, Nestjs, and Node.js—shipping fast, reliable products with clean architecture and measurable impact. Recently improved performance (−40% TTI), rolled out a reusable design system, and added observability across services. Pragmatic and product‑minded; I own features from idea to production with testing, CI/CD, and measurable outcomes.",
  // website: "https://your.site",
  github: "https://github.com/maohnnn",
  linkedin: "www.linkedin.com/in/tanadol-moungmontree-7020b0274",
};

const skills = {
  frontend: ["TypeScript", "Angular", "Vue", "TailwindCSS"],
  backend: ["Node.js", "NestJS", "Express", "MongoDB"],
  devops: ["Docker", "CI/CD", "GitHub Actions", "k8s (basic)"],
};

const coreSkill = ["Angular", "NestJS", "Node.js", "TypeScript"]

const experience = [
  {
    role: "Full‑Stack Developer",
    company: "Cube SoftTech Co., Ltd. (Onsite at Advanced Info Service Public Company Limited)",
    period: "2023 – Present",
    bullets: [
      "IoT Management Web Application: Designed and implemented a user-friendly interface for managing IoT devices, enabling real-time monitoring and control.",
      "Team Worklogs Web Application Integrated with Jira: Developed an internal tool to track team worklogs, seamlessly integrating with Jira to synchronize tasks and updates, while also summarizing individual timesheet data to provide detailed insights into each team member’s project contributions. This integration streamlined project tracking, resource allocation, and improved team productivity by optimizing the user interface for ease of use.",
      "Sequence Flow Web Application: Created a platform to visualize and manage sequence flows, facilitating better understanding and optimization of complex processes.",
      "Mobile Application for a Mobile Network Operator: Developed a mobile application for a telecommunications company, enhancing user experience and providing seamless access to services."
    ],
  },
  {
    role: "Front-End Developer",
    company: "Freelance",
    period: "2022 – 2023",
    bullets: [
      "Mental Healthcare Management System: Developed a comprehensive platform for mental healthcare professionals to manage patient cases, maintain treatment histories, and schedule appointments efficiently. Integrated the system with LINE Official Account (LINE OA) to enhance patient engagement and streamline communication. This integration allows patients to receive appointment reminders, and direct communication through LINE, improving accessibility and convenience for both patients and healthcare providers",
      "Personal Data Protection Management System: Developed a web application to assist organizations in ensuring compliance with personal data protection regulations. The system facilitates the handling of personal data requests, maintains records of data processing activities, and manages cookie usage. It enables organizations to oversee the collection, processing, and storage of personal data while ensuring full compliance with legal requirements and protecting individual privacy.",
    ],
  },
];

const projects = [
  {
    name: "IoT Management Web Application",
    stack: ["Angular", "Typescript", "NestJS", "Node.js" ,"MongoDB"],
    desc: "Designed and implemented a user-friendly interface for managing IoT devices, enabling real-time monitoring and control.",
  },
  {
    name: "IoT Admin Panel",
    stack: ["Vue 3", "Quasar", "MQTT"],
    desc: "Real‑time device ops console with granular RBAC and live telemetry.",
  },
  {
    name: "Log Analytics Library",
    stack: ["Node.js", "NestJS"],
    desc: "Decorators + interceptors for low‑friction app logging and tracing.",
  },
];

const education = [
  { degree: "B.Sc. in Computer Science", org: "Your University", years: "2015 – 2019" },
];

const certs = [
  { name: "AWS Certified Cloud Practitioner", year: "YYYY" },
];

const HeaderBar: React.FC<{ profile: Profile; activeId: string; onNavReady?: (el: HTMLElement | null) => void }>=({ profile, activeId, onNavReady })=> {
  const navRef = useRef<HTMLElement | null>(null);
  const underlineRef = useRef<HTMLSpanElement | null>(null);

  // expose nav element to parent if needed
  useEffect(() => { onNavReady?.(navRef.current); }, [onNavReady]);

  const moveUnderline = useCallback(() => {
    const nav = navRef.current; const bar = underlineRef.current;
    if (!nav || !bar) return;
    const active = nav.querySelector<HTMLAnchorElement>('a.nav-link.is-active');
    if (!active) return;
    const navRect = nav.getBoundingClientRect();
    const aRect = active.getBoundingClientRect();
    const x = aRect.left - navRect.left;
    const w = aRect.width;
    bar.style.transform = `translateX(${Math.max(0, x)}px)`;
    bar.style.width = `${w}px`;
  }, []);

  useEffect(() => { moveUnderline(); }, [activeId, moveUnderline]);
  useEffect(() => {
    const onResize = () => moveUnderline();
    window.addEventListener("resize", onResize);
    // ensure first layout
    const id = requestAnimationFrame(moveUnderline);
    return () => { window.removeEventListener("resize", onResize); cancelAnimationFrame(id); };
  }, [moveUnderline]);

  return (
    <header className="header glass reveal" data-anim="down">
      <div className="header-main">
        <div className="title reveal" data-anim="right" data-letters="hero">{profile.name}</div>
        <div className="subtitle reveal" data-anim="right">{profile.title} · {profile.location}</div>
      </div>
      <nav className="header-nav nav-tabs" ref={navRef} data-stagger-group>
        <a className={["reveal nav-link", activeId === "summary" ? "is-active" : ""].join(" ")} data-anim="down" href="#summary">Summary</a>
        <a className={["reveal nav-link", activeId === "skills" ? "is-active" : ""].join(" ")} data-anim="down" href="#skills">Skills</a>
        <a className={["reveal nav-link", activeId === "experience" ? "is-active" : ""].join(" ")} data-anim="down" href="#experience">Experience</a>
        <a className={["reveal nav-link", activeId === "projects" ? "is-active" : ""].join(" ")} data-anim="down" href="#projects">Projects</a>
        <a className={["reveal nav-link", activeId === "education" ? "is-active" : ""].join(" ")} data-anim="down" href="#education">Education</a>
        <a className={["reveal nav-link", activeId === "contact" ? "is-active" : ""].join(" ")} data-anim="down" href="#contact">Contact</a>
        <span className="nav-underline" ref={underlineRef} />
      </nav>
    </header>
  );
};

const Sidebar: React.FC<{ profile: Profile; onReset?: () => void }>=({ profile })=> (
  <aside className="sidebar glass reveal" data-anim="up">
    <div className="sidebar-block">
      <div className="block-title">Contact</div>
      <div className="kv"><span>Phone</span><a href={`tel:${profile.phone}`}>{profile.phone}</a></div>
      <div className="kv"><span>Email</span><a href={`mailto:${profile.email}`}>{profile.email}</a></div>
      {profile.website && <div className="kv"><span>Website</span><a href={profile.website} target="_blank" rel="noreferrer noopener">{profile.website}</a></div>}
      {profile.github && <div className="kv"><span>GitHub</span><a href={profile.github} target="_blank" rel="noreferrer noopener">{profile.github}</a></div>}
      {profile.linkedin && <div className="kv"><span>LinkedIn</span><a href={profile.linkedin} target="_blank" rel="noreferrer noopener">{profile.linkedin}</a></div>}

    </div>
    <div className="sidebar-block">
      <div className="block-title">Core</div>
      <div className="chips" data-stagger-group>
        {coreSkill.map(s => <Chip key={s} label={s} />)}
      </div>
    </div>
  </aside>
);

const Chip: React.FC<{ label: string }> = ({ label }) => (
  <span className="chip reveal" data-anim="up">{label}</span>
);

const Section: React.FC<{ title: string; children: React.ReactNode; id?: string }>=({ title, children, id })=> (
  <section className="glass section reveal" data-anim="up" id={id}>
    <h2 className="section-title reveal" data-anim="down" data-letters>{title}</h2>
    {children}
  </section>
);

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useParticles(canvasRef);

  const [profile] = useState<Profile>(() => {
    try {
      const raw = localStorage.getItem("resume-profile");
      if (!raw) return DEFAULT_PROFILE;
      const parsed = JSON.parse(raw);
      const merged = { ...DEFAULT_PROFILE, ...parsed } as Profile;
      // normalize blank/undefined summary
      const s = (merged.summary || "").trim();
      merged.summary = s ? merged.summary : DEFAULT_PROFILE.summary;
      return merged;
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  const pageRef = useRef<HTMLDivElement | null>(null);
  useAnimeReveal(pageRef.current || undefined);

  // active section tracking
  const [activeId, setActiveId] = useState<string>("summary");
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>("section.glass[id]"));
    if (!sections.length) return;

    let ticking = false;
    const compute = () => {
      ticking = false;
      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      const header = document.querySelector<HTMLElement>(".header");
      const hb = header?.getBoundingClientRect();
      // Use header bottom if visible, else a fixed anchor from top
      const anchorFromViewportTop = hb && hb.bottom > 0 ? (hb.bottom + 8) : 72;
      const anchorY = scrollTop + anchorFromViewportTop;

      let currentId = sections[0].id;
      for (let i = 0; i < sections.length; i++) {
        const s = sections[i];
        const topAbs = s.offsetTop; // absolute Y relative to document
        if (topAbs <= anchorY) currentId = s.id; else break;
      }
      if (scrollTop <= 2) currentId = sections[0].id;
      setActiveId((prev) => (prev === currentId ? prev : currentId));
    };

    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(compute); } };
    const onResize = onScroll;

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    // initial: force Summary as starting state; compute after first frame
    setActiveId(sections[0].id);
    const raf = requestAnimationFrame(compute);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="page" ref={pageRef}>
      <canvas ref={canvasRef} className="bg-canvas" />
      <div className="bg-glow" />
      <div className="content">
        <HeaderBar profile={profile} activeId={activeId} />
        <div className="layout">
          <Sidebar profile={profile}/>

          <main className="main" data-stagger-group>
            <Section title="Summary" id="summary">
              <p className="muted reveal" data-anim="up" data-lines>{(profile.summary && profile.summary.trim()) ? profile.summary : DEFAULT_PROFILE.summary}</p>
            </Section>

            <Section title="Skills" id="skills">
              <div className="skills-grid" data-stagger-group>
                <div className="soft-card reveal" data-anim="up">
                  <div className="block-title">Frontend</div>
                  <div className="chips" data-stagger-group>{skills.frontend.map(s => <Chip key={s} label={s} />)}</div>
                </div>
                <div className="soft-card reveal" data-anim="up">
                  <div className="block-title">Backend</div>
                  <div className="chips" data-stagger-group>{skills.backend.map(s => <Chip key={s} label={s} />)}</div>
                </div>
                <div className="soft-card reveal" data-anim="up">
                  <div className="block-title">DevOps</div>
                  <div className="chips" data-stagger-group>{skills.devops.map(s => <Chip key={s} label={s} />)}</div>
                </div>
              </div>
            </Section>

            <Section title="Experience" id="experience">
              <div className="stacked" data-stagger-group>
                {experience.map((e) => (
                  <div className="soft-card reveal" data-anim="up" key={e.role + e.company}>
                    <div className="row">
                      <div className="role">{e.role}</div>
                      <div className="period">{e.period}</div>
                    </div>
                    <div className="company">{e.company}</div>
                    <ul className="bullets">
                      {e.bullets.map((b, i) => {
                        const idx = b.indexOf(":");
                        if (idx > 0) {
                          const head = b.slice(0, idx + 1);
                          const tail = b.slice(idx + 1);
                          return (
                            <li key={i}>
                              <strong>{head}</strong>{tail}
                            </li>
                          );
                        }
                        return <li key={i}>{b}</li>;
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Projects" id="projects">
              <div className="cards" data-stagger-group>
                {projects.map((p) => (
                  <div className="soft-card reveal" data-anim="up" key={p.name}>
                    <div className="row">
                      <div className="role">{p.name}</div>
                    </div>
                    <div className="muted" data-lines>{p.desc}</div>
                    <div className="chips mt-2" data-stagger-group>{p.stack.map(s => <Chip key={s} label={s} />)}</div>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Education" id="education">
              <div className="stacked" data-stagger-group>
                {education.map((ed) => (
                  <div className="soft-card reveal" data-anim="up" key={ed.degree+ed.org}>
                    <div className="row">
                      <div className="role">{ed.degree}</div>
                      <div className="period">{ed.years}</div>
                    </div>
                    <div className="company">{ed.org}</div>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Certifications">
              <div className="stacked" data-stagger-group>
                {certs.map((c) => (
                  <div className="soft-card reveal" data-anim="up" key={c.name}>
                    <div className="row">
                      <div className="role">{c.name}</div>
                      <div className="period">{c.year}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Contact" id="contact">
              <div className="contact" data-stagger-group>
                <a href={`mailto:${profile.email}`} className="cta reveal" data-anim="up">Email Me</a>
                {profile.website && <a href={profile.website} className="cta reveal" data-anim="up" target="_blank" rel="noreferrer noopener">Website</a>}
                {profile.github && <a href={profile.github} className="cta reveal" data-anim="up" target="_blank" rel="noreferrer noopener">GitHub</a>}
                {profile.linkedin && <a href={profile.linkedin} className="cta reveal" data-anim="up" target="_blank" rel="noreferrer noopener">LinkedIn</a>}
              </div>
            </Section>
          </main>
        </div>

        <footer className="footer reveal" data-anim="up">© {new Date().getFullYear()} {profile.name} · Built with React + Vite</footer>
      </div>
    </div>
  );
};

export default App;

