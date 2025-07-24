import { useNavigate } from "react-router-dom";
import { useGlobalState } from "../../Hooks/useGlobalState";
import style from "./logout.module.css";
import { Button } from "../../Components/Button/Button";

export function Logout() {
  const { signOut } = useGlobalState();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login"); // Redireciona para a página de login após sair
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  return (
    <Button
      type="button"
      variant="bg-danger"
      className={style["logout-button"]}
      onClick={handleLogout}
    >
      Sair
    </Button>
  );
}
