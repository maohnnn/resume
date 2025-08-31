import React, { useRef, useState } from "react";
import useParticles from "./hooks/useParticles";
import useAnimeReveal from "./hooks/useAnimeReveal";
import type { Profile } from "./types";

const DEFAULT_PROFILE: Profile = {
  name: "Your Name",
  title: "Full-Stack Developer",
  location: "Bangkok, TH",
  phone: "+66-8x-xxx-xxxx",
  email: "you@email.com",
  summary: "Building reliable, scalable web apps with clean code, great DX, and measurable impact.",
  website: "https://your.site",
  github: "https://github.com/your-handle",
  linkedin: "https://linkedin.com/in/your-handle",
};

const skills = {
  frontend: ["TypeScript", "React", "Next.js", "Vite", "TailwindCSS", "Zustand"],
  backend: ["Node.js", "NestJS", "Express", "PostgreSQL", "MongoDB", "Redis"],
  devops: ["Docker", "CI/CD", "GitHub Actions", "AWS", "Vercel", "k8s (basic)"]
};

const experience = [
  {
    role: "Senior Full‑Stack Developer",
    company: "Siam IoT Co., Ltd.",
    period: "2022 – Present",
    bullets: [
      "Cut TTI ~40% via Module Federation + bundle analysis",
      "Designed and rolled out Design System + Storybook across 4 apps",
      "Built NestJS services with telemetry (logging/trace) and proper observability",
    ],
  },
  {
    role: "Full‑Stack Developer",
    company: "MG Solutions",
    period: "2019 – 2022",
    bullets: [
      "Real‑time dashboards (MQTT/WebSocket) with role‑based access",
      "Migrated Vue 2 → Vue 3 + Vite, reduced build time ~60%",
    ],
  },
];

const projects = [
  {
    name: "Learning Center",
    stack: ["Angular", "SSR", "M3"],
    desc: "SEO‑friendly learning platform with server‑side rendering and modular architecture.",
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

const HeaderBar: React.FC<{ profile: Profile }>=({ profile })=> (
  <header className="header glass reveal" data-anim="down">
    <div className="header-main">
      <div className="title reveal" data-anim="right">{profile.name}</div>
      <div className="subtitle reveal" data-anim="right">{profile.title} · {profile.location}</div>
    </div>
    <nav className="header-nav" data-stagger-group>
      <a className="reveal" data-anim="down" href="#summary">Summary</a>
      <a className="reveal" data-anim="down" href="#skills">Skills</a>
      <a className="reveal" data-anim="down" href="#experience">Experience</a>
      <a className="reveal" data-anim="down" href="#projects">Projects</a>
      <a className="reveal" data-anim="down" href="#education">Education</a>
      <a className="reveal" data-anim="down" href="#contact">Contact</a>
    </nav>
  </header>
);

const Sidebar: React.FC<{ profile: Profile }>=({ profile })=> (
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
        {skills.frontend.slice(0,4).map(s => <Chip key={s} label={s} />)}
      </div>
    </div>
  </aside>
);

const Chip: React.FC<{ label: string }> = ({ label }) => (
  <span className="chip reveal" data-anim="up">{label}</span>
);

const Section: React.FC<{ title: string; children: React.ReactNode; id?: string }>=({ title, children, id })=> (
  <section className="glass section reveal" data-anim="up" id={id}>
    <h2 className="section-title">{title}</h2>
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
      return { ...DEFAULT_PROFILE, ...parsed } as Profile;
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  const pageRef = useRef<HTMLDivElement | null>(null);
  useAnimeReveal(pageRef.current || undefined);

  return (
    <div className="page" ref={pageRef}>
      <canvas ref={canvasRef} className="bg-canvas" />
      <div className="content">
        <HeaderBar profile={profile} />

        <div className="layout">
          <Sidebar profile={profile} />

          <main className="main" data-stagger-group>
            <Section title="Summary" id="summary">
              <p className="muted reveal" data-anim="up">{profile.summary}</p>
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
                      {e.bullets.map((b, i) => <li key={i}>{b}</li>)}
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
                    <div className="muted">{p.desc}</div>
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

