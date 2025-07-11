import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Main } from "../../Components/Main/Main";
import { supabase } from "../../services/supabase";
import { useGlobalState } from "../../Hooks/useGlobalState";
import style from "./Clientes.module.css";
import type { Cliente } from "../../Types/ClientesTypes";

export function Clientes() {
  const navigate = useNavigate();
  const { user } = useGlobalState();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalClientes, setTotalClientes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClientes = useCallback(async () => {
    if (!user) return;

    const from = (currentPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    setLoading(true);
    setError(null);

    try {
      const { data, error, count } = await supabase
        .from("customer")
        .select("*", { count: "exact" })
        .order("name", { ascending: true })
        .range(from, to);

      if (error) {
        throw error;
      }

      setClientes(data || []);
      setTotalClientes(count || 0);
    } catch (error) {
      setError((error as Error).message);
      console.error("Erro ao buscar clientes:", error);
    } finally {
      setLoading(false);
    }
  }, [user, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  const handleNovoCliente = () => {
    navigate("/clientes/clientesForm");
  };

  const handleEditar = (id: string) => {
    navigate(`/clientes/clientesForm/${id}`);
  };

  const handleExcluir = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este cliente?")) {
      try {
        const { data, error } = await supabase
          .from("customer")
          .delete()
          .eq("id", id)
          .select();

        // Se RLS impediu a exclusão, data estará vazio.
        if (!data || data.length === 0) {
          throw new Error("Você não tem permissão para excluir este cliente.");
        }
        if (error) throw error;
        // alert("Cliente excluído com sucesso!");
        //
        // setClientes(clientes.filter((c) => c.id !== id));
        // Se era o último item da página, volta para a página anterior
        if (clientes.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        } else {
          fetchClientes(); // Recarrega os dados da página atual
        }
      } catch (error) {
        setError((error as Error).message);
        // alert("Erro ao excluir cliente.");
        const errorMessage = (error as Error).message;
        setError(errorMessage);
        // alert(errorMessage); // Mostra a mensagem de permissão ou outro erro.
      }
    }
  };

  const handleAtivarDesativar = async (id: string, active: boolean) => {
    try {
      const { data, error } = await supabase
        .from("customer")
        .update({ active: !active })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // alert(`Cliente ${!active ? "ativado" : "desativado"} com sucesso!`);
      setClientes(clientes.map((c) => (c.id === id ? data : c)));
    } catch (error) {
      setError((error as Error).message);
      // alert("Erro ao atualizar status do cliente.");
      const errorMessage = (error as Error).message;
      // Verifica se o erro é a violação de RLS (nenhuma linha retornada pelo .single())
      if (
        errorMessage.includes(
          "JSON object requested, multiple (or no) rows returned"
        )
      ) {
        const customMessage =
          "Apenas o usuário proprietário tem permissão para alterar esta informação.";
        setError(customMessage);
        // alert(customMessage);
      } else {
        setError(errorMessage);
        // alert("Erro ao atualizar status do cliente.");
      }
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
    setCurrentPage(1); // Volta para a primeira página ao mudar a quantidade de itens
  };

  // Mostra o carregamento em tela cheia apenas na carga inicial, quando não há clientes.
  if (loading && clientes.length === 0) {
    return (
      <Main>
        <div>Carregando...</div>
      </Main>
    );
  }

  return (
    <Main>
      <div className={style.container}>
        <h1>Lista de Clientes</h1>
        <button
          className={style.buttonNew}
          onClick={handleNovoCliente}
          disabled={loading}
        >
          Novo Cliente
        </button>
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
              {clientes.length > 0 ? (
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
                  <td colSpan={5}>Nenhum cliente cadastrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className={style.cardList}>
          {clientes.length > 0 ? (
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
            <p>Nenhum cliente cadastrado.</p>
          )}
        </div>

        {error && <p className={style.error}>{error}</p>}
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
    </Main>
  );
}
