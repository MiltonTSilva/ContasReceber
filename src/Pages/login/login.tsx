import { useState, useRef, useEffect, useCallback } from "react";
import { Main } from "../../Components/Main/Main";
import style from "./login.module.css";
import { useGlobalState } from "../../Hooks/useGlobalState";
import { Link, useNavigate } from "react-router-dom";
import { useGeminiTranslation } from "../../Hooks/useGeminiTranslation";
import { ErrorDialogs } from "../../Components/Dialogs/ErrorDialogs/ErrorDialogs";

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
    try {
      e.preventDefault();

      const success = await signInWithPassword({ email, password });

      if (success) {
        navigate("/home");
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
        <div className={style.card}>
          <p className={style.title}>Contas a Receber</p>
          <p className={style.title}>Login</p>
          <p className={style.subtitle}>Acesse sua conta para continuar.</p>

          <form className={style["form"]} onSubmit={handleLogin}>
            <p className={style.subtitle}>
              Para fazer o login, utilize o email e senha cadastrados.
            </p>

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
            <input
              className={style.input}
              type="password"
              autoComplete="current-password"
              placeholder="Digite sua senha."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              className={style.button}
              type="submit"
              disabled={loading || error !== null}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
            <hr className={style.separator} />
            <Link to="/register">Não tem uma conta? Cadastre-se</Link>
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
