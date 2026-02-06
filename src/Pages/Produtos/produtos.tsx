import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Main } from "../../Components/Main/Main";
import { Button } from "../../Components/Button/Button";
import { useGlobalState } from "../../Hooks/useGlobalState";
import { supabase } from "../../services/supabase";
import { useBusinessId } from "../../Hooks/useBusiness";
import Dialogs from "../../Components/Dialogs/Dialogs/Dialogs";
import style from "./produtos.module.css";
import type { Produto } from "../../Types/ProdutosTypes";
import { Plus, Package, X } from "lucide-react";
import { FaEdit, FaTrash } from "react-icons/fa";

export function Produtos() {
  const navigate = useNavigate();
  const { user } = useGlobalState();
  const { businessId } = useBusinessId();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchProdutos = useCallback(async () => {
    if (!businessId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("products")
        .select("*")
        .order("name", { ascending: true });

      if (fetchError) throw fetchError;

      setProdutos(data || []);
    } catch (err) {
      setError((err as Error).message);
      console.error("Erro ao buscar produtos:", err);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    if (user && businessId) {
      fetchProdutos();
    }
  }, [user, businessId, fetchProdutos]);

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) {
      return;
    }

    try {
      const { error } = await supabase.from("products").delete().eq("id", id);

      if (error) throw error;

      setProdutos(produtos.filter((p) => p.id !== id));
    } catch (err) {
      setError((err as Error).message);
      console.error("Erro ao excluir produto:", err);
    }
  };

  const filteredProdutos = produtos.filter((produto) => {
    const term = searchTerm.toLowerCase();
    return (
      produto.name.toLowerCase().includes(term) ||
      produto.description.toLowerCase().includes(term) ||
      ((produto as any).barcode || "").toLowerCase().includes(term) ||
      ((produto as any).flavor || "").toLowerCase().includes(term) ||
      ((produto as any).package_weight || "")
        .toString()
        .toLowerCase()
        .includes(term)
    );
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  return (
    <Main>
      <div className={style.container}>
        <div className={style.header}>
          <h1 className={style.title}>
            <Package size={32} />
            Produtos
          </h1>
          <div className={style.actions}>
            <div className={style.searchContainer}>
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={style.searchInput}
              />
            </div>
            <Button onClick={() => navigate("/produtos/novo")}>
              <Plus size={20} />
              Novo Produto
            </Button>
          </div>
        </div>

        {error && <div className={style.errorMessage}>{error}</div>}

        {loading ? (
          <div className={style.emptyState}>
            <div className={style.emptyStateTitle}>Carregando...</div>
          </div>
        ) : filteredProdutos.length === 0 ? (
          <div className={style.emptyState}>
            <Package size={64} className={style.emptyStateIcon} />
            <h2 className={style.emptyStateTitle}>
              {searchTerm
                ? "Nenhum produto encontrado"
                : "Nenhum produto cadastrado"}
            </h2>
            <p className={style.emptyStateText}>
              {searchTerm
                ? "Tente ajustar os termos de busca"
                : "Clique no botão acima para criar um novo produto"}
            </p>
          </div>
        ) : (
          <div className={style.productsGrid}>
            {filteredProdutos.map((produto) => (
              <div
                key={produto.id}
                className={style.productCard}
                onClick={() => {
                  setSelectedProduto(produto);
                  setIsModalOpen(true);
                }}
                style={{ cursor: "pointer" }}
              >
                {produto.image_url && (
                  <img
                    src={produto.image_url}
                    alt={produto.name}
                    className={style.productImage}
                  />
                )}
                <div className={style.productInfo}>
                  <div style={{ marginBottom: "0.5rem" }}>
                    <strong>Cód. Barras:</strong> {produto.barcode || "N/A"}
                  </div>
                  <h3 className={style.productName}>{produto.name}</h3>
                  <div className={style.productDetails}>
                    <span className={style.price}>
                      {formatPrice(produto.price)}
                    </span>
                    {(produto.price_per_kilo ?? 0) > 0 && (
                      <span
                        style={{
                          marginLeft: "0.75rem",
                          color: "var(--text-color-secondary)",
                        }}
                      >
                        {formatPrice((produto as any).price_per_kilo)} / kg
                      </span>
                    )}
                  </div>
                  <div className={style.productActions}>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/produtos/${produto.id}`);
                      }}
                      title="Editar"
                    >
                      <FaEdit />
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(produto.id);
                      }}
                      title="Excluir"
                    >
                      <FaTrash />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedProduto && (
          <Dialogs
            isOpen={isModalOpen}
            title={selectedProduto.name}
            titleColor="black"
            onClose={() => setIsModalOpen(false)}
          >
            <div style={{ marginBottom: "1rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "1rem",
                }}
              >
                {selectedProduto.image_url && (
                  <img
                    src={selectedProduto.image_url}
                    alt={selectedProduto.name}
                    style={{
                      maxWidth: "150px",
                      height: "150px",
                      objectFit: "cover",
                      borderRadius: "0.5rem",
                    }}
                  />
                )}
                <button
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "1.5rem",
                    cursor: "pointer",
                    color: "var(--text-color-secondary)",
                    padding: "0",
                  }}
                  title="Fechar"
                >
                  ✕
                </button>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                {selectedProduto.barcode && (
                  <div>
                    <strong>Código de Barras:</strong> {selectedProduto.barcode}
                  </div>
                )}
                <div>
                  <strong>Preço:</strong> {formatPrice(selectedProduto.price)}
                </div>
                {(selectedProduto.price_per_kilo ?? 0) > 0 && (
                  <div>
                    <strong>Preço por Kilo:</strong>{" "}
                    {formatPrice((selectedProduto as any).price_per_kilo)}
                  </div>
                )}
                {(selectedProduto as any).package_weight !== undefined && (
                  <div>
                    <strong>Peso do Pacote:</strong>{" "}
                    {Number(
                      (selectedProduto as any).package_weight,
                    ).toLocaleString("pt-BR", {
                      maximumFractionDigits: 3,
                    })}{" "}
                    kg
                  </div>
                )}
                <div>
                  <strong>Quantidade em Estoque:</strong>{" "}
                  {selectedProduto.quantity}
                </div>
                {(selectedProduto as any).flavor && (
                  <div>
                    <strong>Sabor:</strong> {(selectedProduto as any).flavor}
                  </div>
                )}
              </div>
              {selectedProduto.description && (
                <div style={{ marginTop: "1rem" }}>
                  <strong>Descrição:</strong>
                  <p style={{ marginTop: "0.5rem" }}>
                    {selectedProduto.description}
                  </p>
                </div>
              )}
              <div style={{ marginTop: "1rem" }}>
                <strong>Status:</strong>{" "}
                {selectedProduto.active ? (
                  <span style={{ color: "green" }}>Ativo</span>
                ) : (
                  <span style={{ color: "red" }}>Inativo</span>
                )}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                justifyContent: "flex-end",
              }}
            >
              <Button onClick={() => setIsModalOpen(false)}>Fechar</Button>
            </div>
          </Dialogs>
        )}
      </div>
    </Main>
  );
}
