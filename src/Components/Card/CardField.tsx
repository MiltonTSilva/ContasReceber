import React from "react";
import style from "./CardField.module.css";

interface CardFieldProps {
  label?: string;
  children: React.ReactNode;
}

const CardField = ({ label, children }: CardFieldProps) => {
  return (
    <div className={style.cardField} data-testid="card-field">
      <span className={style.label}>{label}</span>
      <p className={style.value}>{children || "Não informado"}</p>
    </div>
  );
};

export default CardField;
