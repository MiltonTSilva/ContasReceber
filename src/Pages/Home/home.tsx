import { useState, useEffect, useRef, useCallback } from "react";

import { Main } from "../../Components/Main/Main";
import { supabase } from "../../services/supabase";
import { useGlobalState } from "../../Hooks/useGlobalState";
import styles from "./home.module.css";
import stylesShared from "../sharedPage.module.css";
import type { Recebimento } from "../../Types/RecebimentosTypes";

import Card from "../../Components/Card/Card";
import CardField from "../../Components/Card/CardField";
import { Button } from "../../Components/Button/Button";
import { useGeminiTranslation } from "../../Hooks/useGeminiTranslation";
import { useAdmin } from "../../Hooks/useAdmin";
import { FaArrowAltCircleLeft, FaRegArrowAltCircleRight } from "react-icons/fa";
import { ErrorDialogs } from "../../Components/Dialogs/ErrorDialogs/ErrorDialogs";
import { FaMoneyCheckAlt } from "react-icons/fa";
import { ConfirmationDialogs } from "../../Components/Dialogs/ConfirmationDialogs/ConfirmationDialogs";

type ActionButtonsProps = {
  recebimento: Recebimento;
  loading: boolean;
  onPaymentReceived: (id: string) => void;
};

const ActionButtons = ({
  recebimento,
  loading,
  onPaymentReceived,
}: ActionButtonsProps) => (
  <>
    <Button
      variant="bg-info"
      disabled={loading}
      onClick={() => onPaymentReceived(recebimento.id)}
      title="Receber Pagamento"
    >
      <FaMoneyCheckAlt />
    </Button>
  </>
);

export function Home() {
  const { user } = useGlobalState();
  const [Recebimento, setRecebimento] = useState<Recebimento[]>([]);
  const [payment_received_at, setPaymentReceivedAt] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;
  const [totalRecebimento, setTotalRecebimento] = useState(0);
  const [loading, setLoading] = useState(true);
  const [recebimentoPago, setRecebimentoPago] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const skipFocusRef = useRef(false);
  const { isAdmin } = useAdmin();

  const {
    translate: geminiTranslate,
    translatedText,
    error: translationError,
  } = useGeminiTranslation();

  const fetchRecebimento = useCallback(async () => {
    if (!user) return;

    const from = (currentPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    setLoading(true);
    setError(null);

    try {
      const today = new Date()
        .toLocaleDateString("pt-BR")
        .split("/")
        .reverse()
        .join("-");

      let query = supabase
        .from("accounts_receivable_view")
        .select("*, custumer:custumer_id(name)", { count: "exact" })
        .eq("received_date", today)
        .is("payment_received_at", null);

      if (!isAdmin) {
        query = query.eq("active", true).eq("user_id", user.id);
      }

      const { data, error, count } = await query
        .order("received_date", { ascending: true })
        .range(from, to);

      if (error) {
        throw error;
      }

      setRecebimento(data || []);
      setTotalRecebimento(count || 0);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [user, currentPage, itemsPerPage, isAdmin]);

  useEffect(() => {
    fetchRecebimento();
  }, [fetchRecebimento]);

  const handlePagar = (id: string) => {
    setPaymentReceivedAt(new Date().toISOString());
    setRecebimentoPago(id);
  };

  const confirmarRecebimento = async () => {
    if (!recebimentoPago) return;
    try {
      const { data, error } = await supabase
        .from("accounts_receivable")
        .update({ payment_received_at: payment_received_at })
        .eq("id", recebimentoPago)
        .select("*, custumer:custumer_id(name)");

      if (error) throw error;

      if (Recebimento.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        fetchRecebimento();
      }
      if (payment_received_at && isAdmin) {
        setRecebimento((clientesAtuais) =>
          clientesAtuais.filter((c) => c.id !== recebimentoPago)
        );
        if (Recebimento.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      } else {
        setRecebimento(
          Recebimento.map((r) => (r.id === recebimentoPago ? data[0] : r))
        );
      }
    } catch (error) {
      const errorMessage = (error as Error).message;
      setError(errorMessage);
    } finally {
      setRecebimentoPago(null);
    }
  };

  const totalPages = Math.ceil(totalRecebimento / itemsPerPage);

  const handlePaginaAnterior = () => {
    skipFocusRef.current = true;
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handlePaginaSeguinte = () => {
    skipFocusRef.current = true;
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

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

  return (
    <Main>
      <h1 className={styles.title}>Bem-vindo</h1>
      <div className={styles.container}>
        {Recebimento.length == 0 ? (
          <p className={styles.phrase}>
            Um aplicativo simples e eficiente para o controle de contas a
            receber.
          </p>
        ) : (
          ""
        )}

        {Recebimento.length == 0 ? (
          <p className={styles.phrase}>
            Pensado para qualquer pessoa que deseja organizar seus recebimentos
            com clareza e agilidade.
          </p>
        ) : (
          ""
        )}

        {Recebimento.length > 0 ? (
          <section>
            <p className={`${styles.phrase} ${styles.phraseReceivements}`}>
              Aqui você pode visualizar os recebimentos do dia, facilitando o
              acompanhamento das suas finanças.
            </p>

            <div className={`${styles.cardList} ${styles.cardBody}`}>
              {Recebimento.map((recebimento) => (
                <Card
                  key={recebimento.id}
                  className={
                    recebimento.payment_received_at
                      ? `${styles.notReceived} ${stylesShared.card}`
                      : recebimento.active
                      ? `${stylesShared.active} ${stylesShared.card}`
                      : `${stylesShared.notActive} ${stylesShared.card}`
                  }
                >
                  <Card.Header className={styles.cardHeader}>
                    {recebimento?.custumer?.name ?? "Cliente não encontrado"}
                  </Card.Header>
                  <Card.Body>
                    <CardField label="Recebimento">
                      {recebimento.received_date
                        ? new Intl.DateTimeFormat("pt-BR", {
                            timeZone: "UTC",
                          }).format(new Date(recebimento.received_date))
                        : "-"}
                    </CardField>

                    <CardField label="Valor">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(recebimento.amount_to_receive)}
                    </CardField>
                  </Card.Body>
                  <Card.Actions className={styles.received}>
                    <ActionButtons
                      recebimento={recebimento}
                      loading={loading}
                      onPaymentReceived={handlePagar}
                    />
                  </Card.Actions>
                </Card>
              ))}
            </div>

            {totalRecebimento > itemsPerPage ? (
              <div className={styles.pagination}>
                <div className={stylesShared.paginationControls}>
                  <Button
                    onClick={handlePaginaAnterior}
                    disabled={currentPage === 1 || loading}
                    title="Página Anterior"
                  >
                    <FaArrowAltCircleLeft />
                  </Button>
                  <span>
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    onClick={handlePaginaSeguinte}
                    disabled={currentPage >= totalPages || loading}
                    title="Próxima Página"
                  >
                    <FaRegArrowAltCircleRight />
                  </Button>
                </div>
              </div>
            ) : (
              ""
            )}
          </section>
        ) : (
          ""
        )}
      </div>

      <ErrorDialogs
        title="Ocorreu um erro"
        message={translatedText}
        isOpen={error !== null}
        onClose={() => setError(null)}
      />

      <ConfirmationDialogs
        title="Confirmar Recebimento"
        titleColor="#218838"
        variant="bg-success"
        message="Tem certeza que deseja fazer este recebimento? Esta ação não pode ser desfeita."
        isOpen={recebimentoPago !== null}
        onClose={() => {
          setRecebimentoPago(null);
        }}
        onConfirm={confirmarRecebimento}
      />
    </Main>
  );
}
