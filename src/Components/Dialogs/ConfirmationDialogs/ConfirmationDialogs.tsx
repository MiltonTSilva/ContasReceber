import { Button } from "../../Button/Button";
import Dialogs from "../Dialogs/Dialogs";
import style from "../Dialogs/Dialogs.module.css";

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

interface ConfirmationDialogsProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  titleColor?: string;
  variant?: ButtonVariant;
}

export function ConfirmationDialogs({
  isOpen,
  onClose,
  onConfirm,
  title,
  titleColor,
  message,
  variant,
}: ConfirmationDialogsProps) {
  return (
    <Dialogs
      title={title}
      isOpen={isOpen}
      onClose={onClose}
      titleColor={titleColor}
      footer={
        <>
          <Button variant="bg-cancel" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant={variant} onClick={onConfirm}>
            Confirmar
          </Button>
        </>
      }
    >
      <p className={style.dialogsMessage}>{message}</p>
    </Dialogs>
  );
}
