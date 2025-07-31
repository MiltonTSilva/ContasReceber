import { useState, useEffect, useRef, useCallback } from "react";
import { Main } from "../../Components/Main/Main";
import style from "./clientesForm.module.css";
import { supabase } from "../../services/supabase";
import { useNavigate, useParams } from "react-router-dom";
import { useGlobalState } from "../../Hooks/useGlobalState";
import Dialogs from "../../Components/Dialogs/Dialogs/Dialogs";
import PhoneInput from "../../Components/PhoneInput/PhoneInput";
import { useGeminiTranslation } from "../../Hooks/useGeminiTranslation";
import { ErrorDialogs } from "../../Components/Dialogs/ErrorDialogs/ErrorDialogs";
import { Button } from "../../Components/Button/Button";
import { FaEdit } from "react-icons/fa";
import { FaCircleUser } from "react-icons/fa6";
import { MdAssignmentReturn, MdOutlineSave } from "react-icons/md";

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
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  const {
    translate: geminiTranslate,
    translatedText,
    error: translationError,
  } = useGeminiTranslation();

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
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEditing) {
      fetchCliente();
    }
  }, [isEditing, fetchCliente]);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

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
        setDialogMessage("Cliente atualizado com sucesso!");
        setIsSuccessDialogOpen(true);
      } else {
        const { error } = await supabase
          .from("customer")
          .insert([customerData]);
        if (error) throw error;
        setDialogMessage("Cliente cadastrado com sucesso!");
        setIsSuccessDialogOpen(true);
        setName("");
        setEmail("");
        setMobile("");
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

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  const translateError = useCallback(
    (error: string) => {
      geminiTranslate(error, "português do Brasil");
      if (translationError) {
        throw new Error("Erro na tradução: " + translationError);
      }
    },
    [geminiTranslate, translationError]
  );

  useEffect(() => {
    if (error) {
      translateError(error);
    }
  }, [error, translateError]);

  return (
    <Main>
      <div className={style.container}>
        <p className={style.title}>
          {isEditing ? <FaEdit /> : <FaCircleUser />}
          {isEditing ? "Editar Cliente" : "Cadastro de Cliente"}
        </p>
        <hr className={"separator"} />
        <div className={style.card}>
          <form className={`${style.form}`} onSubmit={handleSubmit}>
            <div>
              <label className={style.label}>Nome:</label>
              <input
                name="name"
                ref={nameInputRef}
                className={style.input}
                type="text"
                placeholder="Digite o nome."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className={style.label}>Email:</label>
              <input
                className={style.input}
                type="email"
                placeholder="Digite o email."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className={style.label}>Telefone:</label>
              <PhoneInput
                mobile={mobile}
                setMobile={setMobile}
                className={style.input}
              />
            </div>
            <div>
              <label className={style.label}>Status:</label>
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
            </div>

            <div className={`${style.actions} ${"actions"}`}>
              <Button
                type="reset"
                variant="bg-cancel"
                onClick={() => navigate("/clientes")}
                title="Voltar para lista de Clientes"
              >
                <MdAssignmentReturn />
              </Button>

              <Button
                variant="bg-primary"
                type="submit"
                disabled={loading || error !== null}
                title="Salvar Cliente"
              >
                <MdOutlineSave />
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
