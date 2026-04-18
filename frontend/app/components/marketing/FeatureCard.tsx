import type { ReactNode } from "react";

type FeatureCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon: ReactNode;
};

export default function FeatureCard({
  eyebrow,
  title,
  description,
  icon,
}: FeatureCardProps) {
  return (
    <article className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_24px_80px_-48px_rgba(14,165,233,0.65)] transition duration-300 hover:-translate-y-1 hover:border-blue-400/30 hover:bg-white/[0.05]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/70 to-transparent opacity-60" />
      <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/12 text-blue-300 ring-1 ring-blue-400/20">
        {icon}
      </div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-blue-300/80">
        {eyebrow}
      </p>
      <h3 className="mb-3 text-xl font-semibold text-white">{title}</h3>
      <p className="text-sm leading-7 text-slate-300">{description}</p>
    </article>
  );
}
