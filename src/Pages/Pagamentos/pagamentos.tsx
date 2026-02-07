import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Main } from "../../Components/Main/Main";
import { supabase } from "../../services/supabase";
import { useGlobalState } from "../../Hooks/useGlobalState";
import styles from "./pagamentos.module.css";
import stylesShared from "../sharedPage.module.css";
import type { Pagamento } from "../../Types/PagamentosTypes";
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
  pagamento: Pagamento;
  loading: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, active: boolean) => void;
  onPaymentReceived: (id: string) => void;
};

const ActionButtons = ({
  pagamento,
  loading,
  onEdit,
  onDelete,
  onToggleActive,
  onPaymentReceived,
}: ActionButtonsProps) => (
  <>
    <Button
      variant="bg-warning"
      disabled={loading || !!pagamento.payment_received_at}
      onClick={() => onEdit(pagamento.id)}
      title="Editar"
      type="button"
      style={{ maxWidth: "80px" }}
    >
      <FaEdit />
      Editar
    </Button>
    <Button
      variant="bg-danger"
      disabled={loading || !!pagamento.payment_received_at}
      onClick={() => onDelete(pagamento.id)}
      title="Excluir"
      type="button"
      style={{ maxWidth: "80px" }}
    >
      <FaTrashAlt />
      Excluir
    </Button>
    <Button
      variant={pagamento.active ? "bg-notActive" : "bg-active"}
      disabled={loading}
      onClick={() => onToggleActive(pagamento.id, pagamento.active)}
      title="Ativar/Desativar"
      type="button"
      style={{ maxWidth: "80px" }}
    >
      {pagamento.active ? <FaToggleOff /> : <FaToggleOn />}
      {pagamento.active ? "Desativar" : "Ativar"}
    </Button>
    <Button
      variant="bg-info"
      className={
        pagamento.payment_received_at ? styles.notReceived : styles.received
      }
      disabled={loading || !!pagamento.payment_received_at}
      onClick={() => onPaymentReceived(pagamento.id)}
      title="Receber Pagamento"
      type="button"
      style={{ maxWidth: "80px" }}
    >
      <FaMoneyCheckAlt />
      {pagamento.payment_received_at ? "Pago" : "Pagar"}
    </Button>
  </>
);

