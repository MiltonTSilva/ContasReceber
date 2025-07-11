import styles from "./Main.module.css";
import { useGlobalState } from "../../Hooks/useGlobalState";
import type { ReactNode } from "react";
import { Header } from "../Header/Header";
import { Footer } from "../Footer/Footer";

interface MainProps {
  children: ReactNode;
}

export function Main({ children }: MainProps) {
  const { user } = useGlobalState();
  const containerClasses = `${styles.main} ${
    user ? styles.mainContent : ""
  }`.trim();

  return (
    <div className={styles.layout}>
      <Header />
      <div className={containerClasses}>{children}</div>
      <Footer />
    </div>
  );
}
