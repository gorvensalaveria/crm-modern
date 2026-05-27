import { ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { routePermissions, type PermissionKey } from "../auth/permissions";
import { useDemoUser } from "../state/demo-user";

export function AccessDeniedPage({ permission }: { permission: PermissionKey }) {
  const { currentUser } = useDemoUser();
  const allowedRoles = routePermissions[permission];

  return (
    <div className="rounded-lg border border-black/10 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="rounded-md bg-rose-50 p-3 text-rose-700">
          <ShieldAlert size={24} />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-rose-700">Access denied</p>
          <h1 className="mt-2 text-2xl font-semibold">This demo role cannot open this workspace.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/65">
            Current role: {currentUser?.title ?? "Unknown"}. Allowed roles:{" "}
            {allowedRoles.map((role) => role.replaceAll("_", " ")).join(", ")}.
          </p>
          <Link
            to="/"
            className="mt-5 inline-flex rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-moss"
          >
            Choose another role
          </Link>
        </div>
      </div>
    </div>
  );
}

