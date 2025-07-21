import React from "react";
import styles from "./button.module.css";

type ButtonVariant =
  | "bg-primary"
  | "bg-secondary"
  | "bg-active"
  | "bg-danger"
  | "bg-cancel"
  | "bg-warning"
  | "bg-info"
  | "bg-success"
  | "bg-light"
  | "bg-dark";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: ButtonVariant;
}

export const Button = ({
  children,
  variant = "bg-primary",
  className,
  ...props
}: ButtonProps) => {
  const buttonClass = `${styles.button} ${styles[variant]} button ${variant} ${
    className || ""
  }`;

  return (
    <button className={buttonClass.trim()} {...props}>
      {children}
    </button>
  );
};
