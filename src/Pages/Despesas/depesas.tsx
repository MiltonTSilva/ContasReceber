import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Main } from "../../Components/Main/Main";
import { supabase } from "../../services/supabase";
import { useGlobalState } from "../../Hooks/useGlobalState";
import styles from "./depesas.module.css";
import stylesShared from "../sharedPage.module.css";
import type { Despesa } from "../../Types/DepesasTypes";
import { ConfirmationDialogs } from "../../Components/Dialogs/ConfirmationDialogs/ConfirmationDialogs";
import { ErrorDialogs } from "../../Components/Dialogs/ErrorDialogs/ErrorDialogs";
import Card from "../../Components/Card/Card";
import CardField from "../../Components/Card/CardField";
import { Button } from "../../Components/Button/Button";
import { useGeminiTranslation } from "../../Hooks/useGeminiTranslation";

import {
  FaToggleOn,
  FaToggleOff,
  FaEdit,
  FaTrashAlt,
  FaArrowAltCircleLeft,
  FaRegArrowAltCircleRight,
  FaAlignJustify,
} from "react-icons/fa";
import { LuReceipt } from "react-icons/lu";

type ActionButtonsProps = {
  despesa: Despesa;
  loading: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, active: boolean) => void;
};

const ActionButtons = ({
  despesa,
  loading,
  onEdit,
  onDelete,
  onToggleActive,
}: ActionButtonsProps) => (
  <>
    <Button
      variant="bg-warning"
      disabled={loading}
      onClick={() => onEdit(despesa.id)}
      title="Editar"
      type="button"
      style={{ width: "80px" }}
    >
      <FaEdit />
      Editar
    </Button>
    <Button
      variant="bg-danger"
      disabled={loading}
      onClick={() => onDelete(despesa.id)}
      title="Excluir"
      type="button"
      style={{ width: "80px" }}
    >
      <FaTrashAlt />
      Excluir
    </Button>
    <Button
      variant={despesa.active ? "bg-notActive" : "bg-active"}
      disabled={loading}
      onClick={() => onToggleActive(despesa.id, despesa.active)}
      title="Ativar/Desativar"
      type="button"
      style={{ width: "80px" }}
    >
      {despesa.active ? <FaToggleOff /> : <FaToggleOn />}
      {despesa.active ? "Desativar" : "Ativar"}
    </Button>
  </>
);

