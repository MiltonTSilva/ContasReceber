import { useState, useEffect, useRef, useCallback } from "react";
import { Main } from "../../Components/Main/Main";
import style from "./depesasForm.module.css";
import { supabase } from "../../services/supabase";
import { useNavigate, useParams } from "react-router-dom";
import { useGlobalState } from "../../Hooks/useGlobalState";
import Dialogs from "../../Components/Dialogs/Dialogs/Dialogs";

import { useGeminiTranslation } from "../../Hooks/useGeminiTranslation";
import { ErrorDialogs } from "../../Components/Dialogs/ErrorDialogs/ErrorDialogs";
import { Button } from "../../Components/Button/Button";
import "../../index.css";

import { FaEdit } from "react-icons/fa";
import { FaAlignJustify } from "react-icons/fa";
import { MdAssignmentReturn, MdOutlineSave } from "react-icons/md";

export function DespesasForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const { user } = useGlobalState();

  const [name, setName] = useState("");
  const [typeExpenseId, setTypeExpenseId] = useState("");
  const [typeOperation, setTypeOperation] = useState("");
  const [active, setActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [typeExpenseOptions, setTypeExpenseOptions] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const nameSelectRef = useRef<HTMLInputElement | null>(null);

  const {
    translate: geminiTranslate,
    translatedText,
    error: translationError,
  } = useGeminiTranslation();

  const fetchdespesas = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("expense")
        .select("*")
        .eq("id", id.trim())
        .single();

      if (error) throw error;

      if (data) {
        setName(data.name || "");
        setTypeExpenseId(data.type_expense_id || "");
        setTypeOperation(data.type_operation || "");
        setActive(data.active);
      }
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEditing) {
      fetchdespesas();
    }
  }, [isEditing, fetchdespesas]);

  useEffect(() => {
    const fetchTypeExpenses = async () => {
      try {
        const { data, error } = await supabase
          .from("type_expense")
          .select("id, name")
          .eq("active", true);

        if (error) throw error;
        setTypeExpenseOptions(data || []);
      } catch (error) {
        console.error("Erro ao carregar tipos de despesa:", error);
      }
    };

    fetchTypeExpenses();
  }, []);

  useEffect(() => {
    nameSelectRef.current?.focus();
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
      if (!name.trim()) throw new Error("Nome é obrigatório.");
      if (!typeExpenseId) throw new Error("Tipo de Despesa é obrigatório.");
      if (!typeOperation) throw new Error("Tipo de Operação é obrigatório.");

      const expenseData = {
        name: name.trim(),
        type_expense_id: typeExpenseId,
        type_operation: parseInt(typeOperation),
        active,
      };

      //console.log("Despesa data:", expenseData);

      if (isEditing) {
        // console.log("Updating expense with ID:", id);
        const { error } = await supabase
          .from("expense")
          .update(expenseData)
          .eq("id", id);

        if (error) throw error;

        setDialogMessage("Despesa atualizada com sucesso!");
        setIsSuccessDialogOpen(true);
      } else {
        const { error } = await supabase.from("expense").insert([expenseData]);
        if (error) throw error;
        setDialogMessage("Despesa cadastrada com sucesso!");
        setIsSuccessDialogOpen(true);
        setName("");
        setTypeExpenseId("");
        setTypeOperation("");
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
    if (isEditing) navigate("/despesas");
  };

  const typeOperationOptions = [
    { id: 1, name: "Recebimento" },
    { id: 2, name: "Pagamento" },
    { id: 3, name: "Ambos" },
  ];

  return (
    <Main>
      <div className={style.container}>
        <p className={style.title}>
          {isEditing ? <FaEdit /> : <FaAlignJustify />}
          {isEditing ? " Editar Despesa" : " Cadastrar Despesa"}
        </p>
        <hr className={"separator"} />
        <div className={style.card}>
          <form className={`${style.form}`} onSubmit={handleSubmit}>
            <label className={style.label}>
              Nome:
              <input
                value={name}
                className={style.input}
                onChange={(e) => setName(e.target.value)}
                ref={nameSelectRef}
              />
            </label>

            <label className={style.label}>
              Tipo de Despesa:
              <select
                name="typeExpenseId"
                className={style.input}
                value={typeExpenseId}
                onChange={(e) => setTypeExpenseId(e.target.value)}
                required
              >
                <option value="">Selecione</option>
                {typeExpenseOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <label className={style.label}>
              Tipo de Operação:
              <select
                name="typeOperation"
                className={style.input}
                value={typeOperation}
                onChange={(e) => setTypeOperation(e.target.value)}
                required
              >
                <option value="">Selecione</option>
                {typeOperationOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
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
                onClick={() => navigate("/despesas")}
                title="Voltar para lista de Desepesas"
                style={{ width: "120px" }}
              >
                <MdAssignmentReturn size={28} />
                Voltar para lista
              </Button>
              <Button
                variant="bg-primary"
                type="submit"
                disabled={loading || error !== null}
                title="Salvar"
                style={{ width: "120px" }}
              >
                <MdOutlineSave size={28} />
                Salvar
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
