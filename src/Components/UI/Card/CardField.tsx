import React from "react";
import style from "./CardField.module.css";

interface CardFieldProps {
  label?: string;
  children: React.ReactNode;
}

const CardField = ({ label, children }: CardFieldProps) => {
  return (
    <div className={style.cardField} data-testid="card-field">
      <label className={style.label}>{label}</label>
      <span className={style.value}>{children || "Não informado"}</span>
    </div>
  );
};

export default CardField;
