import React from "react";
import styles from "./Dialogs.module.css";

interface DialogsProps {
  title?: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  titleColor?: string;
}

const Dialogs: React.FC<DialogsProps> = ({
  title,
  isOpen,
  onClose,
  children,
  footer,
  titleColor,
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialogs} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          &times;
        </button>
        <h2 className={styles.dialogsTitle} style={{ color: titleColor }}>
          {title}
        </h2>
        <div className={styles.dialogsContent}>{children}</div>
        {footer && <div className={styles.dialogsActions}>{footer}</div>}
      </div>
    </div>
  );
};

export default Dialogs;
