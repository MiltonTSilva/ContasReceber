import { useGlobalState } from "../../Hooks/useGlobalState";
import { NavBar } from "../NavBar/NavBar";
import style from "./Header.module.css";

export function Header() {
  const { user } = useGlobalState();
  return (
    user && (
      <header className={style["header"]}>
        <NavBar />
      </header>
    )
  );
}
