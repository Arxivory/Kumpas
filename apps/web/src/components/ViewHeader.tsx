export function ViewHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="mb-10">
      <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</div>
      <h1 className="mt-2 font-display text-4xl leading-[1.05] sm:text-5xl">{title}</h1>
      {subtitle ? (
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">{subtitle}</p>
      ) : null}
    </header>
  );
}
