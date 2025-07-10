import { useState } from "react";
import { Main } from "../../Components/Main/Main";
import style from "./register.module.css";
import { supabase } from "../../services/supabase";
import { useNavigate } from "react-router-dom";

export function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });
      if (error) throw error;
      alert(
        "Cadastro realizado com sucesso! Verifique seu email para confirmação."
      );
      navigate("/login");
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = () => {
    navigate("/login");
  };

  return (
    <Main>
      <div className={style.container}>
        <div className={style.card}>
          <h2 className={style.title}>Cadastro de Conta</h2>

          <form className={style.form} onSubmit={handleRegister}>
            <p className={style.subtitle}>
              Para fazer o seu registro, informe os dados abaixo.
            </p>
            <input
              className={style.input}
              type="text"
              placeholder="Digite seu nome."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
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
              {loading ? "Cadastrando..." : "Cadastrar"}
            </button>
            <button
              className={style.button}
              type="button"
              onClick={handleReturn}
              disabled={loading}
            >
              Retornar ao Login
            </button>
          </form>
        </div>
      </div>
    </Main>
  );
}
