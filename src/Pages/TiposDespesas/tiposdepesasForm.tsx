import { useState, useEffect, useRef, useCallback } from "react";
import { Main } from "../../Components/Main/Main";
import style from "./tiposdepesasForm.module.css";
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

export function TiposDespesasForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const { user } = useGlobalState();

  const [name, setName] = useState("");
  const [typeOperation, setTypeOperation] = useState("");
  const [active, setActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const nameSelectRef = useRef<HTMLInputElement | null>(null);

  const {
    translate: geminiTranslate,
    translatedText,
    error: translationError,
  } = useGeminiTranslation();

  const fetchtiposdespesas = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("type_expense")
        .select("*")
        .eq("id", id.trim())
        .single();

      if (error) throw error;

      if (data) {
        setName(data.name || "");
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
      fetchtiposdespesas();
    }
  }, [isEditing, fetchtiposdespesas]);

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

      const type_expenseData = {
        name,
        type_operation: Number(typeOperation),
        active,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("type_expense")
          .update(type_expenseData)
          .eq("id", id);

        if (error) throw error;
        setDialogMessage("Tipo de Pagamento atualizado com sucesso!");
        setIsSuccessDialogOpen(true);
      } else {
        const { error } = await supabase
          .from("type_expense")
          .insert([type_expenseData]);
        if (error) throw error;
        setDialogMessage("Tipo de Pagamento cadastrado com sucesso!");
        setIsSuccessDialogOpen(true);
        setName("");
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
    if (isEditing) navigate("/tiposdespesas");
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
          {isEditing
            ? " Editar Tipo de Pagamento"
            : " Cadastro de tipo de despesa"}
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
                onClick={() => navigate("/tiposdespesas")}
                title="Voltar para lista de Tipos de Pagamentos"
                style={{ width: "120px" }}
              >
                <MdAssignmentReturn size={28} />
                Voltar para lista
              </Button>
              <Button
                variant="bg-primary"
                type="submit"
                disabled={loading || error !== null}
                title="Salvar Tipo de Pagamento"
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
