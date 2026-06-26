import { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { AppBootstrapScreen } from "@/components/states/AppBootstrapScreen";
import { useBackofficeMember } from "@/hooks/queries/useBackofficeMember";
import { useAuth } from "@/hooks/use-auth";
import { isQueryBootstrapping } from "@/lib/routeGuard";

type ProtectedRouteProps = {
  element: ReactElement;
  /**
   * Legado: preferir `BackofficeAccessRoute` nas rotas do App.
   * `admin` = vínculo em `backoffice_team_members` (não `lxp_profiles.role`).
   */
  requiredRole?: "student" | "admin" | "staff" | string;
};

export const ProtectedRoute = ({ element, requiredRole }: ProtectedRouteProps) => {
  const { session, loading: authBootstrapping } = useAuth();
  const { data: member, isPending: memberPending } = useBackofficeMember();
  const memberBootstrapping =
    requiredRole === "admin" && isQueryBootstrapping(memberPending, member ?? undefined);

  if (authBootstrapping || memberBootstrapping) {
    return <AppBootstrapScreen />;
  }

  if (!session) {
    return <Navigate to="/admin/login" replace />;
  }

  if (requiredRole === "admin" && !member) {
    return <Navigate to="/admin/login" replace />;
  }

  if (requiredRole && requiredRole !== "admin") {
    return <Navigate to="/admin/login" replace />;
  }

  return element;
};
