import { useState, useEffect, useRef, useCallback } from "react";
import { Main } from "../../Components/Main/Main";
import style from "./produtosForm.module.css";
import { supabase } from "../../services/supabase";
import { useNavigate, useParams } from "react-router-dom";
import { useGlobalState } from "../../Hooks/useGlobalState";
import Dialogs from "../../Components/Dialogs/Dialogs/Dialogs";
import { Button } from "../../Components/Button/Button";
import { MdAssignmentReturn, MdOutlineSave } from "react-icons/md";
import { Upload, Package } from "lucide-react";
import type { Produto } from "../../Types/ProdutosTypes";

export function ProdutosForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const { user } = useGlobalState();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(0);
  const [pricePerKilo, setPricePerKilo] = useState<number>(0);
  const [packageWeight, setPackageWeight] = useState<number>(0);
  const [barcode, setBarcode] = useState<string>("");
  const [flavor, setFlavor] = useState<string>("");
  const [imageUrl, setImageUrl] = useState("");
  const [active, setActive] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");

  const namedeInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProduto = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from("products")
        .select("*")
        .eq("id", id.trim())
        .single();

      if (fetchError) throw fetchError;

      if (data) {
        const produto = data as Produto;
        setName(produto.name || "");
        setDescription(produto.description || "");
        setPrice(produto.price || 0);
        setQuantity(produto.quantity || 0);
        setPricePerKilo(produto.price_per_kilo || 0);
        setPackageWeight(produto.package_weight || 0);
        setBarcode(produto.barcode || "");
        setFlavor(produto.flavor || "");
        setImageUrl(produto.image_url ?? "");
        setActive(produto.active ?? true);
      }
    } catch (fetchError) {
      setError((fetchError as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEditing) {
      fetchProduto();
    }
  }, [isEditing, fetchProduto]);

  useEffect(() => {
    namedeInputRef.current?.focus();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImageUrl(previewUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!user) throw new Error("Usuário não autenticado.");

      if (!name.trim()) throw new Error("Nome do produto é obrigatório.");
      if (price <= 0) throw new Error("Preço deve ser maior que zero.");

      let finalImageUrl = imageUrl;

      if (selectedFile) {
        const fileExt = selectedFile.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("produtos")
          .upload(fileName, selectedFile);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("produtos")
          .getPublicUrl(fileName);
        finalImageUrl = data.publicUrl;
      }

      const produtoData = {
        name,
        description,
        price: parseFloat(price.toString()),
        price_per_kilo: parseFloat(pricePerKilo.toString()),
        package_weight: parseFloat(packageWeight.toString()),
        quantity: parseInt(quantity.toString()),
        image_url: finalImageUrl,
        barcode,
        flavor,
        active,
      };

      if (isEditing) {
        const { error: updateError } = await supabase
          .from("products")
          .update(produtoData)
          .eq("id", id);

        if (updateError) throw updateError;

        setDialogMessage("Produto atualizado com sucesso!");
      } else {
        const { error: insertError } = await supabase
          .from("products")
          .insert([produtoData]);

        if (insertError) throw insertError;

        setDialogMessage("Produto cadastrado com sucesso!");
      }

      // Limpar seleção de arquivo após sucesso
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setIsSuccessDialogOpen(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDialogClose = () => {
    setIsSuccessDialogOpen(false);
    navigate("/produtos");
  };

  return (
    <Main>
      <div className={style.formContainer}>
        <div className={style.formHeader}>
          <Package size={32} />
          <h1 className={style.formTitle}>
            {isEditing ? "Editar Produto" : "Novo Produto"}
          </h1>
        </div>

        {error && <div className={style.errorMessage}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className={style.formGroup}>
            <label className={style.label}>Nome do Produto *</label>
            <input
              ref={namedeInputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={style.input}
              placeholder="Digite o nome do produto"
              required
            />
          </div>

          <div className={style.formGroup}>
            <label className={style.label}>Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={style.textarea}
              placeholder="Digite a descrição do produto"
            />
          </div>
          <div className={style.formGroup}>
            <label className={style.label}>Código de Barra</label>
            <input
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              className={style.input}
              placeholder="Digite o código de barras"
            />
          </div>

          <div className={style.gridRow}>
            <div className={style.formGroup}>
              <label className={style.label}>Preço (R$) *</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value))}
                className={style.input}
                placeholder="0,00"
                step="0.01"
                min="0"
                required
              />
            </div>
            <div className={style.formGroup}>
              <label className={style.label}>Preço por Kilo (R$)</label>
              <input
                type="number"
                value={pricePerKilo}
                onChange={(e) => setPricePerKilo(parseFloat(e.target.value))}
                className={style.input}
                placeholder="0,00"
                step="0.01"
                min="0"
              />
            </div>

            <div className={style.formGroup}>
              <label className={style.label}>Peso do Pacote (kg)</label>
              <input
                type="number"
                value={packageWeight}
                onChange={(e) => setPackageWeight(parseFloat(e.target.value))}
                className={style.input}
                placeholder="0"
                step="0.001"
                min="0"
              />
            </div>

            <div className={style.formGroup}>
              <label className={style.label}>Quantidade em Estoque</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                className={style.input}
                placeholder="0"
                min="0"
              />
            </div>

            <div className={style.formGroup}>
              <label className={style.label}>Sabor</label>
              <input
                type="text"
                value={flavor}
                onChange={(e) => setFlavor(e.target.value)}
                className={style.input}
                placeholder="Digite o sabor"
              />
            </div>

            <div className={style.formGroup}>
              <label className={style.label}>
                Produto ativo
                <div
                  className={style.checkboxContainer}
                  tabIndex={0}
                  onClick={() => setActive(!active)}
                >
                  <input
                    className={style.inputCheckbox}
                    id="active"
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                  />
                  Ativo
                </div>
              </label>
            </div>
          </div>

          <div className={style.formGroup}>
            <div className={style.imageUploadContainer}>
              <span className={style.label}>Imagem do Produto</span>
              <div className={style.imageOptions}>
                {imageUrl && (
                  <div className={style.imagePreview}>
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className={style.imagePreview}
                    />
                  </div>
                )}
                <label className={style.imageUploadArea}>
                  <div className={style.imageUploadText}>
                    <Upload size={32} className={style.imageUploadIcon} />
                    <span>Clique para selecionar imagem</span>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* <div className={style.optionDivider}>
                Ou selecione uma imagem abaixo
              </div>
              <div className={style.optionDivider}>Ou carregue uma imagem</div>
              <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                {availableImages.length === 0 ? (
                  <p
                    style={{
                      padding: "1rem",
                      textAlign: "center",
                      color: "var(--text-color-secondary)",
                    }}
                  >
                    Nenhuma imagem disponível na pasta
                  </p>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(120px, 1fr))",
                      gap: "1rem",
                    }}
                  >
                    {availableImages.map((image) => (
                      <div
                        key={image}
                        onClick={() => handleImageSelect(image)}
                        style={{
                          cursor: "pointer",
                          borderRadius: "0.5rem",
                          overflow: "hidden",
                          border:
                            imageUrl === image
                              ? "3px solid var(--accent-color)"
                              : "1px solid var(--border-color)",
                          transition: "all 0.3s ease",
                        }}
                      >
                        <img
                          src={image}
                          alt="Opção"
                          style={{
                            width: "100%",
                            height: "120px",
                            objectFit: "cover",
                          }}
                          onError={(e) => {
                            // Se a imagem não carregar, mostrar placeholder
                            (
                              e.target as HTMLImageElement
                            ).style.backgroundColor = "var(--border-color)";
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div> */}

          <div className={`${style.actions} ${"actions"}`}>
            <Button
              type="reset"
              variant="bg-cancel"
              onClick={() => navigate("/produtos")}
              title="Voltar para lista de Produtos"
              style={{ width: "120px" }}
            >
              <MdAssignmentReturn size={28} />
              Voltar para lista
            </Button>
            <Button
              variant="bg-primary"
              type="submit"
              disabled={loading || error !== null}
              title="Salvar Produto"
              style={{ width: "120px" }}
            >
              <MdOutlineSave size={28} />
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>

        <Dialogs
          isOpen={isSuccessDialogOpen}
          title="Sucesso"
          titleColor="black"
          onClose={handleDialogClose}
        >
          <div style={{ marginBottom: "1rem" }}>
            <p>{dialogMessage}</p>
          </div>
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              justifyContent: "flex-end",
            }}
          >
            <Button onClick={handleDialogClose}>OK</Button>
          </div>
        </Dialogs>
      </div>
    </Main>
  );
}
