import { createClient } from "@supabase/supabase-js";

// Configuração do Supabase com variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_URL_NONKEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_URL_NONKEY não estão definidas."
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
