import { Link } from "react-router-dom";
import style from "./Logo.module.css";

export function Logo() {
  return (
    <Link to="/home" className={style.brand}>
      <div className={style.logo}>
        <img
          src="favicon.png"
          alt="Logo do sistema Mascotes Pet Shop"
          className={style.image}
        />
        <span className={style.text}>Mascotes</span>
        <span className={style.text}>Pet Shop</span>
      </div>
    </Link>
  );
}
