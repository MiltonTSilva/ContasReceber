import { useState, useEffect, useMemo, useCallback } from "react";
import type { ReactNode } from "react";
import { GlobalContext } from "./globalContext";
import { supabase } from "../services/supabase";
import type {
  User,
  Session,
  SignInWithPasswordCredentials,
} from "@supabase/supabase-js";

export const GlobalProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Gerencia o estado de autenticação
  useEffect(() => {
    // onAuthStateChange é chamado na inicialização e em cada mudança de estado
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session: Session | null) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signInWithPassword = useCallback(
    async (credentials: SignInWithPasswordCredentials) => {
      setError(null);
      setLoading(true);

      if (
        !("email" in credentials) ||
        !credentials.email ||
        !credentials.password
      ) {
        setError("Email e senha são obrigatórios.");
        setLoading(false);
        return false;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword(
        credentials
      );

      if (signInError) {
        console.error("Erro no login:", signInError);
        setError(
          signInError.message || "Ocorreu um erro ao tentar fazer login."
        );
        setLoading(false); 
        return false; 
      }

      // Em caso de sucesso, o onAuthStateChange vai cuidar do setLoading e do usuário.
      return true;
    },
    []
  );

  const signOut = useCallback(async () => {
    setError(null);
    await supabase.auth.signOut();
  }, []);

  const clearError = useCallback(() => setError(null), []);

  // Memoriza o valor do contexto para evitar re-renderizações desnecessárias
  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      signOut,
      signInWithPassword,
      clearError,
    }),
    [user, loading, error, signOut, signInWithPassword, clearError]
  );

  return (
    <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>
  );
};
