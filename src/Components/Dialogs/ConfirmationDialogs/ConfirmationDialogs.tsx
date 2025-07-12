import { Button } from "../../Button/Button";
import Dialogs from "../Dialogs/Dialogs";
import style from "../Dialogs/Dialogs.module.css";

interface ConfirmationDialogsProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  titleColor?: string;
}

export function ConfirmationDialogs({
  isOpen,
  onClose,
  onConfirm,
  title,
  titleColor,
  message,
}: ConfirmationDialogsProps) {
  return (
    <Dialogs
      title={title}
      isOpen={isOpen}
      onClose={onClose}
      titleColor={titleColor}
      footer={
        <>
          <Button variant="cancel" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Confirmar
          </Button>
        </>
      }
    >
      <p className={style.dialogsMessage}>{message}</p>
    </Dialogs>
  );
}
