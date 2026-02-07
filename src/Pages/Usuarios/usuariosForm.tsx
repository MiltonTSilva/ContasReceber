import { useState, useEffect, useRef, useCallback } from "react";
import { Main } from "../../Components/Main/Main";
import style from "./usuariosForm.module.css";
import { supabase } from "../../services/supabase";
import { useNavigate, useParams } from "react-router-dom";
import { useGlobalState } from "../../Hooks/useGlobalState";
import Dialogs from "../../Components/Dialogs/Dialogs/Dialogs";
import PhoneInput from "../../Components/PhoneInput/PhoneInput";
import { useGeminiTranslation } from "../../Hooks/useGeminiTranslation";
import { ErrorDialogs } from "../../Components/Dialogs/ErrorDialogs/ErrorDialogs";
import { Button } from "../../Components/Button/Button";
import { FaEdit } from "react-icons/fa";

import { MdAssignmentReturn, MdOutlineSave } from "react-icons/md";
import { Users } from "lucide-react";

export function UsuariosForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const { user } = useGlobalState();

  const [full_name, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [receive_email, setReceiveEmail] = useState(false);
  const [active, setActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const fullnameInputRef = useRef<HTMLInputElement>(null);

  const {
    translate: geminiTranslate,
    translatedText,
    error: translationError,
  } = useGeminiTranslation();

  const fetchUsuario = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        setFullName(data.full_name || "");
        setEmail(data.email || "");
        setMobile(data.mobile || "");
        setReceiveEmail(data.receive_email ?? false); // garante boolean
        setActive(data.active ?? true); // garante boolean
      }
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEditing) {
      fetchUsuario();
    }
  }, [isEditing, fetchUsuario]);

  useEffect(() => {
    fullnameInputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!user) throw new Error("Usuário não autenticado.");

      const usersData = {
        full_name,
        email,
        mobile,
        receive_email: !!receive_email,
        active: !!active,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("users")
          .update(usersData)
          .eq("id", id);

        if (error) throw error;

        setDialogMessage("Usuario atualizado com sucesso!");
        setIsSuccessDialogOpen(true);
      } else {
        const { error } = await supabase.from("users").insert([usersData]);
        if (error) throw error;
        setDialogMessage("Usuario cadastrado com sucesso!");
        setIsSuccessDialogOpen(true);
        setFullName("");
        setEmail("");
        setMobile("");
        setReceiveEmail(false);
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
    if (isEditing) navigate("/usuarios");
  };

  useEffect(() => {
    fullnameInputRef.current?.focus();
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

  return (
    <Main>
      <div className={style.container}>
        <p className={style.title}>
          {isEditing ? <FaEdit /> : <Users className="h-5 w-5" />}
          {isEditing ? " Editar Usuario" : " Cadastro de Usuario"}
        </p>
        <hr className={"separator"} />
        <div className={style.card}>
          <form className={`${style.form}`} onSubmit={handleSubmit}>
            <label className={style.label}>
              Nome completo:
              <input
                name="full_name"
                ref={fullnameInputRef}
                className={style.input}
                type="text"
                placeholder="Digite o nome completo."
                value={full_name}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </label>
            <label className={style.label}>
              Email:
              <input
                className={style.input}
                type="email"
                placeholder="Digite o email."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label className={style.label}>
              Telefone:
              <PhoneInput
                mobile={mobile}
                setMobile={setMobile}
                className={style.input}
              />
            </label>
            <label className={style.label}>
              Receber e-mail?
              <div className={style.checkboxRadioContainer} tabIndex={0}>
                <input
                  className={style.inputRadioCheckbox}
                  id="receive_email"
                  name="receive_email"
                  type="radio"
                  value="true"
                  checked={receive_email === true}
                  onChange={() => setReceiveEmail(true)}
                />
                <label htmlFor="receive_email">Sim</label>
                <input
                  className={style.inputRadioCheckbox}
                  id="receive_email"
                  name="receive_email"
                  type="radio"
                  value="false"
                  checked={receive_email === false}
                  onChange={() => setReceiveEmail(false)}
                />
                <label htmlFor="receive_email">Não</label>
              </div>
            </label>

            <label className={style.label}>
              Status:
              <div className={style.checkboxRadioContainer} tabIndex={1}>
                <input
                  className={style.inputRadioCheckbox}
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
                onClick={() => navigate("/usuarios")}
                title="Voltar para lista de Usuarios"
              >
                <MdAssignmentReturn size={28} />
                Voltar para lista
              </Button>

              <Button
                variant="bg-primary"
                type="submit"
                disabled={loading || error !== null}
                title="Salvar Usuario"
              >
                <MdOutlineSave size={28} />
                Salvar Usuario
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
