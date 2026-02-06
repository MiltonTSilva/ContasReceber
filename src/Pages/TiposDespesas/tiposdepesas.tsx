import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Main } from "../../Components/Main/Main";
import { supabase } from "../../services/supabase";
import { useGlobalState } from "../../Hooks/useGlobalState";
import styles from "./tiposdepesas.module.css";
import stylesShared from "../sharedPage.module.css";
import type { TipoDespesa } from "../../Types/TiposDepesasTypes";
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
  tipodespesa: TipoDespesa;
  loading: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, active: boolean) => void;
};

const ActionButtons = ({
  tipodespesa,
  loading,
  onEdit,
  onDelete,
  onToggleActive,
}: ActionButtonsProps) => (
  <>
    <Button
      variant="bg-warning"
      disabled={loading}
      onClick={() => onEdit(tipodespesa.id)}
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
      onClick={() => onDelete(tipodespesa.id)}
      title="Excluir"
      type="button"
      style={{ width: "80px" }}
    >
      <FaTrashAlt />
      Excluir
    </Button>
    <Button
      variant={tipodespesa.active ? "bg-notActive" : "bg-active"}
      disabled={loading}
      onClick={() => onToggleActive(tipodespesa.id, tipodespesa.active)}
      title="Ativar/Desativar"
      type="button"
      style={{ width: "80px" }}
    >
      {tipodespesa.active ? <FaToggleOff /> : <FaToggleOn />}
      {tipodespesa.active ? "Desativar" : "Ativar"}
    </Button>
  </>
);

export function TiposDespesas() {
  const navigate = useNavigate();
  const { user } = useGlobalState();
  const [TipoDespesa, setTipoDespesa] = useState<TipoDespesa[]>([]);
  const [tipoDespesaParaExcluir, setTipoDespesaParaExcluir] = useState<
    string | null
  >(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalTipoDespesa, setTotalTipoDespesa] = useState(0);
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

  const fetchTipoDespesa = useCallback(async () => {
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
      let query = supabase.from("type_expense").select("*", { count: "exact" });

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

      setTipoDespesa(data || []);
      setTotalTipoDespesa(count || 0);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [user, currentPage, itemsPerPage, debouncedSearchTerm]);

  useEffect(() => {
    fetchTipoDespesa();
  }, [fetchTipoDespesa]);

  useEffect(() => {
    const channel = supabase
      .channel("type_expense-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "type_expense" },
        () => {
          fetchTipoDespesa();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTipoDespesa]);

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

  const handleNovoDespesa = () => {
    navigate("/TiposDespesas/TiposDespesasForm");
  };

  const handleEditar = (id: string) => {
    navigate(`/TiposDespesas/TiposDespesasForm/${id}`);
  };

  const handleExcluir = (id: string) => {
    setTipoDespesaParaExcluir(id);
  };

  const confirmarExclusao = async () => {
    if (!tipoDespesaParaExcluir) return;
    try {
      const { error } = await supabase
        .from("type_expense")
        .delete()
        .eq("id", tipoDespesaParaExcluir);

      if (error) throw error;

      if (TipoDespesa.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        fetchTipoDespesa();
      }
      setSearchTerm("");
    } catch (error) {
      const errorMessage = (error as Error).message;
      setError(errorMessage);
    } finally {
      setTipoDespesaParaExcluir(null);
    }
  };

  const handleAtivarDesativar = async (id: string, active: boolean) => {
    try {
      const novoStatus = !active;
      const { data, error } = await supabase
        .from("type_expense")
        .update({ active: novoStatus })
        .eq("id", id)
        .select();

      if (error) throw error;

      setTipoDespesa(TipoDespesa.map((r) => (r.id === id ? data[0] : r)));
    } catch (error) {
      const errorMessage = (error as Error).message;
      setError(errorMessage);
    }
  };

  const totalPages = Math.ceil(totalTipoDespesa / itemsPerPage);

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
            &nbsp; Lista de Tipos Despesas
          </h1>
          <div className={stylesShared.headerActions}>
            <input
              id="buscaInput"
              name="buscaInput"
              ref={buscaInputRef}
              type="text"
              placeholder="Buscar por tipo de despesa ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={stylesShared.searchInput}
              disabled={loading}
              title="Buscar por tipo despesa..."
            />
            <Button
              onClick={handleNovoDespesa}
              disabled={loading || error !== null}
              title="Novo Tipo Despesa"
            >
              <LuReceipt size={24} />
              Novo Tipo Despesa
            </Button>
          </div>
        </div>
        <div className={stylesShared.tableContainer}>
          <table className={`${styles.table} ${stylesShared.table}`}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Tipo de Operação</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading && TipoDespesa.length === 0 ? (
                <tr>
                  <td colSpan={5} className={stylesShared.loadingRow}>
                    Carregando Tipos Despesas...
                  </td>
                </tr>
              ) : TipoDespesa.length > 0 ? (
                TipoDespesa.map((tipodespesa) => (
                  <tr key={tipodespesa.id}>
                    <td
                      className={
                        tipodespesa.active
                          ? stylesShared.active
                          : stylesShared.notActive
                      }
                    >
                      {tipodespesa?.name}
                    </td>
                    <td
                      className={
                        tipodespesa.active
                          ? stylesShared.active
                          : stylesShared.notActive
                      }
                    >
                      {tipodespesa?.type_operation === 1
                        ? "Recebimento"
                        : tipodespesa?.type_operation === 2
                          ? "Despesa"
                          : "Ambos"}
                    </td>
                    <td
                      className={
                        tipodespesa.active
                          ? stylesShared.active
                          : stylesShared.notActive
                      }
                    >
                      {tipodespesa.active ? "Ativo" : "Inativo"}
                    </td>
                    <td className={stylesShared.actionsColumn}>
                      <ActionButtons
                        tipodespesa={tipodespesa}
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
                  <td colSpan={5} className={stylesShared.emptyRow}>
                    Nenhum tipo de despesa cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {loading && TipoDespesa.length === 0 ? (
          <div className={stylesShared.loadingCardList}>
            <p>Carregando tipos de Despesa...</p>
          </div>
        ) : TipoDespesa.length > 0 ? (
          <div className={stylesShared.cardList}>
            {TipoDespesa.map((tipodespesa) => (
              <Card
                key={tipodespesa.id}
                className={
                  tipodespesa.active
                    ? `${stylesShared.active} ${stylesShared.card}`
                    : `${stylesShared.notActive} ${stylesShared.card}`
                }
              >
                <Card.Header>Tipo Despesa ID: {tipodespesa.id}</Card.Header>
                <Card.Body className={stylesShared.cardBody}>
                  <CardField label="Nome">{tipodespesa.name}</CardField>
                  <CardField label="">{tipodespesa.name}</CardField>
                  <CardField label="Status">
                    {tipodespesa.active ? "Ativo" : "Inativo"}
                  </CardField>
                </Card.Body>
                <Card.Actions className={stylesShared.cardActions}>
                  <ActionButtons
                    tipodespesa={tipodespesa}
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
            <p>Nenhum tipo de despesa cadastrado ainda.</p>
          </div>
        )}

        {totalTipoDespesa > itemsPerPage ? (
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
        message="Tem certeza que deseja excluir este tipo de despesa? Esta ação não pode ser desfeita."
        isOpen={tipoDespesaParaExcluir !== null}
        onClose={() => {
          setTipoDespesaParaExcluir(null);
        }}
        onConfirm={confirmarExclusao}
      />
    </Main>
  );
}
