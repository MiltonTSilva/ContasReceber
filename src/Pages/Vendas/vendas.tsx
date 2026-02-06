import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Main } from "../../Components/Main/Main";
import { supabase } from "../../services/supabase";
import { useGlobalState } from "../../Hooks/useGlobalState";
import styles from "./vendas.module.css";
import stylesShared from "../sharedPage.module.css";
import type { Vendas } from "../../Types/VendasTypes";
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
  vendas: Vendas;
  loading: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, active: boolean) => void;
  onPaymentReceived: (id: string) => void;
};

const ActionButtons = ({
  vendas,
  loading,
  onEdit,
  onDelete,
  onToggleActive,
  onPaymentReceived,
}: ActionButtonsProps) => (
  <>
    <Button
      variant="bg-warning"
      disabled={loading || !!vendas.payment_received_at}
      onClick={() => onEdit(vendas.id)}
      title="Editar"
      type="button"
    >
      <FaEdit />
      Editar
    </Button>
    <Button
      variant="bg-danger"
      disabled={loading || !!vendas.payment_received_at}
      onClick={() => onDelete(vendas.id)}
      title="Excluir"
      type="button"
    >
      <FaTrashAlt />
      Excluir
    </Button>
    <Button
      variant={vendas.active ? "bg-notActive" : "bg-active"}
      disabled={loading}
      onClick={() => onToggleActive(vendas.id, vendas.active)}
      title="Ativar/Desativar"
      type="button"
    >
      {vendas.active ? <FaToggleOff /> : <FaToggleOn />}
      {vendas.active ? "Desativar" : "Ativar"}
    </Button>
    <Button
      variant="bg-info"
      className={
        vendas.payment_received_at ? styles.notReceived : styles.received
      }
      disabled={loading || !!vendas.payment_received_at}
      onClick={() => onPaymentReceived(vendas.id)}
      title="Receber Pagamento"
      type="button"
    >
      <FaMoneyCheckAlt />
      {vendas.payment_received_at ? "Recebido" : "Receber"}
    </Button>
  </>
);

