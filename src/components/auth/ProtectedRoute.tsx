import { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { useBackofficeMember } from "@/hooks/queries/useBackofficeMember";
import { useAuth } from "@/hooks/use-auth";

type ProtectedRouteProps = {
  element: ReactElement;
  /**
   * Legado: preferir `BackofficeAccessRoute` nas rotas do App.
   * `admin` = vínculo em `backoffice_team_members` (não `lxp_profiles.role`).
   */
  requiredRole?: "student" | "admin" | "staff" | string;
};

export const ProtectedRoute = ({ element, requiredRole }: ProtectedRouteProps) => {
  const { session, loading: authLoading } = useAuth();
  const { data: member, isLoading: memberLoading } = useBackofficeMember();

  if (authLoading || (requiredRole === "admin" && memberLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Carregando...
      </div>
    );
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

