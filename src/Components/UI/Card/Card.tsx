import React from "react";
import style from "./Card.module.css";

interface CardSubcomponentProps {
  children: React.ReactNode;
}

// --- Subcomponentes ---
const CardHeader = ({ children }: CardSubcomponentProps) => (
  <div className={style.cardHeader}>{children}</div>
);

const CardBody = ({ children }: CardSubcomponentProps) => (
  <div className={style.cardBody}>{children}</div>
);

const CardActions = ({ children }: CardSubcomponentProps) => (
  <div className={style.cardActions}>{children}</div>
);

// --- Componente Principal ---
interface CardProps {
  children: React.ReactNode;
  className?: string;
}
const Card = ({ children, className }: CardProps) => {
  const combinedClassName = `${style.card} ${className || ""}`.trim();

  return <div className={combinedClassName}>{children}</div>;
};

// Anexando os subcomponentes ao componente principal
Card.Header = CardHeader;
Card.Body = CardBody;
Card.Actions = CardActions;

export default Card;
