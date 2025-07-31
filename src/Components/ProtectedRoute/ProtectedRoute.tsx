import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useGlobalState } from "../../Hooks/useGlobalState";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useGlobalState();

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
