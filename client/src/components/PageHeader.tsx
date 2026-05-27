export function PageHeader({
  eyebrow,
  title,
  description
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-moss">{eyebrow}</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-normal">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/65">{description}</p>
    </div>
  );
}

