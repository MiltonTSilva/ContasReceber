import { useState, useRef, useEffect, useCallback } from "react";
import { Main } from "../../Components/Main/Main";
import style from "./login.module.css";
import { useGlobalState } from "../../Hooks/useGlobalState";
import { Link, useNavigate } from "react-router-dom";
import { useGeminiTranslation } from "../../Hooks/useGeminiTranslation";
import { ErrorDialogs } from "../../Components/Dialogs/ErrorDialogs/ErrorDialogs";
import { Button } from "../../Components/Button/Button";
import { Password } from "../../Components/Password/Password";

export function Login() {
  const navigate = useNavigate();
  const { signInWithPassword, loading } = useGlobalState();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const {
    translate: geminiTranslate,
    translatedText,
    error: translationError,
  } = useGeminiTranslation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data, error: errorx } = await signInWithPassword({
      email,
      password,
    });

    if (errorx) {
      setError(errorx.message);
      return;
    }

    if (data) {
      navigate("/home");
    }
  };

  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  const translateError = useCallback(
    (error: string) => {
      geminiTranslate(error, "português do Brasil");
      console.log("Iniciando tradução do erro:", error);
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
        <div className={style.card}>
          <p className={style.title}>Mascotes Pet Shop</p>
          <p className={style.title}>Login</p>
          <hr className={"separator"} />
          <p className={style.subtitle}>Acesse sua conta para continuar.</p>

          <form className={style["form"]} onSubmit={handleLogin}>
            <p className={style.subtitle}>
              Para fazer o login, utilize o email e senha cadastrados.
            </p>
            <label className={style.label} htmlFor="email">
              E-mail
            </label>
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

            <Password
              className={style.input}
              value={password}
              onPasswordChange={setPassword}
            />

            <div className={style.actions}>
              <Link to="/forgot">Esqueceu sua senha?</Link>
              <Button
                className={style.button}
                type="submit"
                disabled={loading || error !== null}
              >
                {loading ? "Entrando..." : "Entrar"}
              </Button>
              {/* <hr className={"separator"} />
              <Link to="/register">Não tem uma conta? Cadastre-se</Link> */}
            </div>
          </form>
        </div>
      </div>

      <ErrorDialogs
        title="Ocorreu um erro"
        message={translatedText}
        isOpen={error !== null && !!translatedText}
        onClose={() => setError(null)}
      />
    </Main>
  );
}
