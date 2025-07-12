import { useState, useRef, useEffect } from "react";
import { Main } from "../../Components/Main/Main";
import style from "./login.module.css";
import { useGlobalState } from "../../Hooks/useGlobalState";
import { Link, useNavigate } from "react-router-dom";

export function Login() {
  const navigate = useNavigate();
  const { signInWithPassword, loading, error } = useGlobalState();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const success = await signInWithPassword({ email, password });

    if (success) {
      navigate("/home");
    }
  };

  useEffect(() => {
    // Foca no input de nome quando o componente é montado
    nameInputRef.current?.focus();
  }, []);

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
              ref={nameInputRef}
              className={style.input}
              type="email"
              placeholder="Digite seu email."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className={style.input}
              type="password"
              placeholder="Digite sua senha."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button className={style.button} type="submit" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </button>
            <hr className={style.separator} />
            <Link to="/register">Não tem uma conta? Cadastre-se</Link>
            {error && <p className={style.error}>{error}</p>}
          </form>
        </div>
      </div>
    </Main>
  );
}
