import { useState, useEffect, useRef, useCallback } from "react";
import { Main } from "../../Components/Main/Main";
import style from "./empresasForm.module.css";
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

export function EmpresasForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const { user } = useGlobalState();

  const [business_name, setBusinessName] = useState("");
  const [responsible_name, setResponsibleName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [active, setActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const businessNameInputRef = useRef<HTMLInputElement>(null);

  const {
    translate: geminiTranslate,
    translatedText,
    error: translationError,
  } = useGeminiTranslation();

  const fetchEmpresa = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("business")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        setBusinessName(data.business_name);
        setResponsibleName(data.responsible_name);
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
      fetchEmpresa();
    }
  }, [isEditing, fetchEmpresa]);

  useEffect(() => {
    businessNameInputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!user) throw new Error("Usuário não autenticado.");

      const businessData = {
        business_name,
        responsible_name,
        email,
        mobile,
        active,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("business")
          .update(businessData)
          .eq("id", id);
        if (error) throw error;
        setDialogMessage("Empresa atualizado com sucesso!");
        setIsSuccessDialogOpen(true);
      } else {
        const { error } = await supabase
          .from("business")
          .insert([businessData]);
        if (error) throw error;
        setDialogMessage("Empresa cadastrado com sucesso!");
        setIsSuccessDialogOpen(true);
        setBusinessName("");
        setResponsibleName("");
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
    if (isEditing) navigate("/empresas");
  };

  useEffect(() => {
    businessNameInputRef.current?.focus();
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
          {isEditing ? <FaEdit /> : <Users className="h-5 w-5" />}
          {isEditing ? " Editar Empresa" : " Cadastro de Empresa"}
        </p>
        <hr className={"separator"} />
        <div className={style.card}>
          <form className={`${style.form}`} onSubmit={handleSubmit}>
            <label className={style.label}>
              Nome da empresa:
              <input
                name="business_name"
                ref={businessNameInputRef}
                className={style.input}
                type="text"
                placeholder="Digite o nome completo da empresa."
                value={business_name}
                onChange={(e) => setBusinessName(e.target.value)}
                required
              />
            </label>
            <label className={style.label}>
              Nome do Responsável:
              <input
                name="responsible_name"
                className={style.input}
                type="text"
                placeholder="Digite o nome completo do responsável."
                value={responsible_name}
                onChange={(e) => setResponsibleName(e.target.value)}
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
                onClick={() => navigate("/empresas")}
                title="Voltar para lista de Empresas"
              >
                <MdAssignmentReturn size={28} />
                Voltar para lista
              </Button>

              <Button
                variant="bg-primary"
                type="submit"
                disabled={loading || error !== null}
                title="Salvar Empresa"
              >
                <MdOutlineSave size={28} />
                Salvar Empresa
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
