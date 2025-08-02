import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Main } from "../../Components/Main/Main";
import { supabase } from "../../services/supabase";
import { useGlobalState } from "../../Hooks/useGlobalState";
import styles from "./recebimentos.module.css";
import stylesShared from "../sharedPage.module.css";
import type { Recebimento } from "../../Types/RecebimentosTypes";
import { ConfirmationDialogs } from "../../Components/Dialogs/ConfirmationDialogs/ConfirmationDialogs";
import { ErrorDialogs } from "../../Components/Dialogs/ErrorDialogs/ErrorDialogs";
import Card from "../../Components/Card/Card";
import CardField from "../../Components/Card/CardField";
import { Button } from "../../Components/Button/Button";
import { useGeminiTranslation } from "../../Hooks/useGeminiTranslation";
import { useAdmin } from "../../Hooks/useAdmin";
import {
  FaToggleOn,
  FaToggleOff,
  FaEdit,
  FaTrashAlt,
  FaArrowAltCircleLeft,
  FaRegArrowAltCircleRight,
  FaMoneyCheckAlt,
} from "react-icons/fa";
import { LuReceipt } from "react-icons/lu";

type ActionButtonsProps = {
  recebimento: Recebimento;
  loading: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, active: boolean) => void;
  onPaymentReceived: (id: string) => void;
};

const ActionButtons = ({
  recebimento,
  loading,
  onEdit,
  onDelete,
  onToggleActive,
  onPaymentReceived,
}: ActionButtonsProps) => (
  <>
    <Button
      variant="bg-warning"
      disabled={loading}
      onClick={() => onEdit(recebimento.id)}
      title="Editar"
      type="button"
    >
      <FaEdit />
    </Button>
    <Button
      variant="bg-danger"
      disabled={loading}
      onClick={() => onDelete(recebimento.id)}
      title="Excluir"
      type="button"
    >
      <FaTrashAlt />
    </Button>
    <Button
      variant={recebimento.active ? "bg-active" : "bg-notActive"}
      disabled={loading}
      onClick={() => onToggleActive(recebimento.id, recebimento.active)}
      title="Ativar/Desativar"
      type="button"
    >
      {recebimento.active ? <FaToggleOff /> : <FaToggleOn />}
    </Button>
    <Button
      variant="bg-info"
      disabled={loading}
      onClick={() => onPaymentReceived(recebimento.id)}
      title="Receber Pagamento"
      type="button"
    >
      <FaMoneyCheckAlt />
    </Button>
  </>
);

