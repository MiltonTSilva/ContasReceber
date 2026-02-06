import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Main } from "../../Components/Main/Main";
import { supabase } from "../../services/supabase";
import { useGlobalState } from "../../Hooks/useGlobalState";
import styles from "./Empresas.module.css";
import stylesShared from "../sharedPage.module.css";
import type { Empresa } from "../../Types/empresasTypes";
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
} from "react-icons/fa";
import { Users } from "lucide-react";

/* import { FaCircleUser } from "react-icons/fa6"; */

type ActionButtonsProps = {
  empresa: Empresa;
  loading: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, active: boolean) => void;
  isAdmin: boolean;
  userLogado: ReturnType<typeof useGlobalState>["user"];
};

const ActionButtons = ({
  empresa,
  loading,
  onEdit,
  onDelete,
  onToggleActive,
  //isAdmin,
  //userLogado,
}: ActionButtonsProps) => {
  //const isOwner = userLogado? === empresa.id;
  //const canPerformAction = isAdmin; //|| isOwner;
  const isDisabled = loading;

  return (
    <>
      <Button
        variant="bg-warning"
        disabled={isDisabled}
        onClick={() => onEdit(empresa.id)}
        title="Editar"
        type="button"
      >
        <FaEdit />
        Editar
      </Button>
      <Button
        variant="bg-danger"
        disabled={isDisabled}
        onClick={() => onDelete(empresa.id)}
        title="Excluir"
        type="button"
      >
        <FaTrashAlt />
        Excluir
      </Button>
      <Button
        variant={empresa.active ? "bg-notActive" : "bg-active"}
        disabled={isDisabled}
        onClick={() => onToggleActive(empresa.id, empresa.active)}
        title="Ativar/Desativar"
        type="button"
      >
        {empresa.active ? <FaToggleOff /> : <FaToggleOn />}
        {empresa.active ? "Desativar" : "Ativar"}
      </Button>
    </>
  );
};

