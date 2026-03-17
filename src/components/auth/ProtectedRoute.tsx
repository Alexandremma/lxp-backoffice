import { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

type ProtectedRouteProps = {
  element: ReactElement;
  requiredRole?: "student" | "admin" | "staff" | string;
};

export const ProtectedRoute = ({ element, requiredRole }: ProtectedRouteProps) => {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (!session) {
    // No backoffice ainda não temos tela específica de login admin,
    // então podemos redirecionar para "/" (ou futura rota /admin/login).
    return <Navigate to="/" replace />;
  }

  if (requiredRole && profile && profile.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return element;
};

