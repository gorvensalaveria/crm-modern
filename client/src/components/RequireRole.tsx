import { AccessDeniedPage } from "../pages/AccessDeniedPage";
import { useCurrentUser } from "../state/current-user";
import { canAccess, type PermissionKey } from "../auth/permissions";

export function RequireRole({
  permission,
  children
}: {
  permission: PermissionKey;
  children: React.ReactNode;
}) {
  const { currentUser } = useCurrentUser();

  if (!canAccess(currentUser?.role, permission)) {
    return <AccessDeniedPage permission={permission} />;
  }

  return <>{children}</>;
}
