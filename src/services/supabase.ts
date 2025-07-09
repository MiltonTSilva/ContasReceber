import { createClient } from "@supabase/supabase-js";

// É altamente recomendado usar variáveis de ambiente para estas chaves.
// Substitua com a URL e a chave Anon do seu projeto Supabase.
const supabaseUrl = "https://twsirteoilryvfmytblf.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3c2lydGVvaWxyeXZmbXl0YmxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxNDAzMDgsImV4cCI6MjA1OTcxNjMwOH0.j1sa0cJq07E-Gh-KSru16-8rvdhL5_6p8XkCFkOZYG0";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
