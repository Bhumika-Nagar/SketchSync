import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
  variant?: "primary" | "secondary" | "ghost";
};

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-blue-600 text-white shadow-[0_12px_30px_-16px_rgba(37,99,235,0.95)] hover:bg-blue-500 focus-visible:ring-blue-400/60",
  secondary:
    "bg-white/6 text-slate-100 ring-1 ring-white/10 hover:bg-white/10 focus-visible:ring-white/20",
  ghost:
    "bg-transparent text-slate-200 ring-1 ring-white/12 hover:bg-white/6 focus-visible:ring-blue-400/40",
};

export default function Button({
  children,
  className = "",
  fullWidth = true,
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        "inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
        fullWidth ? "w-full" : "w-auto",
        variantClasses[variant],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
