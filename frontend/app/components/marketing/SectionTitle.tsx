type SectionTitleProps = {
  eyebrow: string;
  title: string;
  description: string;
  align?: "left" | "center";
};

export default function SectionTitle({
  eyebrow,
  title,
  description,
  align = "left",
}: SectionTitleProps) {
  const alignment = align === "center" ? "text-center mx-auto" : "";

  return (
    <div className={["max-w-2xl", alignment].join(" ").trim()}>
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.35em] text-blue-300/80">
        {eyebrow}
      </p>
      <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        {title}
      </h2>
      <p className="mt-5 text-base leading-8 text-slate-300">{description}</p>
    </div>
  );
}
