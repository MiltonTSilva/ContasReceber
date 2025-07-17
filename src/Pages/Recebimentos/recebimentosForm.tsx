import { useState, useEffect, useRef, useCallback } from "react";
import { Main } from "../../Components/Main/Main";
import style from "./recebimentosForm.module.css";
import { supabase } from "../../services/supabase";
import { useNavigate, useParams } from "react-router-dom";
import { useGlobalState } from "../../Hooks/useGlobalState";
import Dialogs from "../../Components/Dialogs/Dialogs/Dialogs";
import MoneyInput from "../../Components/UI/MoneyInput/MoneyInput";
import type { Cliente } from "../../Types/ClientesTypes";

export function RecebimentosForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const { user } = useGlobalState();

  const [clientes, setClientes] = useState<Cliente[]>([]);

  const [received_date, setReceivedDate] = useState("");
  const [payment_received_at, setPaymentReceivedAt] = useState("");
  const [amount_to_receive, setAmountToReceive] = useState("");
  const [costumer_id, setCostumerId] = useState("");
  const [active, setActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const costumerIdInputRef = useRef<HTMLSelectElement | null>(null);

  const unformatMoney = (value: string): number => {
    if (!value) return 0;
    const sanitizedValue = value.replace(/\D/g, "");
    if (sanitizedValue === "") return 0;
    return parseFloat(sanitizedValue) / 100;
  };

  const fetchrecebimento = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("accounts_receivable")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        setReceivedDate(data.received_date || "");
        setPaymentReceivedAt(data.payment_received_at || "");
        setAmountToReceive(
          new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(data.amount_to_receive || 0)
        );
        setCostumerId(data.costumer_id);
        setActive(data.active);
      }
    } catch (error) {
      setError((error as Error).message);
      console.error("Erro ao buscar recebimento:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchcliente = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("customer")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;

      setClientes(data || []);
    } catch (error) {
      setError((error as Error).message);
      console.error("Erro ao buscar dados do cliente:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isEditing) {
      fetchrecebimento();
    }
  }, [isEditing, fetchrecebimento]);

  useEffect(() => {
    fetchcliente();
  }, [fetchcliente]);

  useEffect(() => {
    costumerIdInputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!user) throw new Error("Usuário não autenticado.");

      const accounts_receivableData = {
        received_date,
        payment_received_at: payment_received_at || null,
        amount_to_receive: unformatMoney(amount_to_receive),
        costumer_id: costumer_id,
        active,
        user_id: user.id,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("accounts_receivable")
          .update(accounts_receivableData)
          .eq("id", id);
        if (error) throw error;
        setDialogMessage("Recebimento atualizado com sucesso!");
        setIsSuccessDialogOpen(true);
      } else {
        const { error } = await supabase
          .from("accounts_receivable")
          .insert([accounts_receivableData]);
        if (error) throw error;
        setDialogMessage("Recebimento cadastrado com sucesso!");
        setIsSuccessDialogOpen(true);
        setCostumerId("");
        setAmountToReceive("");
        setReceivedDate("");
        setPaymentReceivedAt("");
        setActive(true);
      }
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setIsSuccessDialogOpen(false);
  };

  return (
    <Main>
      <div className={style.container}>
        <h2 className={style.title}>
          {isEditing ? "Editar recebimento" : "Cadastro de recebimentos"}
        </h2>
        <div className={style.card}>
          <form className={style.form} onSubmit={handleSubmit}>
            <div>
              <label className={style.label}>
                Cliente:
                <select
                  name="costumerId"
                  ref={costumerIdInputRef}
                  className={style.input}
                  value={costumer_id}
                  onChange={(e) => setCostumerId(e.target.value)}
                  required
                >
                  <option value="">Selecione</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className={style.label}>
              Data de recebimento:
              <input
                name="received_date"
                className={style.input}
                type="date"
                placeholder="Digite data de recebimento."
                value={received_date}
                onChange={(e) => setReceivedDate(e.target.value)}
                required
              />
            </label>
            <label className={style.label}>
              Data de pagamento:
              <input
                className={style.input}
                type="date"
                placeholder="Digite data de pagamento."
                value={payment_received_at}
                onChange={(e) => setPaymentReceivedAt(e.target.value)}
              />
            </label>
            <label className={style.label}>
              Valor a receber:
              <MoneyInput
                value={amount_to_receive}
                className={style.input}
                onChange={setAmountToReceive}
              />
            </label>
            <label className={style.label}>
              Status:
              <div className={style.checkboxContainer} tabIndex={0}>
                <input
                  className={style.inputCheckbox}
                  id="active"
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                />
                Ativo
              </div>
            </label>
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
                onClick={() => navigate("/recebimentos")}
              >
                Retornar
              </button>
            </div>

            {error && <p className={style.error}>{error}</p>}
          </form>
        </div>
      </div>

      <Dialogs
        title="Sucesso"
        isOpen={isSuccessDialogOpen}
        onClose={handleCloseDialog}
        titleColor="green"
        footer={
          <button className={style.button} onClick={handleCloseDialog}>
            OK
          </button>
        }
      >
        <p>{dialogMessage}</p>
      </Dialogs>
    </Main>
  );
}
