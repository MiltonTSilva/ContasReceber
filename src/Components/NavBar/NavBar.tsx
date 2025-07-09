import { useState } from "react";
import { Link } from "react-router-dom";
import style from "./NavBar.module.css";
import { useGlobalState } from "../../Hooks/useGlobalState";
import { Logout } from "../../pages/Logout/logout";

export function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useGlobalState();

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    user && (
      <nav className={style.nav}>
        <Link to="/home" className={style.brand}>
          Supabase
        </Link>

        <div className={style.menuIcon} onClick={toggleMenu}>
          <div />
          <div />
          <div />
        </div>
        <ul className={`${style.nav} ${menuOpen ? style.open : ""}`}>
          <li>
            <Link
              className={style.link}
              to="/Home"
              onClick={() => setMenuOpen(false)}
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              className={style.link}
              to="/produtos"
              onClick={() => setMenuOpen(false)}
            >
              Produtos
            </Link>
          </li>
          <li>
            <Link
              className={style.link}
              to="/sobre"
              onClick={() => setMenuOpen(false)}
            >
              Sobre
            </Link>
          </li>
          <li>
            <Link
              className={style.link}
              to="/contato"
              onClick={() => setMenuOpen(false)}
            >
              Contato
            </Link>
          </li>
          <li>
            {user ? (
              <Logout />
            ) : (
              <Link
                className={style.link}
                to="/login"
                onClick={() => setMenuOpen(false)}
              >
                Login
              </Link>
            )}
          </li>
        </ul>
      </nav>
    )
  );
}
