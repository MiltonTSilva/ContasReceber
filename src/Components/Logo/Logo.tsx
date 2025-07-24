import { Link } from "react-router-dom";
import style from "./Logo.module.css";

export function Logo() {
  return (
    <Link to="/home" className={style.brand}>
      <div className={style.logo}>
        <img
          src="/favicon.png"
          alt="Logo do sistema Contas a Receber"
          className={style.image}
        />
        <span className={style.text}>Contas a Receber</span>
      </div>
    </Link>
  );
}
