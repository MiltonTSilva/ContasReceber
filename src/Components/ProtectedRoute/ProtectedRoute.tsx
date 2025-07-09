import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useGlobalState } from "../../Hooks/useGlobalState";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useGlobalState();

  if (loading) {
    // Mostra uma mensagem de carregamento enquanto a sessão é verificada
    return <div>Carregando...</div>;
  }

  if (!user) {
    // Se não houver usuário, redireciona para a página de login
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}