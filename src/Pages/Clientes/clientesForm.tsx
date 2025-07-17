import { useState, useEffect, useRef, useCallback } from "react";
import { Main } from "../../Components/Main/Main";
import style from "./clientesForm.module.css";
import { supabase } from "../../services/supabase";
import { useNavigate, useParams } from "react-router-dom";
import { useGlobalState } from "../../Hooks/useGlobalState";
import Dialogs from "../../Components/Dialogs/Dialogs/Dialogs";
import PhoneInput from "../../Components/PhoneInput/PhoneInput";
import { useGeminiTranslation } from "../../Hooks/useGeminiTranslation";

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
      console.log(error);
      geminiTranslate(error, "português do Brasil");
      if (translationError) {
        console.error("Erro na tradução:", translationError);
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
        <h2 className={style.title}>
          {isEditing ? "Editar Cliente" : "Cadastro de Clientes"}
        </h2>
        <div className={style.card}>
          <form className={style.form} onSubmit={handleSubmit}>
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

            {translatedText && <p className={style.error}>{translatedText}</p>}
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
