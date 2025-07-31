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
        throw new Error("Email e senha são obrigatórios.");
      }

      const { error: signInError } = await supabase.auth.signInWithPassword(
        credentials
      );

      if (signInError) {
        setLoading(false);
        throw new Error(
          signInError.message || "Ocorreu um erro ao tentar fazer login."
        );
      }

      setLoading(false);
      return true;
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
