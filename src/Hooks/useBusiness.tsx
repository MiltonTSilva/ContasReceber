import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import { useGlobalState } from "./useGlobalState";

export function useBusinessId() {
  const { user } = useGlobalState(); // aqui vem o auth.uid()
  const [businessId, setBusinessId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBusinessId() {
      if (!user) {
        setBusinessId(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("business_id")
        .eq("id", user.id) // id do usuário logado
        .single();

      if (error) {
        console.error("Erro ao buscar business_id:", error);
        setBusinessId(null);
      } else {
        setBusinessId(data?.business_id || null);
      }
      setLoading(false);
    }

    fetchBusinessId();
  }, [user]);

  return { businessId, loading };
}
