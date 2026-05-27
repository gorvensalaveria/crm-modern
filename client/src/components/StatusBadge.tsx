const toneByStatus: Record<string, string> = {
  SIGNED: "bg-emerald-100 text-emerald-800",
  CLEAR: "bg-emerald-100 text-emerald-800",
  PAID: "bg-emerald-100 text-emerald-800",
  VERIFIED: "bg-emerald-100 text-emerald-800",
  SENT: "bg-blue-100 text-blue-800",
  RECEIVED: "bg-blue-100 text-blue-800",
  OPEN: "bg-blue-100 text-blue-800",
  DOCUMENTS: "bg-blue-100 text-blue-800",
  LODGEMENT: "bg-violet-100 text-violet-800",
  INTAKE: "bg-amber-100 text-amber-800",
  PENDING: "bg-amber-100 text-amber-800",
  REQUESTED: "bg-amber-100 text-amber-800",
  ESCALATE: "bg-rose-100 text-rose-800",
  BLOCKED: "bg-rose-100 text-rose-800"
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        toneByStatus[status] ?? "bg-slate-100 text-slate-700"
      ].join(" ")}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

