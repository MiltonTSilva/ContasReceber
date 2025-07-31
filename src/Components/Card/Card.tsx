import React from "react";
import style from "./Card.module.css";

interface CardSubcomponentProps {
  children: React.ReactNode;
  className?: string;
}

// --- Subcomponentes ---
const CardHeader = ({ children, className }: CardSubcomponentProps) => {
  return (
    <div className={`${style.cardHeader} ${className || ""}`.trim()}>
      {children}
    </div>
  );
};

const CardBody = ({ children, className }: CardSubcomponentProps) => {
  return (
    <div className={`${style.cardBody} ${className || ""}`.trim()}>
      {children}
    </div>
  );
};

const CardActions = ({ children, className }: CardSubcomponentProps) => {
  return (
    <div className={`${style.cardActions} ${className || ""}`.trim()}>
      {children}
    </div>
  );
};

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
