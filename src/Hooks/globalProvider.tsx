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

  useEffect(() => {
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
        setLoading(false);
        const err = new Error("Email e senha são obrigatórios.");
        setError(err.message);
        return { data: null, error: err };
      }

      try {
        const response = await supabase.auth.signInWithPassword(credentials);

        if (response.error) {
          setError(response.error.message || "Ocorreu um erro ao tentar fazer login.");
          return { data: null, error: response.error };
        }

        return { data: response.data, error: null };
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e.message);
        return { data: null, error: e };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    setError(null);
    await supabase.auth.signOut();
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const resetPassword = useCallback(async (email: string) => {
    await supabase.auth.resetPasswordForEmail(email);
  }, []);

  const updateUser = useCallback(async (data: Partial<User>) => {
    await supabase.auth.updateUser({ data });
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      signOut,
      signInWithPassword,
      clearError,
      resetPassword,
      updateUser,
    }),
    [
      user,
      loading,
      error,
      signOut,
      signInWithPassword,
      clearError,
      resetPassword,
      updateUser,
    ]
  );

  return (
    <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>
  );
};
