import style from "./Main.module.css";
import { useGlobalState } from "../../Hooks/useGlobalState";
import type { ReactNode } from "react";

interface MainProps {
  children: ReactNode;
}

export function Main({ children }: MainProps) {
  const { user } = useGlobalState();
  const containerClasses = `${style.main} ${
    user ? style.mainLoggedIn : ""
  }`.trim();

  return <div className={containerClasses}>{children}</div>;
}
