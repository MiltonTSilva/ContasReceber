import { useState } from "react";
import { Link } from "react-router-dom";
import style from "./NavBar.module.css";
import { useGlobalState } from "../../Hooks/useGlobalState";
import { Logout } from "../../Pages/Logout/logout";
import { Logo } from "../Logo/Logo";

export function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useGlobalState();

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    user && (
      <>
        <nav className={style.nav}>
          <Logo />

          <div
            className={`${style.menuIcon} ${menuOpen ? style.open : ""}`}
            onClick={toggleMenu}
          >
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
                to="/clientes"
                onClick={() => setMenuOpen(false)}
              >
                Clientes
              </Link>
            </li>
            <li>
              <Link
                className={style.link}
                to="/recebimentos"
                onClick={() => setMenuOpen(false)}
              >
                Recebimento
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
        <div className={style.user}>
          <p>
            <span className={style["user-name"]}>Bem-vindo,</span>
            {user?.user_metadata.display_name != undefined
              ? user?.user_metadata.display_name
              : user?.user_metadata.full_name}
          </p>
        </div>
      </>
    )
  );
}
