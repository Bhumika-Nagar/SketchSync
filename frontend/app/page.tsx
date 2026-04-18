import Link from "next/link";

import FeatureCard from "./components/marketing/FeatureCard";
import SectionTitle from "./components/marketing/SectionTitle";

const featureCards = [
  {
    eyebrow: "Live Presence",
    title: "See every stroke happen in real time",
    description:
      "Cursors, edits, and room activity stay synchronized so teams can sketch together without version drift or awkward refresh loops.",
    icon: (
      <svg
        aria-hidden="true"
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M4 12h4l2-5 4 10 2-5h4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    eyebrow: "Precision Tools",
    title: "Shapes, flow, and quick ideation in one board",
    description:
      "Move from rough thinking to structured diagrams with drawing tools that keep the experience lightweight and fast.",
    icon: (
      <svg
        aria-hidden="true"
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <rect x="4" y="4" width="7" height="7" rx="1.5" />
        <circle cx="17" cy="7.5" r="3.5" />
        <path d="M6 18h12m-3-5 3 5 3-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    eyebrow: "Room Based",
    title: "Create focused spaces for every session",
    description:
      "Jump into a room, invite collaborators, and keep each planning sprint, brainstorm, or review isolated and easy to revisit.",
    icon: (
      <svg
        aria-hidden="true"
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M5 19V8.5A2.5 2.5 0 0 1 7.5 6H19" strokeLinecap="round" />
        <path d="M9 19V5.5A2.5 2.5 0 0 1 11.5 3H17a2 2 0 0 1 2 2V19" strokeLinecap="round" />
        <path d="M4 19h16" strokeLinecap="round" />
      </svg>
    ),
  },
];

const metrics = [
  { value: "Instant", label: "room access" },
  { value: "Live", label: "collaboration" },
  { value: "Focused", label: "dark UI" },
];

const workflow = [
  {
    step: "01",
    title: "Open a room",
    description: "Launch a dedicated board for a sprint review, wireframe jam, or whiteboard interview.",
  },
  {
    step: "02",
    title: "Draw together",
    description: "Share structure visually with fluid sketching, quick shapes, and immediate sync across collaborators.",
  },
  {
    step: "03",
    title: "Ship the idea",
    description: "Move from scattered discussion to aligned decisions with one shared source of visual truth.",
  },
];

const linkButtonBase =
  "inline-flex items-center justify-center rounded-xl px-7 py-3 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950";

const primaryLinkButton = `${linkButtonBase} bg-blue-600 text-white shadow-[0_12px_30px_-16px_rgba(37,99,235,0.95)] hover:bg-blue-500 focus-visible:ring-blue-400/60`;
const secondaryLinkButton = `${linkButtonBase} bg-white/6 text-slate-100 ring-1 ring-white/10 hover:bg-white/10 focus-visible:ring-white/20`;
const ghostLinkButton = `${linkButtonBase} bg-transparent text-slate-200 ring-1 ring-white/12 hover:bg-white/6 focus-visible:ring-blue-400/40`;

export default function Home() {
  return (
    <main className="relative isolate overflow-hidden bg-[#05070b] text-white">
      <div className="absolute inset-0 -z-10 bg-radial-gradient(circle_at_top_left,_rgba(59,130,246,0.22),_transparent_30%),radial-gradient(circle_at_80%_10%,_rgba(14,165,233,0.16),_transparent_24%),linear-gradient(180deg,_#0a0f18_0%,_#05070b_55%,_#05070b_100%)" />
      <div className="absolute inset-x-0 top-0 -z-10 h-520px bg-linear-gradient(135deg,_rgba(59,130,246,0.14),_transparent_50%)" />
      <div className="absolute left-1/2 top-24 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />

      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 pb-20 pt-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between rounded-full border border-white/10 bg-white/0.03 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/15 text-sm font-semibold text-blue-200 ring-1 ring-blue-400/25">
              SS
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[0.22em] text-white">SketchSync</p>
              <p className="text-xs text-slate-400">Collaborative canvas for fast teams</p>
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
            <a href="#features" className="transition hover:text-white">
              Features
            </a>
            <a href="#workflow" className="transition hover:text-white">
              Workflow
            </a>
            <Link href="/login" className="transition hover:text-white">
              Sign in
            </Link>
          </nav>
        </header>

        <div className="grid flex-1 items-center gap-14 py-20 lg:grid-cols-[1.08fr_0.92fr] lg:py-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-blue-200">
              Built for collaborative thinking
            </div>

            <h1 className="mt-8 text-5xl font-semibold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
              A sharper whiteboard experience for black-and-blue product teams.
            </h1>

            <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
              SketchSync turns scattered ideas into live visual sessions with a clean dark interface, room-based collaboration, and a faster path from sketch to alignment.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link href="/signup" className={`${primaryLinkButton} min-w-40`}>
                Start Free
              </Link>
              <Link href="/login" className={`${secondaryLinkButton} min-w-40`}>
                Enter Workspace
              </Link>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-2xl border border-white/10 bg-white/0.03 px-5 py-4"
                >
                  <p className="text-2xl font-semibold text-white">{metric.value}</p>
                  <p className="mt-1 text-sm text-slate-400">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-32px bg-blue-500/10 blur-2xl" />
            <div className="relative overflow-hidden rounded-32px border border-white/10 bg-[#0a0f18]/90 p-5 shadow-[0_36px_100px_-44px_rgba(37,99,235,0.75)] backdrop-blur">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-rose-400/90" />
                  <span className="h-3 w-3 rounded-full bg-amber-300/90" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400/90" />
                </div>
                <div className="rounded-full border border-white/10 bg-white/0.03 px-3 py-1 text-xs text-slate-400">
                  session.sketchsync
                </div>
              </div>

              <div className="mt-6 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="relative min-h-360px overflow-hidden rounded-28px border border-white/10 bg-linear-gradient(160deg,_rgba(15,23,42,0.95),_rgba(15,23,42,0.72))">
                  <div className="absolute left-6 top-6 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-200">
                    Product planning board
                  </div>

                  <div className="absolute left-10 top-24 h-28 w-44 rounded-[28px] border border-blue-400/30 bg-blue-500/10" />
                  <div className="absolute right-10 top-24 h-36 w-36 rounded-full border border-cyan-300/25 bg-cyan-400/10" />
                  <div className="absolute bottom-16 left-12 h-24 w-52 rounded-[26px] border border-white/10 bg-white/0.03" />
                  <div className="absolute bottom-24 right-14 h-2 w-40 rotate-[-18deg] rounded-full bg-blue-300/80 shadow-[0_0_28px_rgba(96,165,250,0.75)]" />
                  <div className="absolute bottom-28 right-20 h-2 w-24 rotate-14deg rounded-full bg-cyan-200/80" />

                  <svg
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full opacity-40"
                    viewBox="0 0 420 360"
                    fill="none"
                  >
                    <path
                      d="M60 220C110 150 170 170 215 125C255 85 310 98 355 70"
                      stroke="rgba(96,165,250,0.85)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray="8 10"
                    />
                    <path
                      d="M70 290C125 240 195 260 240 218C278 182 317 192 352 160"
                      stroke="rgba(186,230,253,0.55)"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <div className="space-y-4">
                  <div className="rounded-24px border border-white/10 bg-white/0.04 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-300/80">
                      Active collaborators
                    </p>
                    <div className="mt-4 flex -space-x-3">
                      {["AN", "MK", "RS", "JD"].map((person) => (
                        <div
                          key={person}
                          className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-900 bg-slate-700 text-xs font-semibold text-white"
                        >
                          {person}
                        </div>
                      ))}
                    </div>
                    <p className="mt-4 text-sm leading-7 text-slate-300">
                      Four teammates are sketching in the same room with live cursor presence and instant updates.
                    </p>
                  </div>

                  <div className="rounded-24px border border-white/10 bg-blue-500/0.08 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-200/80">
                      Utilities
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-200">
                      {["Draw", "Shapes", "Rooms", "Sync"].map((item) => (
                        <div
                          key={item}
                          className="rounded-2xl border border-blue-400/15 bg-slate-950/50 px-4 py-3"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-24px border border-white/10 bg-white/0.04 p-5">
                    <p className="text-xs font-semibold uppercase tracking-0.28em text-slate-400">
                      Fast handoff
                    </p>
                    <p className="mt-3 text-lg font-medium text-white">
                      Keep discussion, structure, and decisions in one visual thread.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto w-full max-w-7xl px-6 py-20 sm:px-8 lg:px-10">
        <SectionTitle
          eyebrow="Features"
          title="Designed to look premium while staying practical under pressure."
          description="The visual system keeps the interface dark, focused, and high-contrast while blue utilities guide attention where action matters."
          align="center"
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {featureCards.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </section>

      <section id="workflow" className="mx-auto w-full max-w-7xl px-6 py-20 sm:px-8 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <SectionTitle
            eyebrow="Workflow"
            title="A landing page that matches the product mood."
            description="Instead of a generic startup layout, the homepage now leans into a darker editorial look with product framing, layered cards, and a stronger visual rhythm."
          />

          <div className="space-y-4">
            {workflow.map((item) => (
              <div
                key={item.step}
                className="rounded-[26px] border border-white/10 bg-white/0.03 p-6 sm:p-7"
              >
                <div className="flex items-start gap-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/12 text-sm font-semibold text-blue-200 ring-1 ring-blue-400/20">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                    <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 pb-24 sm:px-8 lg:px-10">
        <div className="overflow-hidden rounded-[34px] border border-white/10 bg-linear-gradient(135deg,_rgba(10,15,24,0.94),_rgba(17,24,39,0.98)) px-6 py-10 sm:px-10 sm:py-12">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-300/80">
                Ready to sketch
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Launch a room and give the frontend a first impression worth keeping.
              </h2>
              <p className="mt-5 text-base leading-8 text-slate-300">
                The page now feels aligned with the black-gray palette and blue utility accents instead of reading like a default starter template.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href="/signup" className={`${primaryLinkButton} min-w-40`}>
                Create Account
              </Link>
              <Link href="/dashboard" className={`${ghostLinkButton} min-w-40`}>
                Open Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
