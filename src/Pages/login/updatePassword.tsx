import { useCallback, useEffect, useRef, useState } from "react";
import { Main } from "../../Components/Main/Main";
import style from "./updatePassword.module.css";
import { supabase } from "../../services/supabase";
import { Button } from "../../Components/Button/Button";
import Card from "../../Components/Card/Card";
import { useGeminiTranslation } from "../../Hooks/useGeminiTranslation";
import { ErrorDialogs } from "../../Components/Dialogs/ErrorDialogs/ErrorDialogs";
import { ConfirmationDialogs } from "../../Components/Dialogs/ConfirmationDialogs/ConfirmationDialogs";
import { useNavigate } from "react-router-dom";
import Dialogs from "../../Components/Dialogs/Dialogs/Dialogs";

export function UpdatePassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isUpdatePassword, setUpdatePassword] = useState(false);
  const [isUpdatePasswordFinished, setUpdatePasswordFinished] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    if (!isUpdatePassword) return;
    try {
      e.preventDefault();
      setMessage("");

      if (password !== confirm) {
        const message = "As senhas não coincidem.";
        setError(message);
        throw new Error(message);
      }

      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password });

      setMessage("Senha atualizada com sucesso!");
      setUpdatePasswordFinished(true);
      setLoading(false);

      if (error) {
        setMessage(error.message);
        throw new Error(error.message);
      }
    } catch (error) {
      setError((error as Error).message);
    }
  };

  const {
    translate: geminiTranslate,
    translatedText,
    error: translationError,
  } = useGeminiTranslation();

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

  const handleCloseDialog = () => {
    setError(null);
    setMessage("");
    setUpdatePassword(false);
    setUpdatePasswordFinished(false);
    handleReturn();
  };

  const handleUpdatePassword = () => {
    setUpdatePassword(true);
  };

  useEffect(() => {
    passwordInputRef.current?.focus();
  }, []);

  const handleReturn = () => {
    navigate("/home");
  };

  return (
    <Main>
      <h1 className={style.title}>Alterar Senha</h1>

      <Card className={style.card}>
        <Card.Header>
          <h4>Esqueceu sua senha?</h4>
          <hr className={"separator"} />
          <h5>
            Informe seu email e enviaremos para você as instruções para
            redefinir sua senha
          </h5>
        </Card.Header>
        <Card.Body>
          <input
            ref={passwordInputRef}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={style.input}
            required
            minLength={6}
            placeholder="Nova senha"
          />

          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={style.input}
            required
            minLength={6}
            placeholder="Confirmar nova senha"
          />
        </Card.Body>
        <Card.Actions className={"actions"}>
          <Button
            variant="bg-cancel"
            type="button"
            onClick={handleReturn}
            disabled={loading}
          >
            Retornar
          </Button>
          <Button
            type="button"
            onClick={handleUpdatePassword}
            disabled={loading || error !== null}
          >
            {loading ? "Salvando..." : "Alterar Senha"}
          </Button>
        </Card.Actions>
      </Card>

      <ErrorDialogs
        title="Ocorreu um erro"
        message={translatedText != "" ? translatedText : message}
        isOpen={error !== null && !!translatedText}
        onClose={handleCloseDialog}
      />

      <ConfirmationDialogs
        title="Confirmar Senha"
        titleColor="green"
        variant="bg-success"
        message="Tem certeza que deseja alterar a senha? Esta ação não pode ser desfeita."
        isOpen={isUpdatePassword}
        onClose={() => setUpdatePassword(false)}
        onConfirm={() =>
          handleSubmit({ preventDefault: () => {} } as React.FormEvent)
        }
      />

      <Dialogs
        title="Sucesso"
        isOpen={isUpdatePasswordFinished}
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
        <p>{message}</p>
      </Dialogs>
    </Main>
  );
}