export function Pagamentos() {
  const navigate = useNavigate();
  const { user } = useGlobalState();
  const [Pagamento, setPagamento] = useState<Pagamento[]>([]);
  const [payment_received_at, setPaymentReceivedAt] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalPagamento, setTotalPagamento] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [pagamentoParaExcluir, setPagamentoParaExcluir] = useState<
    string | null
  >(null);
  const [pagamentoPago, setPagamentoPago] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const buscaInputRef = useRef<HTMLInputElement | null>(null);
  const skipFocusRef = useRef(false);
  const { isAdmin } = useAdmin();

  const {
    translate: geminiTranslate,
    translatedText,
    error: translationError,
  } = useGeminiTranslation();

  const fetchPagamento = useCallback(async () => {
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
        query = query.eq("active", true);
        //.eq("user_id", user.id)
      }

      if (debouncedSearchTerm) {
        const sanitized = debouncedSearchTerm.replace(",", ".").trim();
        query = query.or(
          `received_text.ilike.*${sanitized}*,amount_text.ilike.*${sanitized}*,name.ilike.*${sanitized}*`,
        );
      }

      const { data, error, count } = await query
        .order("payment_received_at", { ascending: false })
        .order("received_date", { ascending: true })
        .range(from, to);

      if (error) {
        throw error;
      }

      setPagamento(data || []);
      setTotalPagamento(count || 0);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [user, currentPage, itemsPerPage, debouncedSearchTerm, isAdmin]);

  useEffect(() => {
    fetchPagamento();
  }, [fetchPagamento]);

  useEffect(() => {
    const channel = supabase
      .channel("accounts_receivable-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "accounts_receivable" },
        () => {
          fetchPagamento();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPagamento]);

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

  const handleNovoPagamento = () => {
    navigate("/Pagamentos/PagamentosForm");
  };

  const handleEditar = (id: string) => {
    navigate(`/Pagamentos/PagamentosForm/${id}`);
  };

  const handleExcluir = (id: string) => {
    setPagamentoParaExcluir(id);
  };

  const handlePagar = (id: string) => {
    setPaymentReceivedAt(new Date().toISOString());
    setPagamentoPago(id);
  };

  const confirmarExclusao = async () => {
    if (!pagamentoParaExcluir) return;
    try {
      const { error } = await supabase
        .from("accounts_receivable")
        .delete()
        .eq("id", pagamentoParaExcluir);

      if (error) throw error;

      if (Pagamento.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        fetchPagamento();
      }
      setSearchTerm("");
    } catch (error) {
      const errorMessage = (error as Error).message;
      setError(errorMessage);
    } finally {
      setPagamentoParaExcluir(null);
    }
  };

  const confirmarPagamento = async () => {
    if (!pagamentoPago) return;
    try {
      const { data, error } = await supabase
        .from("accounts_receivable")
        .update({ payment_received_at: payment_received_at })
        .eq("id", pagamentoPago)
        .select("*, custumer:custumer_id(name)");

      if (error) throw error;

      if (Pagamento.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        fetchPagamento();
      }
      if (payment_received_at && isAdmin) {
        setPagamento((clientesAtuais) =>
          clientesAtuais.filter((c) => c.id !== pagamentoPago),
        );
        if (Pagamento.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      } else {
        setPagamento(
          Pagamento.map((r) => (r.id === pagamentoPago ? data[0] : r)),
        );
      }
      setSearchTerm("");
    } catch (error) {
      const errorMessage = (error as Error).message;
      setError(errorMessage);
    } finally {
      setPagamentoPago(null);
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
          "Permissão negada. Apenas o proprietário ou um administrador pode alterar este pagamento.",
        );
      }
      if (novoStatus === false && !isAdmin) {
        setPagamento((clientesAtuais) =>
          clientesAtuais.filter((c) => c.id !== id),
        );
        if (Pagamento.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      } else {
        setPagamento(Pagamento.map((r) => (r.id === id ? data[0] : r)));
      }
    } catch (error) {
      const errorMessage = (error as Error).message;
      setError(errorMessage);
    }
  };

  const totalPages = Math.ceil(totalPagamento / itemsPerPage);

  const handlePaginaAnterior = () => {
    skipFocusRef.current = true;
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handlePaginaSeguinte = () => {
    skipFocusRef.current = true;
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handleItemsPerPageChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
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
    [geminiTranslate, translationError],
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
            <LuReceipt size={24} />
            &nbsp; Lista de Pagamento
          </h1>
          <div className={stylesShared.headerActions}>
            <input
              id="buscaInput"
              name="buscaInput"
              ref={buscaInputRef}
              type="text"
              placeholder="Buscar por cliente,pagamento ou valor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={stylesShared.searchInput}
              disabled={loading}
              title="Buscar por cliente, data de pagamento ou valor..."
            />
            <Button
              onClick={handleNovoPagamento}
              disabled={loading || error !== null}
              title="Novo Pagamento"
            >
              <LuReceipt size={24} />
              Novo Pagamento
            </Button>
          </div>
        </div>
        <div className={stylesShared.tableContainer}>
          <table className={`${styles.table} ${stylesShared.table}`}>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Pagamento</th>
                <th>Valor </th>
                <th>Pagamento</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading && Pagamento.length === 0 ? (
                <tr>
                  <td colSpan={5} className={stylesShared.loadingRow}>
                    Carregando Pagamento...
                  </td>
                </tr>
              ) : Pagamento.length > 0 ? (
                Pagamento.map((pagamento) => (
                  <tr key={pagamento.id}>
                    <td
                      className={
                        pagamento.payment_received_at
                          ? styles.notReceived
                          : pagamento.active
                            ? stylesShared.active
                            : stylesShared.notActive
                      }
                    >
                      {pagamento?.custumer?.name ?? "Cliente não encontrado"}
                    </td>
                    <td
                      className={
                        pagamento.payment_received_at
                          ? styles.notReceived
                          : pagamento.active
                            ? stylesShared.active
                            : stylesShared.notActive
                      }
                    >
                      {pagamento.received_date
                        ? new Intl.DateTimeFormat("pt-BR", {
                            timeZone: "UTC",
                          }).format(new Date(pagamento.received_date))
                        : "-"}
                    </td>
                    <td
                      className={
                        pagamento.payment_received_at
                          ? styles.notReceived
                          : pagamento.active
                            ? stylesShared.active
                            : stylesShared.notActive
                      }
                    >
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(pagamento.amount_to_receive)}
                    </td>
                    <td
                      className={
                        pagamento.payment_received_at
                          ? styles.notReceived
                          : pagamento.active
                            ? stylesShared.active
                            : stylesShared.notActive
                      }
                    >
                      {pagamento.payment_received_at
                        ? new Intl.DateTimeFormat("pt-BR", {
                            timeZone: "UTC",
                          }).format(new Date(pagamento.payment_received_at))
                        : "Aguardando"}
                    </td>
                    <td
                      className={
                        pagamento.active
                          ? stylesShared.active
                          : stylesShared.notActive
                      }
                    >
                      {pagamento.active ? "Ativo" : "Inativo"}
                    </td>
                    <td className={stylesShared.actionsColumn}>
                      <ActionButtons
                        pagamento={pagamento}
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
                    Nenhum pagamento cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {loading && Pagamento.length === 0 ? (
          <div className={stylesShared.loadingCardList}>
            <p>Carregando Pagamento...</p>
          </div>
        ) : Pagamento.length > 0 ? (
          <div className={stylesShared.cardList}>
            {Pagamento.map((pagamento) => (
              <Card
                key={pagamento.id}
                className={
                  pagamento.payment_received_at
                    ? `${styles.notReceived} ${stylesShared.card}`
                    : pagamento.active
                      ? `${stylesShared.active} ${stylesShared.card}`
                      : `${stylesShared.notActive} ${stylesShared.card}`
                }
              >
                <Card.Header>
                  {pagamento?.custumer?.name ?? "Cliente não encontrado"}
                </Card.Header>
                <Card.Body className={stylesShared.cardBody}>
                  <CardField label="Pagamento">
                    {pagamento.received_date
                      ? new Intl.DateTimeFormat("pt-BR", {
                          timeZone: "UTC",
                        }).format(new Date(pagamento.received_date))
                      : "-"}
                  </CardField>

                  <CardField label="Pagamento">
                    {pagamento.payment_received_at
                      ? new Intl.DateTimeFormat("pt-BR", {
                          timeZone: "UTC",
                        }).format(new Date(pagamento.payment_received_at))
                      : "Aguardando"}
                  </CardField>
                  <CardField label="Valor">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(pagamento.amount_to_receive)}
                  </CardField>
                  <CardField label="Status">
                    {pagamento.active ? "Ativo" : "Inativo"}
                  </CardField>
                </Card.Body>
                <Card.Actions className={stylesShared.cardActions}>
                  <ActionButtons
                    pagamento={pagamento}
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
            <p>Nenhum pagamento cadastrado ainda.</p>
          </div>
        )}

        {totalPagamento > itemsPerPage ? (
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
            <p>
              Página {currentPage} de {totalPages}
            </p>
            <div className={stylesShared.paginationControls}>
              <Button
                onClick={handlePaginaAnterior}
                disabled={currentPage === 1 || loading}
                title="Página Anterior"
              >
                <FaArrowAltCircleLeft size={28} />
                Página Anterior
              </Button>

              <Button
                onClick={handlePaginaSeguinte}
                disabled={currentPage >= totalPages || loading}
                title="Próxima Página"
              >
                <FaRegArrowAltCircleRight size={28} />
                Próxima Página
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
        message="Tem certeza que deseja excluir este pagamento? Esta ação não pode ser desfeita."
        isOpen={pagamentoParaExcluir !== null}
        onClose={() => {
          setPagamentoParaExcluir(null);
        }}
        onConfirm={confirmarExclusao}
      />

      <ConfirmationDialogs
        title="Confirmar Pagamento"
        titleColor="#218838"
        variant="bg-success"
        message="Tem certeza que deseja fazer este pagamento? Esta ação não pode ser desfeita."
        isOpen={pagamentoPago !== null}
        onClose={() => {
          setPagamentoPago(null);
        }}
        onConfirm={confirmarPagamento}
      />
    </Main>
  );
}
