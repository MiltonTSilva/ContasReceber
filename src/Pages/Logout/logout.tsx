import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGlobalState } from "../../Hooks/useGlobalState";
import style from "./logout.module.css";
import { Button } from "../../Components/Button/Button";
import { ErrorDialogs } from "../../Components/Dialogs/ErrorDialogs/ErrorDialogs";
import { useGeminiTranslation } from "../../Hooks/useGeminiTranslation";

export function Logout() {
  const { signOut } = useGlobalState();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      setError((error as Error).message);
    }
  };

  const {
    translate: geminiTranslate,
    translatedText,
    error: translationError,
  } = useGeminiTranslation();

  const translateError = useCallback(
    (error: string) => {
      geminiTranslate(error, "português do Brasil");
      if (translationError) {
        throw new Error("Erro na tradução: " + translationError);
      }
    },
    [geminiTranslate, translationError]
  );

  useEffect(() => {
    if (error) {
      translateError(error);
    }
  }, [error, translateError]);

  const handleCloseDialog = () => {
    setError(null);
    handleReturn();
  };

  const handleReturn = () => {
    navigate("/home");
  };
  return (
    <>
      <Button
        type="button"
        variant="bg-danger"
        className={style["logout-button"]}
        onClick={handleLogout}
      >
        Sair
      </Button>

      <ErrorDialogs
        title="Ocorreu um erro"
        message={translatedText}
        isOpen={error !== null && !!translatedText}
        onClose={handleCloseDialog}
      />
    </>
  );
}