export function Empresas() {
  const navigate = useNavigate();
  const { user } = useGlobalState();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalEmpresas, setTotalEmpresas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [empresaParaExcluir, setEmpresaParaExcluir] = useState<string | null>(
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

  const fetchEmpresas = useCallback(async () => {
    if (!user) return;

    const from = (currentPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    setLoading(true);
    setError(null);

    try {
      let query = supabase.from("business").select("*", { count: "exact" });

      if (!isAdmin) {
        query = query.eq("active", true);
      }

      if (debouncedSearchTerm) {
        query = query.or(
          `business_name.ilike.%${debouncedSearchTerm}%,responsible_name.ilike.%${debouncedSearchTerm}%,email.ilike.%${debouncedSearchTerm}%`
        );
      }

      const { data, error, count } = await query
        .order("business_name", { ascending: true })
        .range(from, to);

      if (error) {
        throw error;
      }

      setEmpresas(data || []);
      setTotalEmpresas(count || 0);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [user, currentPage, itemsPerPage, debouncedSearchTerm, isAdmin]);

  useEffect(() => {
    fetchEmpresas();
  }, [fetchEmpresas]);

  useEffect(() => {
    const channel = supabase
      .channel("business-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "business" },
        () => {
          fetchEmpresas();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchEmpresas]);

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

  const handleNovaEmpresa = () => {
    navigate("/empresas/empresasForm");
  };

  const handleEditar = (id: string) => {
    navigate(`/empresas/empresasForm/${id}`);
  };

  const handleExcluir = (id: string) => {
    setEmpresaParaExcluir(id);
  };

  const confirmarExclusao = async () => {
    if (!empresaParaExcluir) return;
    try {
      const { error } = await supabase
        .from("business")
        .delete()
        .eq("id", empresaParaExcluir);

      if (error) throw error;

      if (empresas.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        fetchEmpresas();
      }
      setSearchTerm("");
    } catch (error) {
      const errorMessage = (error as Error).message;
      setError(errorMessage);
    } finally {
      setEmpresaParaExcluir(null);
    }
  };

  const handleAtivarDesativar = async (id: string, active: boolean) => {
    try {
      const novoStatus = !active;
      const { data, error } = await supabase
        .from("business")
        .update({ active: novoStatus })
        .eq("id", id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error(
          "Permissão negada. Apenas o proprietário ou um administrador pode alterar este empresa."
        );
      }

      if (novoStatus === false && !isAdmin) {
        setEmpresas((empresasAtuais) =>
          empresasAtuais.filter((c) => c.id !== id)
        );
        if (empresas.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      } else {
        setEmpresas(empresas.map((c) => (c.id === id ? data[0] : c)));
      }
    } catch (error) {
      const errorMessage = (error as Error).message;
      setError(errorMessage);
    }
  };

  const totalPages = Math.ceil(totalEmpresas / itemsPerPage);

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
      <div className={stylesShared.container}>
        <div className={stylesShared.header}>
          <h1>
            <Users className="h-5 w-5" />
            &nbsp; Lista de Empresas
          </h1>
          <div className={stylesShared.headerActions}>
            <input
              name="buscaInput"
              ref={buscaInputRef}
              type="text"
              placeholder="Buscar por nome ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={stylesShared.searchInput}
              disabled={loading}
            />
            <Button
              type="button"
              onClick={handleNovaEmpresa}
              disabled={loading || error !== null || !isAdmin}
              title="Nova Empresa"
            >
              <Users className="h-5 w-5" />
              Nova Empresa
            </Button>
          </div>
        </div>

        <div className={stylesShared.tableContainer}>
          <table className={`${styles.table} ${stylesShared.table}`}>
            <thead>
              <tr>
                <th>Nome da Empresa</th>
                <th>Nome do responsável</th>
                <th>Email</th>
                <th>Celular</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading && empresas.length === 0 ? (
                <tr>
                  <td colSpan={5} className={stylesShared.loadingRow}>
                    Carregando empresas...
                  </td>
                </tr>
              ) : empresas.length > 0 ? (
                empresas.map((empresa) => (
                  <tr key={empresa.id}>
                    <td
                      className={
                        empresa.active
                          ? stylesShared.active
                          : stylesShared.notActive
                      }
                    >
                      {empresa.business_name}
                    </td>
                    <td
                      className={
                        empresa.active
                          ? stylesShared.active
                          : stylesShared.notActive
                      }
                    >
                      {empresa.responsible_name}
                    </td>
                    <td
                      className={
                        empresa.active
                          ? stylesShared.active
                          : stylesShared.notActive
                      }
                    >
                      {empresa.email}
                    </td>
                    <td
                      className={
                        empresa.active
                          ? stylesShared.active
                          : stylesShared.notActive
                      }
                    >
                      {empresa.mobile}
                    </td>
                    <td
                      className={
                        empresa.active
                          ? stylesShared.active
                          : stylesShared.notActive
                      }
                    >
                      {empresa.active ? "Ativo" : "Inativo"}
                    </td>
                    <td className={stylesShared.actionsColumn}>
                      <ActionButtons
                        empresa={empresa}
                        loading={loading}
                        onEdit={handleEditar}
                        onDelete={handleExcluir}
                        onToggleActive={handleAtivarDesativar}
                        isAdmin={isAdmin}
                        userLogado={user}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className={stylesShared.emptyRow}>
                    Nenhum empresa cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {loading && empresas.length === 0 ? (
          <div className={stylesShared.loadingCardList}>
            <p>Carregando empresas...</p>
          </div>
        ) : empresas.length > 0 ? (
          <div className={stylesShared.cardList}>
            {empresas.map((empresa) => (
              <Card key={empresa.id}>
                <Card.Header
                  className={
                    empresa.active
                      ? stylesShared.active
                      : stylesShared.notActive
                  }
                >
                  {empresa.business_name}
                </Card.Header>
                <Card.Body>
                  <CardField label="Responsável">
                    {empresa.responsible_name}
                  </CardField>
                  <CardField label="E-mail">{empresa.email}</CardField>
                  <CardField label="Celular">{empresa.mobile}</CardField>
                  <CardField label="Status">
                    {empresa.active ? "Ativo" : "Inativo"}
                  </CardField>
                </Card.Body>
                <Card.Actions className={stylesShared.cardActions}>
                  <ActionButtons
                    empresa={empresa}
                    loading={loading}
                    onEdit={handleEditar}
                    onDelete={handleExcluir}
                    onToggleActive={handleAtivarDesativar}
                    isAdmin={isAdmin}
                    userLogado={user}
                  />
                </Card.Actions>
              </Card>
            ))}
          </div>
        ) : (
          <div className={stylesShared.emptyCardList}>
            <p>Nenhum empresa cadastrada ainda.</p>
          </div>
        )}

        {totalEmpresas > itemsPerPage ? (
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
                <FaArrowAltCircleLeft /> Página Anterior
              </Button>

              <Button
                onClick={handlePaginaSeguinte}
                disabled={currentPage >= totalPages || loading}
                title="Próxima Página"
              >
                <FaRegArrowAltCircleRight />
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
        titleColor="red"
        variant="bg-danger"
        message="Tem certeza que deseja excluir este empresa? Esta ação não pode ser desfeita."
        isOpen={empresaParaExcluir !== null}
        onClose={() => setEmpresaParaExcluir(null)}
        onConfirm={confirmarExclusao}
      />
    </Main>
  );
}