export function Vendas() {
  const navigate = useNavigate();
  const { user } = useGlobalState();
  const [Vendas, setVendas] = useState<Vendas[]>([]);
  const [payment_received_at, setPaymentReceivedAt] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalVendas, setTotalVendas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [vendasParaExcluir, setVendasParaExcluir] = useState<string | null>(
    null,
  );
  const [vendasPago, setVendasPago] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const buscaInputRef = useRef<HTMLInputElement | null>(null);
  const skipFocusRef = useRef(false);
  const { isAdmin } = useAdmin();

  const {
    translate: geminiTranslate,
    translatedText,
    error: translationError,
  } = useGeminiTranslation();

  const fetchVendas = useCallback(async () => {
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

      setVendas(data || []);
      setTotalVendas(count || 0);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [user, currentPage, itemsPerPage, debouncedSearchTerm, isAdmin]);

  useEffect(() => {
    fetchVendas();
  }, [fetchVendas]);

  useEffect(() => {
    const channel = supabase
      .channel("accounts_receivable-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "accounts_receivable" },
        () => {
          fetchVendas();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchVendas]);

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

  const handleNovoVendas = () => {
    navigate("/Vendas/VendasForm");
  };

  const handleEditar = (id: string) => {
    navigate(`/Vendas/VendasForm/${id}`);
  };

  const handleExcluir = (id: string) => {
    setVendasParaExcluir(id);
  };

  const handlePagar = (id: string) => {
    setPaymentReceivedAt(new Date().toISOString());
    setVendasPago(id);
  };

  const confirmarExclusao = async () => {
    if (!vendasParaExcluir) return;
    try {
      const { error } = await supabase
        .from("accounts_receivable")
        .delete()
        .eq("id", vendasParaExcluir);

      if (error) throw error;

      if (Vendas.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        fetchVendas();
      }
      setSearchTerm("");
    } catch (error) {
      const errorMessage = (error as Error).message;
      setError(errorMessage);
    } finally {
      setVendasParaExcluir(null);
    }
  };

  const confirmarVendas = async () => {
    if (!vendasPago) return;
    try {
      const { data, error } = await supabase
        .from("accounts_receivable")
        .update({ payment_received_at: payment_received_at })
        .eq("id", vendasPago)
        .select("*, custumer:custumer_id(name)");

      if (error) throw error;

      if (Vendas.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        fetchVendas();
      }
      if (payment_received_at && isAdmin) {
        setVendas((clientesAtuais) =>
          clientesAtuais.filter((c) => c.id !== vendasPago),
        );
        if (Vendas.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      } else {
        setVendas(Vendas.map((r) => (r.id === vendasPago ? data[0] : r)));
      }
      setSearchTerm("");
    } catch (error) {
      const errorMessage = (error as Error).message;
      setError(errorMessage);
    } finally {
      setVendasPago(null);
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
          "Permissão negada. Apenas o proprietário ou um administrador pode alterar este vendas.",
        );
      }
      if (novoStatus === false && !isAdmin) {
        setVendas((clientesAtuais) =>
          clientesAtuais.filter((c) => c.id !== id),
        );
        if (Vendas.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      } else {
        setVendas(Vendas.map((r) => (r.id === id ? data[0] : r)));
      }
    } catch (error) {
      const errorMessage = (error as Error).message;
      setError(errorMessage);
    }
  };

  const totalPages = Math.ceil(totalVendas / itemsPerPage);

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
            &nbsp; Lista de Vendas
          </h1>
          <div className={stylesShared.headerActions}>
            <input
              id="buscaInput"
              name="buscaInput"
              ref={buscaInputRef}
              type="text"
              placeholder="Buscar por cliente,vendas ou valor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={stylesShared.searchInput}
              disabled={loading}
              title="Buscar por cliente, data de vendas ou valor..."
            />
            <Button
              onClick={handleNovoVendas}
              disabled={loading || error !== null}
              title="Novo Vendas"
            >
              <LuReceipt size={24} />
              Novo Vendas
            </Button>
          </div>
        </div>
        <div className={stylesShared.tableContainer}>
          <table className={`${styles.table} ${stylesShared.table}`}>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Vendas</th>
                <th>Valor </th>
                <th>Pagamento</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading && Vendas.length === 0 ? (
                <tr>
                  <td colSpan={5} className={stylesShared.loadingRow}>
                    Carregando Vendas...
                  </td>
                </tr>
              ) : Vendas.length > 0 ? (
                Vendas.map((vendas) => (
                  <tr key={vendas.id}>
                    <td
                      className={
                        vendas.payment_received_at
                          ? styles.notReceived
                          : vendas.active
                            ? stylesShared.active
                            : stylesShared.notActive
                      }
                    >
                      {vendas?.custumer?.name ?? "Cliente não encontrado"}
                    </td>
                    <td
                      className={
                        vendas.payment_received_at
                          ? styles.notReceived
                          : vendas.active
                            ? stylesShared.active
                            : stylesShared.notActive
                      }
                    >
                      {vendas.received_date
                        ? new Intl.DateTimeFormat("pt-BR", {
                            timeZone: "UTC",
                          }).format(new Date(vendas.received_date))
                        : "-"}
                    </td>
                    <td
                      className={
                        vendas.payment_received_at
                          ? styles.notReceived
                          : vendas.active
                            ? stylesShared.active
                            : stylesShared.notActive
                      }
                    >
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(vendas.amount_to_receive)}
                    </td>
                    <td
                      className={
                        vendas.payment_received_at
                          ? styles.notReceived
                          : vendas.active
                            ? stylesShared.active
                            : stylesShared.notActive
                      }
                    >
                      {vendas.payment_received_at
                        ? new Intl.DateTimeFormat("pt-BR", {
                            timeZone: "UTC",
                          }).format(new Date(vendas.payment_received_at))
                        : "Aguardando"}
                    </td>
                    <td
                      className={
                        vendas.active
                          ? stylesShared.active
                          : stylesShared.notActive
                      }
                    >
                      {vendas.active ? "Ativo" : "Inativo"}
                    </td>
                    <td className={stylesShared.actionsColumn}>
                      <ActionButtons
                        vendas={vendas}
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
                    Nenhum vendas cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {loading && Vendas.length === 0 ? (
          <div className={stylesShared.loadingCardList}>
            <p>Carregando Vendas...</p>
          </div>
        ) : Vendas.length > 0 ? (
          <div className={stylesShared.cardList}>
            {Vendas.map((vendas) => (
              <Card
                key={vendas.id}
                className={
                  vendas.payment_received_at
                    ? `${styles.notReceived} ${stylesShared.card}`
                    : vendas.active
                      ? `${stylesShared.active} ${stylesShared.card}`
                      : `${stylesShared.notActive} ${stylesShared.card}`
                }
              >
                <Card.Header>
                  {vendas?.custumer?.name ?? "Cliente não encontrado"}
                </Card.Header>
                <Card.Body className={stylesShared.cardBody}>
                  <CardField label="Vendas">
                    {vendas.received_date
                      ? new Intl.DateTimeFormat("pt-BR", {
                          timeZone: "UTC",
                        }).format(new Date(vendas.received_date))
                      : "-"}
                  </CardField>

                  <CardField label="Pagamento">
                    {vendas.payment_received_at
                      ? new Intl.DateTimeFormat("pt-BR", {
                          timeZone: "UTC",
                        }).format(new Date(vendas.payment_received_at))
                      : "Aguardando"}
                  </CardField>
                  <CardField label="Valor">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(vendas.amount_to_receive)}
                  </CardField>
                  <CardField label="Status">
                    {vendas.active ? "Ativo" : "Inativo"}
                  </CardField>
                </Card.Body>
                <Card.Actions className={stylesShared.cardActions}>
                  <ActionButtons
                    vendas={vendas}
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
            <p>Nenhum vendas cadastrado ainda.</p>
          </div>
        )}

        {totalVendas > itemsPerPage ? (
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
        message="Tem certeza que deseja excluir este vendas? Esta ação não pode ser desfeita."
        isOpen={vendasParaExcluir !== null}
        onClose={() => {
          setVendasParaExcluir(null);
        }}
        onConfirm={confirmarExclusao}
      />

      <ConfirmationDialogs
        title="Confirmar Vendas"
        titleColor="#218838"
        variant="bg-success"
        message="Tem certeza que deseja fazer este vendas? Esta ação não pode ser desfeita."
        isOpen={vendasPago !== null}
        onClose={() => {
          setVendasPago(null);
        }}
        onConfirm={confirmarVendas}
      />
    </Main>
  );
}
