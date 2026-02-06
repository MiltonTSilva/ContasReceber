import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Main } from "../../Components/Main/Main";
import { supabase } from "../../services/supabase";
import { useGlobalState } from "../../Hooks/useGlobalState";
import styles from "./Usuarios.module.css";
import stylesShared from "../sharedPage.module.css";
import type { Usuario } from "../../Types/usuariosTypes";
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
  usuario: Usuario;
  loading: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, active: boolean) => void;
  isAdmin: boolean;
  userLogado: ReturnType<typeof useGlobalState>["user"];
};

const ActionButtons = ({
  usuario,
  loading,
  onEdit,
  onDelete,
  onToggleActive,
  //isAdmin,
  //userLogado,
}: ActionButtonsProps) => {
  //const isOwner = userLogado?.id === usuario.user_id;
  //const canPerformAction = isAdmin || isOwner;
  const isDisabled = loading; //|| !canPerformAction;

  return (
    <>
      <Button
        variant="bg-warning"
        disabled={isDisabled}
        onClick={() => onEdit(usuario.id)}
        title="Editar"
        type="button"
      >
        <FaEdit />
        Editar
      </Button>
      <Button
        variant="bg-danger"
        disabled={isDisabled}
        onClick={() => onDelete(usuario.id)}
        title="Excluir"
        type="button"
      >
        <FaTrashAlt />
        Excluir
      </Button>
      <Button
        variant={usuario.active ? "bg-notActive" : "bg-active"}
        disabled={isDisabled}
        onClick={() => onToggleActive(usuario.id, usuario.active)}
        title="Ativar/Desativar"
        type="button"
      >
        {usuario.active ? <FaToggleOff /> : <FaToggleOn />}
        {usuario.active ? "Desativar" : "Ativar"}
      </Button>
    </>
  );
};

export function Usuarios() {
  const navigate = useNavigate();
  const { user } = useGlobalState();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [usuarioParaExcluir, setUsuarioParaExcluir] = useState<string | null>(
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

  const fetchUsuarios = useCallback(async () => {
    if (!user) return;

    const from = (currentPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    setLoading(true);
    setError(null);

    try {
      let query = supabase.from("users").select("*", { count: "exact" });

      if (!isAdmin) {
        query = query.eq("active", true);
      }

      if (debouncedSearchTerm) {
        query = query.or(
          `full_name.ilike.%${debouncedSearchTerm}%,email.ilike.%${debouncedSearchTerm}%`
        );
      }

      const { data, error, count } = await query
        .order("full_name", { ascending: true })
        .range(from, to);

      if (error) {
        throw error;
      }

      setUsuarios(data || []);
      setTotalUsuarios(count || 0);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [user, currentPage, itemsPerPage, debouncedSearchTerm, isAdmin]);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  useEffect(() => {
    const channel = supabase
      .channel("users-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "users" },
        () => {
          fetchUsuarios();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchUsuarios]);

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

  const handleNovoUsuario = () => {
    navigate("/usuarios/usuariosForm");
  };

  const handleEditar = (id: string) => {
    navigate(`/usuarios/usuariosForm/${id}`);
  };

  const handleExcluir = (id: string) => {
    setUsuarioParaExcluir(id);
  };

  const confirmarExclusao = async () => {
    if (!usuarioParaExcluir) return;
    try {
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", usuarioParaExcluir);

      if (error) throw error;

      if (usuarios.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        fetchUsuarios();
      }
      setSearchTerm("");
    } catch (error) {
      const errorMessage = (error as Error).message;
      setError(errorMessage);
    } finally {
      setUsuarioParaExcluir(null);
    }
  };

  const handleAtivarDesativar = async (id: string, active: boolean) => {
    try {
      const novoStatus = !active;
      const { data, error } = await supabase
        .from("users")
        .update({ active: novoStatus })
        .eq("id", id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error(
          "Permissão negada. Apenas o proprietário ou um administrador pode alterar este usuario."
        );
      }

      if (novoStatus === false && !isAdmin) {
        setUsuarios((usuariosAtuais) =>
          usuariosAtuais.filter((c) => c.id !== id)
        );
        if (usuarios.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      } else {
        setUsuarios(usuarios.map((c) => (c.id === id ? data[0] : c)));
      }
    } catch (error) {
      const errorMessage = (error as Error).message;
      setError(errorMessage);
    }
  };

  const totalPages = Math.ceil(totalUsuarios / itemsPerPage);

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
            &nbsp; Lista de Usuarios
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
              onClick={handleNovoUsuario}
              disabled={loading || error !== null || !isAdmin}
              title="Novo Usuario"
            >
              <Users className="h-5 w-5" />
              Novo Usuario
            </Button>
          </div>
        </div>

        <div className={stylesShared.tableContainer}>
          <table className={`${styles.table} ${stylesShared.table}`}>
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
              {loading && usuarios.length === 0 ? (
                <tr>
                  <td colSpan={5} className={stylesShared.loadingRow}>
                    Carregando usuarios...
                  </td>
                </tr>
              ) : usuarios.length > 0 ? (
                usuarios.map((usuario) => (
                  <tr key={usuario.id}>
                    <td
                      className={
                        usuario.active
                          ? stylesShared.active
                          : stylesShared.notActive
                      }
                    >
                      {usuario.full_name}
                    </td>
                    <td
                      className={
                        usuario.active
                          ? stylesShared.active
                          : stylesShared.notActive
                      }
                    >
                      {usuario.email}
                    </td>
                    <td
                      className={
                        usuario.active
                          ? stylesShared.active
                          : stylesShared.notActive
                      }
                    >
                      {usuario.mobile}
                    </td>
                    <td
                      className={
                        usuario.active
                          ? stylesShared.active
                          : stylesShared.notActive
                      }
                    >
                      {usuario.active ? "Ativo" : "Inativo"}
                    </td>
                    <td className={stylesShared.actionsColumn}>
                      <ActionButtons
                        usuario={usuario}
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
                    Nenhum usuario cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {loading && usuarios.length === 0 ? (
          <div className={stylesShared.loadingCardList}>
            <p>Carregando usuarios...</p>
          </div>
        ) : usuarios.length > 0 ? (
          <div className={stylesShared.cardList}>
            {usuarios.map((usuario) => (
              <Card key={usuario.id}>
                <Card.Header
                  className={
                    usuario.active
                      ? stylesShared.active
                      : stylesShared.notActive
                  }
                >
                  {usuario.full_name}
                </Card.Header>
                <Card.Body>
                  <CardField label="E-mail">{usuario.email}</CardField>
                  <CardField label="Celular">{usuario.mobile}</CardField>
                  <CardField label="Status">
                    {usuario.active ? "Ativo" : "Inativo"}
                  </CardField>
                </Card.Body>
                <Card.Actions className={stylesShared.cardActions}>
                  <ActionButtons
                    usuario={usuario}
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
            <p>Nenhum usuario cadastrado ainda.</p>
          </div>
        )}

        {totalUsuarios > itemsPerPage ? (
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
        message="Tem certeza que deseja excluir este usuario? Esta ação não pode ser desfeita."
        isOpen={usuarioParaExcluir !== null}
        onClose={() => setUsuarioParaExcluir(null)}
        onConfirm={confirmarExclusao}
      />
    </Main>
  );
}
