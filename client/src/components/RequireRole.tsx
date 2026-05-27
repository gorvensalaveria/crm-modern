import { AccessDeniedPage } from "../pages/AccessDeniedPage";
import { useDemoUser } from "../state/demo-user";
import { canAccess, type PermissionKey } from "../auth/permissions";

export function RequireRole({
  permission,
  children
}: {
  permission: PermissionKey;
  children: React.ReactNode;
}) {
  const { currentUser } = useDemoUser();

  if (!canAccess(currentUser?.role, permission)) {
    return <AccessDeniedPage permission={permission} />;
  }

  return <>{children}</>;
}