export function Despesas() {
  const navigate = useNavigate();
  const { user } = useGlobalState();
  const [Despesa, setDespesa] = useState<Despesa[]>([]);
  const [typeExpenseOptions, setTypeExpenseOptions] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [DespesaParaExcluir, setDespesaParaExcluir] = useState<string | null>(
    null,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalDespesa, setTotalDespesa] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  const [error, setError] = useState<string | null>(null);
  const buscaInputRef = useRef<HTMLInputElement | null>(null);
  const skipFocusRef = useRef(false);

  const {
    translate: geminiTranslate,
    translatedText,
    error: translationError,
  } = useGeminiTranslation();

  useEffect(() => {
    const fetchTypeExpenses = async () => {
      try {
        const { data, error } = await supabase
          .from("type_expense")
          .select("id, name");

        if (error) throw error;
        setTypeExpenseOptions(data || []);
      } catch (error) {
        console.error("Erro ao carregar tipos de despesa:", error);
      }
    };

    fetchTypeExpenses();
  }, []);

  const getTypeExpenseName = (id: string) => {
    const type = typeExpenseOptions.find((opt) => opt.id === id);
    return type ? type.name : id;
  };

  const fetchDespesa = useCallback(async () => {
    const typeOperationOptions = [
      { id: 1, name: "Recebimento" },
      { id: 2, name: "Despesa" },
      { id: 3, name: "Ambos" },
    ];

    if (!user) return;

    const from = (currentPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    setLoading(true);
    setError(null);

    try {
      let query = supabase.from("expense").select("*", { count: "exact" });

      if (debouncedSearchTerm) {
        const sanitized = debouncedSearchTerm.replace(",", ".").trim();

        // Encontra o ID correspondente ao texto de busca
        const matchingType = typeOperationOptions.find((opt) =>
          opt.name.toLowerCase().includes(sanitized.toLowerCase()),
        );

        if (matchingType) {
          // Se encontrou um tipo, busca pelo ID numérico
          query = query.eq("type_operation", matchingType.id);
        } else {
          // Se não encontrou um tipo, faz a busca normal nos outros campos
          query = query.or(`name.ilike.*${sanitized}*`);
        }
      }

      const { data, error, count } = await query
        .order("name", { ascending: true })
        .range(from, to);

      if (error) {
        throw error;
      }

      setDespesa(data || []);
      setTotalDespesa(count || 0);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [user, currentPage, itemsPerPage, debouncedSearchTerm]);

  useEffect(() => {
    fetchDespesa();
  }, [fetchDespesa]);

  useEffect(() => {
    const channel = supabase
      .channel("type_expense-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "type_expense" },
        () => {
          fetchDespesa();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDespesa]);

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

  const handleNovaDespesa = () => {
    navigate("/Despesas/DespesasForm");
  };

  const handleEditar = (id: string) => {
    navigate(`/Despesas/DespesasForm/${id}`);
  };

  const handleExcluir = (id: string) => {
    setDespesaParaExcluir(id);
  };

  const confirmarExclusao = async () => {
    if (!DespesaParaExcluir) return;
    try {
      const { error } = await supabase
        .from("expense")
        .delete()
        .eq("id", DespesaParaExcluir);

      if (error) throw error;

      if (Despesa.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        fetchDespesa();
      }
      setSearchTerm("");
    } catch (error) {
      const errorMessage = (error as Error).message;
      setError(errorMessage);
    } finally {
      setDespesaParaExcluir(null);
    }
  };

  const handleAtivarDesativar = async (id: string, active: boolean) => {
    try {
      const novoStatus = !active;
      const { data, error } = await supabase
        .from("expense")
        .update({ active: novoStatus })
        .eq("id", id)
        .select();

      if (error) throw error;

      setDespesa(Despesa.map((r) => (r.id === id ? data[0] : r)));
    } catch (error) {
      const errorMessage = (error as Error).message;
      setError(errorMessage);
    }
  };

  const totalPages = Math.ceil(totalDespesa / itemsPerPage);

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
            <FaAlignJustify size={24} />
            &nbsp; Lista de Despesas
          </h1>
          <div className={stylesShared.headerActions}>
            <input
              id="buscaInput"
              name="buscaInput"
              ref={buscaInputRef}
              type="text"
              placeholder="Buscar por despesa ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={stylesShared.searchInput}
              disabled={loading}
              title="Buscar por despesa..."
            />
            <Button
              onClick={handleNovaDespesa}
              disabled={loading || error !== null}
              title="Nova Despesa"
            >
              <LuReceipt size={24} />
              Nova Despesa
            </Button>
          </div>
        </div>
        <div className={stylesShared.tableContainer}>
          <table className={`${styles.table} ${stylesShared.table}`}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Tipo de Despesa</th>
                <th>Tipo de Operação</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading && Despesa.length === 0 ? (
                <tr>
                  <td colSpan={6} className={stylesShared.loadingRow}>
                    Carregando Despesas...
                  </td>
                </tr>
              ) : Despesa.length > 0 ? (
                Despesa.map((despesa) => (
                  <tr key={despesa.id}>
                    <td
                      className={
                        despesa.active
                          ? stylesShared.active
                          : stylesShared.notActive
                      }
                    >
                      {despesa?.name}
                    </td>
                    <td
                      className={
                        despesa.active
                          ? stylesShared.active
                          : stylesShared.notActive
                      }
                    >
                      {getTypeExpenseName(despesa?.type_expense_id)}
                    </td>
                    <td
                      className={
                        despesa.active
                          ? stylesShared.active
                          : stylesShared.notActive
                      }
                    >
                      {despesa?.type_operation === 1
                        ? "Recebimento"
                        : despesa?.type_operation === 2
                          ? "Despesa"
                          : "Ambos"}
                    </td>
                    <td
                      className={
                        despesa.active
                          ? stylesShared.active
                          : stylesShared.notActive
                      }
                    >
                      {despesa.active ? "Ativo" : "Inativo"}
                    </td>
                    <td className={stylesShared.actionsColumn}>
                      <ActionButtons
                        despesa={despesa}
                        loading={loading}
                        onEdit={handleEditar}
                        onDelete={handleExcluir}
                        onToggleActive={handleAtivarDesativar}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className={stylesShared.emptyRow}>
                    Nenhuma Despesa cadastrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {loading && Despesa.length === 0 ? (
          <div className={stylesShared.loadingCardList}>
            <p>Carregando Despesa...</p>
          </div>
        ) : Despesa.length > 0 ? (
          <div className={stylesShared.cardList}>
            {Despesa.map((despesa) => (
              <Card
                key={despesa.id}
                className={
                  despesa.active
                    ? `${stylesShared.active} ${stylesShared.card}`
                    : `${stylesShared.notActive} ${stylesShared.card}`
                }
              >
                <Card.Header> Despesa ID: {despesa.id}</Card.Header>
                <Card.Body className={stylesShared.cardBody}>
                  <CardField label="Nome">{despesa.name}</CardField>
                  <CardField label="Tipo de Despesa">
                    {getTypeExpenseName(despesa.type_expense_id)}
                  </CardField>
                  <CardField label="Status">
                    {despesa.active ? "Ativo" : "Inativo"}
                  </CardField>
                </Card.Body>
                <Card.Actions className={stylesShared.cardActions}>
                  <ActionButtons
                    despesa={despesa}
                    loading={loading}
                    onEdit={handleEditar}
                    onDelete={handleExcluir}
                    onToggleActive={handleAtivarDesativar}
                  />
                </Card.Actions>
              </Card>
            ))}
          </div>
        ) : (
          <div className={stylesShared.emptyCardList}>
            <p>Nenhuma despesa cadastrada ainda.</p>
          </div>
        )}

        {totalDespesa > itemsPerPage ? (
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
        message="Tem certeza que deseja excluir este  de despesa? Esta ação não pode ser desfeita."
        isOpen={DespesaParaExcluir !== null}
        onClose={() => {
          setDespesaParaExcluir(null);
        }}
        onConfirm={confirmarExclusao}
      />
    </Main>
  );
}
