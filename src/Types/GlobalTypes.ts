import type {
  User,
  SignInWithPasswordCredentials,
} from "@supabase/supabase-js";

export type { SignInWithPasswordCredentials };

export interface GlobalContextType {
  user: User | null; // O usuário autenticado ou nulo
  loading: boolean; // Estado de carregamento da sessão
  error: string | null; // Mensagem de erro, se houver
  clearError: () => void; // Função para limpar erros
  signOut: () => Promise<void>; // Função para fazer logout
  signInWithPassword: (
    credentials: SignInWithPasswordCredentials
  ) => Promise<boolean>; // Função para fazer login
}
