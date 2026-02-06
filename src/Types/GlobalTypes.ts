import type {
  User,
  SignInWithPasswordCredentials,
} from "@supabase/supabase-js";

export type { SignInWithPasswordCredentials };

export interface GlobalContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  signOut: () => Promise<void>;
  signInWithPassword: (
    credentials: SignInWithPasswordCredentials
  ) => Promise<{ data: any | null; error: any | null }>;
  resetPassword: (email: string) => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
}
