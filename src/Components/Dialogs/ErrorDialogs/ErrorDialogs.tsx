import { Button } from "../../Button/Button";
import Dialogs from "../Dialogs/Dialogs";
import style from "../Dialogs/Dialogs.module.css";

interface ErrorDialogsProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

export function ErrorDialogs({
  isOpen,
  onClose,
  title,
  message,
}: ErrorDialogsProps) {
  return (
    <Dialogs
      title={title}
      isOpen={isOpen}
      onClose={onClose}
      titleColor="red"
      footer={
        <Button variant="primary" onClick={onClose}>
          OK
        </Button>
      }
    >
      <p className={style.dialogsMessage}>{message}</p>
    </Dialogs>
  );
}
