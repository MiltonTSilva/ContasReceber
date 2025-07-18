import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import { useGlobalState } from "./useGlobalState";

export const useAdmin = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user, loading: userLoading } = useGlobalState();

  useEffect(() => {
    if (userLoading) {
      setLoading(true);
      return;
    }

    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const checkAdminStatus = async () => {
      try {
        const { data: profileData, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        setIsAdmin(profileData?.role === "admin");
      } catch (error) {
        throw new Error(
          "Erro ao verificar o status de administrador: " + error
        );
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user, userLoading]);

  return { isAdmin, loading };
};
