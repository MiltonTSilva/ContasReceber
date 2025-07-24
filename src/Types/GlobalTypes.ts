import type {
  SignInWithPasswordCredentials,
  User,
} from "@supabase/supabase-js";

export type Theme = "light" | "dark";

export interface GlobalContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  signOut: () => Promise<void>;
  theme: Theme;
  toggleTheme: () => void;
  signInWithPassword: (
    credentials: SignInWithPasswordCredentials,
  ) => Promise<boolean>;
}
