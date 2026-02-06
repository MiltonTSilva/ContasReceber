import { useState, useEffect, useRef, useCallback } from "react";
import { Main } from "../../Components/Main/Main";
import style from "./vendasForm.module.css";
import { supabase } from "../../services/supabase";
import { useNavigate, useParams } from "react-router-dom";
import { useGlobalState } from "../../Hooks/useGlobalState";
import Dialogs from "../../Components/Dialogs/Dialogs/Dialogs";
import MoneyInput from "../../Components/MoneyInput/MoneyInput";
import type { Cliente } from "../../Types/ClientesTypes";
import { useGeminiTranslation } from "../../Hooks/useGeminiTranslation";
import { ErrorDialogs } from "../../Components/Dialogs/ErrorDialogs/ErrorDialogs";
import { Button } from "../../Components/Button/Button";
import "../../index.css";
import { useAdmin } from "../../Hooks/useAdmin";
import { FaEdit } from "react-icons/fa";
import { LuReceipt } from "react-icons/lu";
import { MdAssignmentReturn, MdOutlineSave } from "react-icons/md";
import { useBusinessId } from "../../Hooks/useBusiness";

export function VendasForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const { user } = useGlobalState();

  const [clientes, setClientes] = useState<Cliente[]>([]);

  const [received_date, setReceivedDate] = useState("");
  const [payment_received_at, setPaymentReceivedAt] = useState("");
  const [amount_to_receive, setAmountToReceive] = useState("");
  const [custumer_id, setcustumerId] = useState("");
  const [active, setActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const custumerIdSelectRef = useRef<HTMLSelectElement | null>(null);
  const { isAdmin } = useAdmin();
  const { businessId } = useBusinessId();

  const {
    translate: geminiTranslate,
    translatedText,
    error: translationError,
  } = useGeminiTranslation();

  const unformatMoney = (value: string): number => {
    if (!value) return 0;
    const sanitizedValue = value.replace(/\D/g, "");
    if (sanitizedValue === "") return 0;
    return parseFloat(sanitizedValue) / 100;
  };

  const fetchvendas = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("accounts_receivable_view")
        .select("*")
        .eq("id", id.trim())
        .single();

      if (error) throw error;

      if (data) {
        setReceivedDate(data.received_date || "");
        setPaymentReceivedAt(data.payment_received_at || "");
        setAmountToReceive(
          new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(data.amount_to_receive || 0),
        );
        setcustumerId(data.custumer_id);
        setActive(data.active);
      }
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchcliente = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from("customer").select("*");

      if (!isAdmin) {
        query = query.eq("active", true);
      }

      const { data, error } = await query.order("name", {
        ascending: true,
      });

      if (error) throw error;

      setClientes(data || []);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin, businessId]);

  useEffect(() => {
    if (isEditing) {
      fetchvendas();
    }
  }, [isEditing, fetchvendas]);

  useEffect(() => {
    fetchcliente();
  }, [fetchcliente]);

  useEffect(() => {
    custumerIdSelectRef.current?.focus();
  }, []);

  const translateError = useCallback(
    (error: string) => {
      geminiTranslate(error, "português do Brasil");
      if (translationError) {
        throw new Error("Erro na tradução: " + translationError);
      }
    },
    [geminiTranslate, translationError],
  );

  useEffect(() => {
    if (error) {
      translateError(error);
    }
  }, [error, translateError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!user) throw new Error("Usuário não autenticado.");

      if (loading && !businessId) {
        throw new Error("Erro ao identificar a empresa do usuário logado.");
      }
      const accounts_receivableData = {
        received_date,
        payment_received_at: payment_received_at || null,
        amount_to_receive: unformatMoney(amount_to_receive),
        custumer_id: custumer_id,
        active,
        business_id: businessId,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("accounts_receivable")
          .update(accounts_receivableData)
          .eq("id", id);

        if (error) throw error;
        setDialogMessage("Vendas atualizado com sucesso!");
        setIsSuccessDialogOpen(true);
      } else {
        const { error } = await supabase
          .from("accounts_receivable")
          .insert([accounts_receivableData]);
        if (error) throw error;
        setDialogMessage("Vendas cadastrado com sucesso!");
        setIsSuccessDialogOpen(true);
        setcustumerId("");
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
    if (isEditing) navigate("/vendas");
  };

  return (
    <Main>
      <div className={style.container}>
        <p className={style.title}>
          {isEditing ? <FaEdit /> : <LuReceipt />}
          {isEditing ? " Editar Vendas" : " Cadastro de vendas"}
        </p>
        <hr className={"separator"} />
        <div className={style.card}>
          <form className={`${style.form}`} onSubmit={handleSubmit}>
            <label className={style.label}>
              Cliente:
              <select
                name="custumerId"
                ref={custumerIdSelectRef}
                className={style.input}
                value={custumer_id}
                onChange={(e) => setcustumerId(e.target.value)}
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

            <label className={style.label}>
              Data de vendas:
              <input
                name="received_date"
                className={style.input}
                type="date"
                placeholder="Digite data de vendas."
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

            <div className={`${style.actions} ${"actions"}`}>
              <Button
                type="reset"
                variant="bg-cancel"
                onClick={() => navigate("/vendas")}
                title="Voltar para lista de Vendas"
              >
                <MdAssignmentReturn size={28} />
                Voltar para lista
              </Button>
              <Button
                variant="bg-primary"
                type="submit"
                disabled={loading || error !== null}
                title="Salvar Vendas"
              >
                <MdOutlineSave size={28} />
                Salvar Vendas
              </Button>
            </div>
          </form>
        </div>
      </div>

      <Dialogs
        title="Sucesso"
        isOpen={isSuccessDialogOpen}
        onClose={handleCloseDialog}
        titleColor="green"
        footer={
          <Button
            variant="bg-primary"
            type="button"
            onClick={handleCloseDialog}
          >
            OK
          </Button>
        }
      >
        <p>{dialogMessage}</p>
      </Dialogs>

      <ErrorDialogs
        title="Ocorreu um erro"
        message={translatedText}
        isOpen={error !== null}
        onClose={() => setError(null)}
      />
    </Main>
  );
}
