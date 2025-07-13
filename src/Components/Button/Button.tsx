import React from "react";
import styles from "./button.module.css";

type ButtonVariant = "primary" | "secondary" | "active" | "danger" | "cancel";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: ButtonVariant;
}

export const Button = ({
  children,
  variant = "primary",
  className,
  ...props
}: ButtonProps) => {
  const buttonClass = `${styles.button} ${styles[variant]} ${className || ""}`;

  return (
    <button className={buttonClass.trim()} {...props}>
      {children}
    </button>
  );
};