export function Recebimentos() {
  const navigate = useNavigate();
  const { user } = useGlobalState();
  const [Recebimento, setRecebimento] = useState<Recebimento[]>([]);
  const [payment_received_at, setPaymentReceivedAt] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalRecebimento, setTotalRecebimento] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [recebimentoParaExcluir, setRecebimentoParaExcluir] = useState<
    string | null
  >(null);
  const [recebimentoPago, setRecebimentoPago] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const buscaInputRef = useRef<HTMLInputElement | null>(null);
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
      let query = supabase
        .from("accounts_receivable_view")
        .select("*, custumer:custumer_id(name)", { count: "exact" });

      if (!isAdmin) {
        query = query.eq("active", true).eq("user_id", user.id);
      }

      if (debouncedSearchTerm) {
        const sanitized = debouncedSearchTerm.replace(",", ".").trim();
        query = query.or(
          `received_text.ilike.*${sanitized}*,amount_text.ilike.*${sanitized}*,name.ilike.*${sanitized}*`
        );
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
  }, [user, currentPage, itemsPerPage, debouncedSearchTerm, isAdmin]);

  useEffect(() => {
    fetchRecebimento();
  }, [fetchRecebimento]);

  useEffect(() => {
    const channel = supabase
      .channel("accounts_receivable-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "accounts_receivable" },
        () => {
          fetchRecebimento();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRecebimento]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  useEffect(() => {
    if (loading) return;
    if (skipFocusRef.current) {
      skipFocusRef.current = false;
      return;
    }
    buscaInputRef.current?.focus();
  }, [loading]);

  const handleNovoRecebimento = () => {
    navigate("/Recebimentos/RecebimentosForm");
  };

  const handleEditar = (id: string) => {
    navigate(`/Recebimentos/RecebimentosForm/${id}`);
  };

  const handleExcluir = (id: string) => {
    setRecebimentoParaExcluir(id);
  };

  const handlePagar = (id: string) => {
    setPaymentReceivedAt(new Date().toISOString());
    setRecebimentoPago(id);
  };

  const confirmarExclusao = async () => {
    if (!recebimentoParaExcluir) return;
    try {
      const { error } = await supabase
        .from("accounts_receivable")
        .delete()
        .eq("id", recebimentoParaExcluir);

      if (error) throw error;

      if (Recebimento.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        fetchRecebimento();
      }
      setSearchTerm("");
    } catch (error) {
      const errorMessage = (error as Error).message;
      setError(errorMessage);
    } finally {
      setRecebimentoParaExcluir(null);
    }
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
      setSearchTerm("");
    } catch (error) {
      const errorMessage = (error as Error).message;
      setError(errorMessage);
    } finally {
      setRecebimentoPago(null);
    }
  };

  const handleAtivarDesativar = async (id: string, active: boolean) => {
    try {
      const novoStatus = !active;
      const { data, error } = await supabase
        .from("accounts_receivable")
        .update({ active: novoStatus })
        .eq("id", id)
        .select("*, custumer:custumer_id(name)");

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error(
          "Permissão negada. Apenas o proprietário ou um administrador pode alterar este recebimento."
        );
      }
      if (novoStatus === false && !isAdmin) {
        setRecebimento((clientesAtuais) =>
          clientesAtuais.filter((c) => c.id !== id)
        );
        if (Recebimento.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      } else {
        setRecebimento(Recebimento.map((r) => (r.id === id ? data[0] : r)));
      }
    } catch (error) {
      const errorMessage = (error as Error).message;
      setError(errorMessage);
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

  const handleItemsPerPageChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    skipFocusRef.current = true;
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
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
      <div className={`${stylesShared.container}`}>
        <div className={stylesShared.header}>
          <h1>
            {" "}
            <LuReceipt />
            Lista de Recebimento
          </h1>
          <div className={stylesShared.headerActions}>
            <input
              id="buscaInput"
              name="buscaInput"
              ref={buscaInputRef}
              type="text"
              placeholder="Buscar por cliente,recebimento ou valor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={stylesShared.searchInput}
              disabled={loading}
              title="Buscar por cliente, data de recebimento ou valor..."
            />
            <Button
              onClick={handleNovoRecebimento}
              disabled={loading || error !== null}
              title="Novo Recebimento"
            >
              <LuReceipt />
            </Button>
          </div>
        </div>
        <div className={stylesShared.tableContainer}>
          <table className={`${styles.table} ${stylesShared.table}`}>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Recebimento</th>
                <th>Valor </th>
                <th>Pagamento</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading && Recebimento.length === 0 ? (
                <tr>
                  <td colSpan={5} className={stylesShared.loadingRow}>
                    Carregando Recebimento...
                  </td>
                </tr>
              ) : Recebimento.length > 0 ? (
                Recebimento.map((recebimento) => (
                  <tr key={recebimento.id}>
                    <td
                      className={
                        recebimento.payment_received_at
                          ? styles.notReceived
                          : recebimento.active
                          ? stylesShared.active
                          : stylesShared.notActive
                      }
                    >
                      {recebimento?.custumer?.name ?? "Cliente não encontrado"}
                    </td>
                    <td
                      className={
                        recebimento.payment_received_at
                          ? styles.notReceived
                          : recebimento.active
                          ? stylesShared.active
                          : stylesShared.notActive
                      }
                    >
                      {recebimento.received_date
                        ? new Intl.DateTimeFormat("pt-BR", {
                            timeZone: "UTC",
                          }).format(new Date(recebimento.received_date))
                        : "-"}
                    </td>
                    <td
                      className={
                        recebimento.payment_received_at
                          ? styles.notReceived
                          : recebimento.active
                          ? stylesShared.active
                          : stylesShared.notActive
                      }
                    >
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(recebimento.amount_to_receive)}
                    </td>
                    <td
                      className={
                        recebimento.payment_received_at
                          ? styles.notReceived
                          : recebimento.active
                          ? stylesShared.active
                          : stylesShared.notActive
                      }
                    >
                      {recebimento.payment_received_at
                        ? new Intl.DateTimeFormat("pt-BR", {
                            timeZone: "UTC",
                          }).format(new Date(recebimento.payment_received_at))
                        : "Aguardando"}
                    </td>
                    <td
                      className={
                        recebimento.active
                          ? stylesShared.active
                          : stylesShared.notActive
                      }
                    >
                      {recebimento.active ? "Ativo" : "Inativo"}
                    </td>
                    <td className="actionsColumn ">
                      <ActionButtons
                        recebimento={recebimento}
                        loading={loading}
                        onEdit={handleEditar}
                        onDelete={handleExcluir}
                        onToggleActive={handleAtivarDesativar}
                        onPaymentReceived={handlePagar}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className={stylesShared.emptyRow}>
                    Nenhum recebimento cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className={stylesShared.cardList}>
          {loading && Recebimento.length === 0 ? (
            <div className={stylesShared.loadingCardList}>
              <p>Carregando Recebimento...</p>
            </div>
          ) : Recebimento.length > 0 ? (
            <div className={stylesShared.cardList}>
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
                  <Card.Header>
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

                    <CardField label="Pagamento">
                      {recebimento.payment_received_at
                        ? new Intl.DateTimeFormat("pt-BR", {
                            timeZone: "UTC",
                          }).format(new Date(recebimento.payment_received_at))
                        : "Aguardando"}
                    </CardField>
                    <CardField label="Valor">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(recebimento.amount_to_receive)}
                    </CardField>
                    <CardField label="Status">
                      {recebimento.active ? "Ativo" : "Inativo"}
                    </CardField>
                  </Card.Body>
                  <Card.Actions className={styles.received}>
                    <ActionButtons
                      recebimento={recebimento}
                      loading={loading}
                      onEdit={handleEditar}
                      onDelete={handleExcluir}
                      onToggleActive={handleAtivarDesativar}
                      onPaymentReceived={handlePagar}
                    />
                  </Card.Actions>
                </Card>
              ))}
            </div>
          ) : (
            <div className={stylesShared.emptyCardList}>
              <p>Nenhum recebimento cadastrado ainda.</p>
            </div>
          )}
        </div>

        {totalRecebimento > itemsPerPage ? (
          <div className={stylesShared.pagination}>
            <div className={stylesShared.itemsPerPageSelector}>
              <label htmlFor="items-per-page">Itens por página:</label>
              <select
                id="items-per-page"
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                title="Selecione o número de itens por página"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className={stylesShared.paginationControls}>
              <Button
                onClick={handlePaginaAnterior}
                disabled={currentPage === 1 || loading}
                title="Página Anterior"
              >
                <FaArrowAltCircleLeft />
              </Button>
              <p>
                Página {currentPage} de {totalPages}
              </p>
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
      </div>

      <ErrorDialogs
        title="Ocorreu um erro"
        message={translatedText}
        isOpen={error !== null}
        onClose={() => setError(null)}
      />

      <ConfirmationDialogs
        title="Confirmar Exclusão"
        titleColor="#dc3545"
        variant="bg-danger"
        message="Tem certeza que deseja excluir este recebimento? Esta ação não pode ser desfeita."
        isOpen={recebimentoParaExcluir !== null}
        onClose={() => {
          setRecebimentoParaExcluir(null);
        }}
        onConfirm={confirmarExclusao}
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
