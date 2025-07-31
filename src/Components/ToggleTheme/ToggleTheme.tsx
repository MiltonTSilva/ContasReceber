import React from "react";
import { Button } from "../Button/Button";
import { FaMoon, FaSun } from "react-icons/fa";
import styles from "./ToggleTheme.module.css";

type Props = {
  toggleTheme: () => void;
  theme: string;
};

const ToggleTheme: React.FC<Props> = ({ toggleTheme, theme }) => {
  const handleToggle = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    localStorage.setItem("theme", newTheme);
    toggleTheme();
  };

  return (
    <div className={styles.container}>
      <Button type="button" title="Alterar Tema" onClick={handleToggle}>
        {theme === "light" ? <FaMoon size={18} /> : <FaSun size={18} />}
      </Button>
    </div>
  );
};
export default ToggleTheme;
