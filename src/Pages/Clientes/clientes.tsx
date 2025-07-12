import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Main } from "../../Components/Main/Main";
import { supabase } from "../../services/supabase";
import { useGlobalState } from "../../Hooks/useGlobalState";
import style from "./Clientes.module.css";
import type { Cliente } from "../../Types/ClientesTypes";
import { ConfirmationDialogs } from "../../Components/Dialogs/ConfirmationDialogs/ConfirmationDialogs";
import { ErrorDialogs } from "../../Components/Dialogs/ErrorDialogs/ErrorDialogs";

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

  const fetchClientes = useCallback(async () => {
    if (!user) return;

    const from = (currentPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    setLoading(true);
    setError(null);

    try {
      let query = supabase.from("customer").select("*", { count: "exact" });

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
  }, [user, currentPage, itemsPerPage, debouncedSearchTerm]);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  useEffect(() => {
    // Inicia a escuta por mudanças em tempo real na tabela 'customer'
    const channel = supabase
      .channel("customer-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "customer" },
        (payload) => {
          console.log("Mudança recebida!", payload);
          // Recarrega os clientes para refletir a mudança
          fetchClientes();
        }
      )
      .subscribe();

    // Limpa a inscrição ao desmontar o componente para evitar vazamento de memória
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
      const { data, error } = await supabase
        .from("customer")
        .update({ active: !active })
        .eq("id", id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error(
          "Permissão negada. Apenas o proprietário ou um administrador pode alterar este cliente."
        );
      }
      setClientes(clientes.map((c) => (c.id === id ? data[0] : c)));
    } catch (error) {
      const errorMessage = (error as Error).message;
      setError(errorMessage);
    }
  };

  const totalPages = Math.ceil(totalClientes / itemsPerPage);

  const handlePaginaAnterior = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handlePaginaSeguinte = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handleItemsPerPageChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  return (
    <Main>
      <div className={style.container}>
        <div className={style.header}>
          <h1>Lista de Clientes</h1>
          <div className={style.headerActions}>
            <input
              type="text"
              placeholder="Buscar por nome ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={style.searchInput}
            />
            <button
              className={style.buttonNew}
              onClick={handleNovoCliente}
              disabled={loading}
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
                    <td className={style.actions}>
                      <button
                        onClick={() => handleEditar(cliente.id)}
                        disabled={loading}
                      >
                        Editar
                      </button>
                      <button
                        className={style.deleteButton}
                        onClick={() => handleExcluir(cliente.id)}
                        disabled={loading}
                      >
                        Excluir
                      </button>
                      <button
                        onClick={() =>
                          handleAtivarDesativar(cliente.id, cliente.active)
                        }
                      >
                        {cliente.active ? "Desativar" : "Ativar"}
                      </button>
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
            clientes.map((cliente) => (
              <div key={cliente.id} className={style.card}>
                <div className={style.cardHeader}>{cliente.name}</div>
                <div className={style.cardBody}>
                  <div className={style.cardField}>
                    <label>E-mail</label>
                    <span>{cliente.email || "Não informado"}</span>
                  </div>
                  <div className={style.cardField}>
                    <label>Celular</label>
                    <span>{cliente.mobile || "Não informado"}</span>
                  </div>
                  <div className={style.cardField}>
                    <label>Status</label>
                    <span>{cliente.active ? "Ativo" : "Inativo"}</span>
                  </div>
                </div>
                <div className={style.cardActions}>
                  <button
                    onClick={() => handleEditar(cliente.id)}
                    disabled={loading}
                  >
                    Editar
                  </button>
                  <button
                    className={style.deleteButton}
                    onClick={() => handleExcluir(cliente.id)}
                    disabled={loading}
                  >
                    Excluir
                  </button>
                  <button
                    disabled={loading}
                    onClick={() =>
                      handleAtivarDesativar(cliente.id, cliente.active)
                    }
                  >
                    {cliente.active ? "Desativar" : "Ativar"}
                  </button>
                </div>
              </div>
            ))
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
        message={error!}
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
