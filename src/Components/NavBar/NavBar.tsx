import { useState } from "react";
import { NavLink } from "react-router-dom";
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
              <NavLink
                className={({ isActive }) =>
                  isActive ? `${style.link} ${style.linkActive}` : style.link
                }
                to="/Home"
                onClick={() => setMenuOpen(false)}
              >
                Home
              </NavLink>
            </li>
            <li>
              <NavLink
                className={({ isActive }) =>
                  isActive ? `${style.link} ${style.linkActive}` : style.link
                }
                to="/clientes"
                onClick={() => setMenuOpen(false)}
              >
                Clientes
              </NavLink>
            </li>
            <li>
              <NavLink
                className={({ isActive }) =>
                  isActive ? `${style.link} ${style.linkActive}` : style.link
                }
                to="/recebimentos"
                onClick={() => setMenuOpen(false)}
              >
                Recebimento
              </NavLink>
            </li>

            <li>
              <NavLink
                className={({ isActive }) =>
                  isActive ? `${style.link} ${style.linkActive}` : style.link
                }
                to="/sobre"
                onClick={() => setMenuOpen(false)}
              >
                Sobre
              </NavLink>
            </li>
            <li>
              {user ? (
                <Logout />
              ) : (
                <NavLink
                  className={({ isActive }) =>
                    isActive ? `${style.link} ${style.linkActive}` : style.link
                  }
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                >
                  Login
                </NavLink>
              )}
            </li>
          </ul>
        </nav>
        <div className={style.user}>
          <p>
            <span className={style["user-name"]}>Olá,</span>
            {user?.user_metadata.display_name != undefined
              ? user?.user_metadata.display_name
              : user?.user_metadata.full_name}
          </p>
        </div>
      </>
    )
  );
}
