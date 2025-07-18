import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Main } from "../../Components/Main/Main";
import { supabase } from "../../services/supabase";
import { useGlobalState } from "../../Hooks/useGlobalState";
import style from "./clientes.module.css";
import type { Cliente } from "../../Types/ClientesTypes";
import { ConfirmationDialogs } from "../../Components/Dialogs/ConfirmationDialogs/ConfirmationDialogs";
import { ErrorDialogs } from "../../Components/Dialogs/ErrorDialogs/ErrorDialogs";
import Card from "../../Components/UI/Card/Card";
import CardField from "../../Components/UI/Card/CardField";
import { Button } from "../../Components/Button/Button";
import { useGeminiTranslation } from "../../Hooks/useGeminiTranslation";
import { useAdmin } from "../../Hooks/useAdmin";

type ActionButtonsProps = {
  cliente: Cliente;
  loading: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, active: boolean) => void;
};

const ActionButtons = ({
  cliente,
  loading,
  onEdit,
  onDelete,
  onToggleActive,
}: ActionButtonsProps) => (
  <>
    <Button
      variant="secondary"
      disabled={loading}
      onClick={() => onEdit(cliente.id)}
    >
      Editar
    </Button>
    <Button
      variant="danger"
      disabled={loading}
      onClick={() => onDelete(cliente.id)}
    >
      Excluir
    </Button>
    <Button
      variant="active"
      disabled={loading}
      onClick={() => onToggleActive(cliente.id, cliente.active)}
    >
      {cliente.active ? "Desativar" : "Ativar"}
    </Button>
  </>
);

export function Clientes() {
  const navigate = useNavigate();
  const { user } = useGlobalState();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalClientes, setTotalClientes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [clienteParaExcluir, setClienteParaExcluir] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const buscaInputRef = useRef<HTMLInputElement | null>(null);
  const skipFocusRef = useRef(false);
  const { isAdmin } = useAdmin();

  const {
    translate: geminiTranslate,
    translatedText,
    error: translationError,
  } = useGeminiTranslation();

  const fetchClientes = useCallback(async () => {
    if (!user) return;

    const from = (currentPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    setLoading(true);
    setError(null);

    try {
      let query = supabase.from("customer").select("*", { count: "exact" });

      if (!isAdmin) {
        query = query.eq("active", true).eq("user_id", user.id);
      }

      if (debouncedSearchTerm) {
        query = query.or(
          `name.ilike.%${debouncedSearchTerm}%,email.ilike.%${debouncedSearchTerm}%`
        );
      }

      const { data, error, count } = await query
        .order("name", { ascending: true })
        .range(from, to);

      if (error) {
        throw error;
      }

      setClientes(data || []);
      setTotalClientes(count || 0);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [user, currentPage, itemsPerPage, debouncedSearchTerm, isAdmin]);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  useEffect(() => {
    const channel = supabase
      .channel("customer-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "customer" },
        () => {
          fetchClientes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchClientes]);

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

  const handleNovoCliente = () => {
    navigate("/clientes/clientesForm");
  };

  const handleEditar = (id: string) => {
    navigate(`/clientes/clientesForm/${id}`);
  };

  const handleExcluir = (id: string) => {
    setClienteParaExcluir(id);
  };

  const confirmarExclusao = async () => {
    if (!clienteParaExcluir) return;
    try {
      const { data, error } = await supabase
        .from("customer")
        .delete()
        .eq("id", clienteParaExcluir)
        .select();

      if (!data || data.length === 0) {
        throw new Error("Você não tem permissão para excluir este cliente.");
      }
      if (error) throw error;

      if (clientes.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        fetchClientes();
      }
      setSearchTerm("");
    } catch (error) {
      const errorMessage = (error as Error).message;
      setError(errorMessage);
    } finally {
      setClienteParaExcluir(null);
    }
  };

  const handleAtivarDesativar = async (id: string, active: boolean) => {
    try {
      const novoStatus = !active;
      const { data, error } = await supabase
        .from("customer")
        .update({ active: novoStatus })
        .eq("id", id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error(
          "Permissão negada. Apenas o proprietário ou um administrador pode alterar este cliente."
        );
      }

      if (novoStatus === false && !isAdmin) {
        setClientes((clientesAtuais) =>
          clientesAtuais.filter((c) => c.id !== id)
        );
        if (clientes.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      } else {
        setClientes(clientes.map((c) => (c.id === id ? data[0] : c)));
      }
    } catch (error) {
      const errorMessage = (error as Error).message;
      setError(errorMessage);
    }
  };

  const totalPages = Math.ceil(totalClientes / itemsPerPage);

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
        console.error("Erro na tradução:", translationError);
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
      <div className={style.container}>
        <div className={style.header}>
          <h1>Lista de Clientes</h1>
          <div className={style.headerActions}>
            <input
              name="buscaInput"
              ref={buscaInputRef}
              type="text"
              placeholder="Buscar por nome ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={style.searchInput}
              disabled={loading}
            />
            <button
              className={style.buttonNew}
              onClick={handleNovoCliente}
              disabled={loading || error !== null}
            >
              Novo Cliente
            </button>
          </div>
        </div>
        <div className={style.tableContainer}>
          <table className={style.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Celular</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className={style.loadingRow}>
                    Carregando clientes...
                  </td>
                </tr>
              ) : clientes.length > 0 ? (
                clientes.map((cliente) => (
                  <tr key={cliente.id}>
                    <td>{cliente.name}</td>
                    <td>{cliente.email}</td>
                    <td>{cliente.mobile}</td>
                    <td>{cliente.active ? "Ativo" : "Inativo"}</td>
                    <td>
                      <ActionButtons
                        cliente={cliente}
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
                  <td colSpan={5} className={style.emptyRow}>
                    Nenhum cliente cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className={style.cardList}>
          {loading ? (
            <div className={style.loadingCardList}>
              <p>Carregando clientes...</p>
            </div>
          ) : clientes.length > 0 ? (
            <div className={style.cardList}>
              {clientes.map((cliente) => (
                <Card key={cliente.id}>
                  <Card.Header>{cliente.name}</Card.Header>
                  <Card.Body>
                    <CardField label="E-mail">{cliente.email}</CardField>
                    <CardField label="Celular">{cliente.mobile}</CardField>
                    <CardField label="Status">
                      {cliente.active ? "Ativo" : "Inativo"}
                    </CardField>
                  </Card.Body>
                  <Card.Actions>
                    <ActionButtons
                      cliente={cliente}
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
            <div className={style.emptyCardList}>
              <p>Nenhum cliente cadastrado ainda.</p>
            </div>
          )}
        </div>

        <div className={style.pagination}>
          <div className={style.itemsPerPageSelector}>
            <label htmlFor="items-per-page">Itens por página:</label>
            <select
              id="items-per-page"
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className={style.paginationControls}>
            <button
              onClick={handlePaginaAnterior}
              disabled={currentPage === 1 || loading}
            >
              Anterior
            </button>
            <span>
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={handlePaginaSeguinte}
              disabled={currentPage >= totalPages || loading}
            >
              Próxima
            </button>
          </div>
        </div>
      </div>

      <ErrorDialogs
        title="Ocorreu um erro"
        message={translatedText}
        isOpen={error !== null}
        onClose={() => setError(null)}
      />

      <ConfirmationDialogs
        title="Confirmar Exclusão"
        titleColor="red"
        message="Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita."
        isOpen={clienteParaExcluir !== null}
        onClose={() => setClienteParaExcluir(null)}
        onConfirm={confirmarExclusao}
      />
    </Main>
  );
}
