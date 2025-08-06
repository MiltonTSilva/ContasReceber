import { useState, useRef, useEffect, useCallback } from "react";
import { Main } from "../../Components/Main/Main";
import style from "./forgot.module.css";

import { useGeminiTranslation } from "../../Hooks/useGeminiTranslation";
import { ErrorDialogs } from "../../Components/Dialogs/ErrorDialogs/ErrorDialogs";
import { Button } from "../../Components/Button/Button";
import Card from "../../Components/Card/Card";
import { supabase } from "../../services/supabase";
import { useNavigate } from "react-router-dom";
import { useGlobalState } from "../../Hooks/useGlobalState";
import Dialogs from "../../Components/Dialogs/Dialogs/Dialogs";

export function Forgot() {
  const navigate = useNavigate();
  const { loading } = useGlobalState();
  const [email, setEmail] = useState("");
  const [isSendEmail, setSendEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");

  const {
    translate: geminiTranslate,
    translatedText,
    error: translationError,
  } = useGeminiTranslation();

  const handleForgot = async (e: React.FormEvent) => {
    try {
      e.preventDefault();

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "http://localhost:5173/updatePassword",
      });

      if (!error) {
        setMessage("Email enviado com sucesso! Verifique seu email.");
        setSendEmail(true);
      }
    } catch (error) {
      setError((error as Error).message);
    }
  };

  useEffect(() => {
    emailInputRef.current?.focus();
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

  const handleReturn = () => {
    navigate("/login");
  };

  const handleCloseDialog = () => {
    setError(null);
    setMessage("");
    setSendEmail(false);
    window.close();
  };
  return (
    <Main>
      <div className={style.container}>
        <form onSubmit={handleForgot}>
          <Card className={style.card}>
            <Card.Header>
              <h2 className={style.title}>Esqueceu sua senha?</h2>
              <hr className={"separator"} />
              <p className={style.subtitle}>
                Informe seu email e enviaremos para você as instruções para
                redefinir sua senha
              </p>
            </Card.Header>
            <Card.Body>
              <input
                ref={emailInputRef}
                className={style.input}
                type="email"
                autoComplete="email"
                placeholder="Digite seu email."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Card.Body>
            <Card.Actions>
              <Button
                variant="bg-cancel"
                type="button"
                onClick={handleReturn}
                disabled={loading}
              >
                Retornar
              </Button>
              <Button type="submit" disabled={loading || error !== null}>
                {loading ? "Entrando..." : "Enviar instruções"}
              </Button>
            </Card.Actions>
          </Card>
        </form>
      </div>
      <ErrorDialogs
        title="Ocorreu um erro"
        message={translatedText}
        isOpen={error !== null && !!translatedText}
        onClose={() => setError(null)}
      />

      <Dialogs
        title="Sucesso"
        isOpen={isSendEmail}
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
