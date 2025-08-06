import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Button } from "../Button/Button";
import styles from "../Password/Password.module.css";

interface PasswordProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  value: string;
  onPasswordChange?: (password: string) => void;
}

export const Password = ({
  className,
  value,
  onPasswordChange,
  ...props
}: PasswordProps) => {
  const passwordClass = `${styles.password} ${className || ""}`;
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onPasswordChange) {
      onPasswordChange(e.target.value);
    }
  };

  return (
    <div className={styles.password} style={{ position: "relative" }}>
      <label className={styles.label} htmlFor="password">
        Senha
      </label>
      <input
        id="password"
        className={passwordClass.trim()}
        {...props}
        type={showPassword ? "text" : "password"}
        autoComplete="current-password"
        placeholder="Digite sua senha."
        value={value}
        onChange={handleChange}
        required
      />
      <Button
        type="button"
        onClick={() => setShowPassword((v: boolean) => !v)}
        style={{
          position: "absolute",
          right: 10,
          top: "70%",
          transform: "translateY(-50%)",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
        }}
        tabIndex={-1}
        aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
      >
        {showPassword ? <FaEyeSlash /> : <FaEye />}
      </Button>
    </div>
  );
};
