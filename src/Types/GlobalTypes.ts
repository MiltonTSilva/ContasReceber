import type { User } from "@supabase/supabase-js";


export interface SignInCredentials {
  email: string;
  password?: string;
}

export interface GlobalContextType {
  user: User | null; // O usuário autenticado ou nulo
  loading: boolean; // Estado de carregamento da sessão
  signOut: () => Promise<void>; // Função para fazer logout
  signInWithPassword: (credentials: SignInCredentials) => Promise<void>; // Função para fazer login
}
