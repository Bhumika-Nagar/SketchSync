import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  title?: string;
  className?: string;
  contentClassName?: string;
  centered?: boolean;
};

export default function Card({
  children,
  title,
  className = "",
  contentClassName = "",
  centered = true,
}: CardProps) {
  return (
    <div
      className={[
        centered
          ? "flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10"
          : "",
        className,
      ].join(" ")}
    >
      <div
        className={[
          "w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.95)] backdrop-blur",
          contentClassName,
        ].join(" ")}
      >
        {title ? (
          <h1 className="mb-6 text-center text-2xl font-semibold text-white">
            {title}
          </h1>
        ) : null}
        {children}
      </div>
    </div>
  );
}
