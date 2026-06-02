import type { LucideIcon } from "lucide-react";

export function MetricCard({
  label,
  value,
  helper,
  icon: Icon
}: {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
}) {
  return (
    <div className="relative rounded-lg border border-black/10 bg-white p-5 shadow-sm">
      <div className="pr-12">
        <div>
          <p className="text-sm font-medium text-ink/60">{label}</p>
          <p className="mt-2 text-3xl font-semibold">{value}</p>
        </div>
        <p className="mt-4 text-sm text-ink/55">{helper}</p>
      </div>
      <div className="absolute right-5 top-5 rounded-md bg-mint p-2 text-moss">
        <Icon size={20} />
      </div>
    </div>
  );
}
