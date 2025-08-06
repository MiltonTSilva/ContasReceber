import { useEffect, useRef, useState } from "react";
import { Main } from "../../Components/Main/Main";
import style from "./register.module.css";
import { supabase } from "../../services/supabase";
import { useNavigate } from "react-router-dom";
import { Button } from "../../Components/Button/Button";
import { Password } from "../../Components/Password/Password";
import Card from "../../Components/Card/Card";

export function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  const handleReturn = () => {
    navigate("/login");
  };

  return (
    <Main>
      <div className={style.container}>
        <div className={style.card}>
          <form className={style.form} onSubmit={handleRegister}>
            <Card className={style.card}>
              <Card.Header>
                <h2 className={style.title}>Cadastro de Conta</h2>
                <hr className={"separator"} />
                <p className={style.subtitle}>
                  Para fazer o seu registro, informe os dados abaixo.
                </p>
              </Card.Header>
              <Card.Body>
                <label className={style.label} htmlFor="name">
                  Nome completo
                </label>
                <input
                  id="name"
                  ref={nameInputRef}
                  className={style.input}
                  type="text"
                  placeholder="Digite seu nome."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <label className={style.label} htmlFor="email">
                  E-mail
                </label>
                <input
                  id="email"
                  className={style.input}
                  type="email"
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
                  <Button type="submit" disabled={loading}>
                    {loading ? "Cadastrando..." : "Cadastrar"}
                  </Button>
          
              </Card.Actions>
              <h6>
                Ao cadastrar, estou de acordo com os Termos de Uso e Política de
                Privacidade
              </h6>
            </Card>
          </form>
        </div>
      </div>
    </Main>
  );
}
