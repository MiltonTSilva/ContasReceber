import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Main } from "../../Components/Main/Main";
import { Button } from "../../Components/Button/Button";
import { useGlobalState } from "../../Hooks/useGlobalState";
import { supabase } from "../../services/supabase";
import Dialogs from "../../Components/Dialogs/Dialogs/Dialogs";
import style from "./produtos.module.css";
import type { Produto } from "../../Types/ProdutosTypes";
import { Plus, Package, UploadCloud } from "lucide-react";
import {
  FaToggleOn,
  FaToggleOff,
  FaEdit,
  FaTrashAlt,
  FaWindowClose,
} from "react-icons/fa";
import { ConfirmationDialogs } from "../../Components/Dialogs/ConfirmationDialogs/ConfirmationDialogs";
import { useGeminiTranslation } from "../../Hooks/useGeminiTranslation";
import { ErrorDialogs } from "../../Components/Dialogs/ErrorDialogs/ErrorDialogs";

export function Produtos() {
  const navigate = useNavigate();
  const { user } = useGlobalState();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtoParaExcluir, setProdutoParaExcluir] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    translate: geminiTranslate,
    translatedText,
    error: translationError,
  } = useGeminiTranslation();

  const fetchProdutos = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    if (user) {
      fetchProdutos();
    }
  }, [user, fetchProdutos]);

  const handleExcluir = (id: string) => {
    setProdutoParaExcluir(id);
  };

  const confirmarExclusao = async () => {
    if (!produtoParaExcluir) return;

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", produtoParaExcluir);

      if (error) throw error;

      setProdutos(produtos.filter((p) => p.id !== produtoParaExcluir));
    } catch (error) {
      const errorMessage = (error as Error).message;
      setError(errorMessage);
    } finally {
      setProdutoParaExcluir(null);
    }
  };

  const filteredProdutos = produtos.filter((produto) => {
    const term = searchTerm.toLowerCase();
    return (
      produto.name.toLowerCase().includes(term) ||
      produto.description.toLowerCase().includes(term) ||
      (produto.barcode || "").toLowerCase().includes(term) ||
      (produto.flavor || "").toLowerCase().includes(term) ||
      (produto.package_weight || "").toString().toLowerCase().includes(term)
    );
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
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

  const handleMigrateImages = async () => {
    if (
      !confirm(
        "Isso irá procurar produtos com imagens locais (/produtos/...) e fazer upload para o Supabase Storage. Deseja continuar?",
      )
    )
      return;

    setLoading(true);
    try {
      // 1. Buscar produtos com caminho local (assumindo que começam com /produtos/)
      const { data: products, error: fetchError } = await supabase
        .from("products")
        .select("*")
        .ilike("image_url", "/produtos/%");

      if (fetchError) throw fetchError;

      if (!products || products.length === 0) {
        alert("Nenhum produto com imagem local (/produtos/...) encontrado.");
        setLoading(false);
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (const product of products) {
        try {
          if (!product.image_url) continue;

          // 2. Baixar a imagem local (o navegador busca da pasta public)
          const response = await fetch(product.image_url);
          if (!response.ok)
            throw new Error(
              `Falha ao carregar imagem local: ${product.image_url}`,
            );

          const blob = await response.blob();
          // Tenta manter o nome original do arquivo, adicionando timestamp para evitar duplicidade
          const originalName = product.image_url.split("/").pop();
          const fileName = originalName
            ? `${Date.now()}_${originalName}`
            : `${Date.now()}_${product.id}.jpg`;

          // 3. Upload para o Supabase Storage
          const { error: uploadError } = await supabase.storage
            .from("produtos")
            .upload(fileName, blob);

          if (uploadError) throw uploadError;

          // 4. Obter URL pública e atualizar produto
          const { data: publicUrlData } = supabase.storage
            .from("produtos")
            .getPublicUrl(fileName);

          await supabase
            .from("products")
            .update({ image_url: publicUrlData.publicUrl })
            .eq("id", product.id);
          successCount++;
        } catch (err) {
          console.error(`Erro ao migrar ${product.name}:`, err);
          errorCount++;
        }
      }
      alert(
        `Migração concluída!\nSucesso: ${successCount}\nErros: ${errorCount}`,
      );
      fetchProdutos();
    } catch (err) {
      setError("Erro na migração: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
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
            <Button
              onClick={handleMigrateImages}
              title="Migrar Imagens Locais"
              style={{
                visibility: "hidden",
                marginRight: "0.5rem",
                backgroundColor: "#6c757d",
              }}
            >
              <UploadCloud size={20} />
              Migrar
            </Button>
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
                    <strong>Cód. Barra:</strong> {produto.barcode || "N/A"}
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
                        {formatPrice(produto.price_per_kilo || 0)} / kg
                      </span>
                    )}
                  </div>

                  <div className={style.productActions}>
                    <Button
                      variant="bg-warning"
                      disabled={loading}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/produtos/${produto.id}`);
                      }}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExcluir(produto.id);
                      }}
                      title="Excluir"
                      type="button"
                      style={{ width: "80px" }}
                    >
                      <FaTrashAlt />
                      Excluir
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
                      width: "200px",
                      height: "250px",
                      objectFit: "cover",
                      borderRadius: "0.5rem",
                    }}
                  />
                )}
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
                    <strong>Código de Barra:</strong> {selectedProduto.barcode}
                  </div>
                )}
                <div>
                  <strong>Preço:</strong> {formatPrice(selectedProduto.price)}
                </div>
                {(selectedProduto.price_per_kilo ?? 0) > 0 && (
                  <div>
                    <strong>Preço por Kilo:</strong>{" "}
                    {formatPrice(selectedProduto.price_per_kilo || 0)} / kg
                  </div>
                )}
                {selectedProduto.package_weight !== undefined && (
                  <div>
                    <strong>Peso do Pacote:</strong>{" "}
                    {Number(selectedProduto.package_weight).toLocaleString(
                      "pt-BR",
                      {
                        maximumFractionDigits: 3,
                      },
                    )}{" "}
                    kg
                  </div>
                )}
                <div>
                  <strong>Quantidade em Estoque:</strong>{" "}
                  {selectedProduto.quantity}
                </div>
                {selectedProduto.flavor && (
                  <div>
                    <strong>Sabor:</strong> {selectedProduto.flavor}
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
                {selectedProduto.active ? <FaToggleOff /> : <FaToggleOn />}
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
              <Button
                variant="bg-primary"
                disabled={loading}
                onClick={() => setIsModalOpen(false)}
                title="Fechar"
                type="button"
                style={{ width: "80px" }}
              >
                <FaWindowClose size={20} />
                Fechar
              </Button>
            </div>
          </Dialogs>
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
        message="Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita."
        isOpen={produtoParaExcluir !== null}
        onClose={() => {
          setProdutoParaExcluir(null);
        }}
        onConfirm={confirmarExclusao}
      />
    </Main>
  );
}
