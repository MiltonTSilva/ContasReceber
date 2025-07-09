import React, { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { GlobalContext } from "./globalContext";
import { supabase } from "../services/supabase";
import type { Session, User } from "@supabase/supabase-js";
import type { SignInCredentials } from "../Types/GlobalTypes";

export const GlobalProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Verifica se há um usuário autenticado ao carregar o app
  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // Listener para mudanças na autenticação
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

  const signInWithPassword = async ({ email, password }: SignInCredentials) => {
    if (!email || !password) {
      alert("Email e senha são obrigatórios.");
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    loading,
    signOut,
    signInWithPassword,

  };

  return (

    <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>
  );
};
