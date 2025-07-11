import { useState, useEffect, useCallback } from "react";
import { Main } from "../../Components/Main/Main";
import style from "./clientesForm.module.css";
import { supabase } from "../../services/supabase";
import { useNavigate, useParams } from "react-router-dom";
import { useGlobalState } from "../../Hooks/useGlobalState";

export function ClientesForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const [name, setName] = useState("");
  const { user } = useGlobalState();
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCliente = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("customer")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        setName(data.name);
        setEmail(data.email);
        setMobile(data.mobile);
        setActive(data.active);
      }
    } catch (error) {
      setError((error as Error).message);
      console.error("Erro ao buscar cliente:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEditing) {
      fetchCliente();
    }
  }, [isEditing, fetchCliente]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!user) throw new Error("Usuário não autenticado.");

      const customerData = { name, email, mobile, active, user_id: user.id };

      if (isEditing) {
        const { error } = await supabase
          .from("customer")
          .update(customerData)
          .eq("id", id);
        if (error) throw error;
        alert("Cliente atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from("customer")
          .insert([customerData]);
        if (error) throw error;
        alert("Cliente cadastrado com sucesso!");
      }
      navigate("/clientes");
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Main>
      <div className={style.container}>
        <div className={style.card}>
          <h2 className={style.title}>
            {isEditing ? "Editar Cliente" : "Cadastro de Clientes"}
          </h2>

          <form className={style.form} onSubmit={handleSubmit}>
            <p className={style.subtitle}>Informe os dados abaixo.</p>
            <input
              className={style.input}
              type="text"
              placeholder="Digite o nome."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              className={style.input}
              type="email"
              placeholder="Digite o email."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className={style.input}
              type="tel"
              placeholder="Digite o celular."
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              required
            />
            <div className={style.checkboxContainer}>
              <input
                id="active"
                className={style.inputCheckbox}
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              <label htmlFor="active" className={style.label}>
                Ativo
              </label>
            </div>

            <div className={style.actions}>
              <button className={style.button} type="submit" disabled={loading}>
                {loading
                  ? isEditing
                    ? "Salvando..."
                    : "Cadastrando..."
                  : "Salvar"}
              </button>

              <button
                type="reset"
                className={style.button}
                onClick={() => navigate("/clientes")}
              >
                Retornar
              </button>
            </div>

            {error && <p className={style.error}>{error}</p>}
          </form>
        </div>
      </div>
    </Main>
  );
}
