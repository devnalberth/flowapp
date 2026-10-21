import { useEffect, useRef, useState } from "react";
import { Image, Upload, Trash2 } from "lucide-react";
import Modal from "../ui/Modal";
import ConfirmModal from "../ui/ConfirmModal";
import Button from "../ui/Button";
import { Input, Select } from "../ui/Field";
import Banner from "../ui/Banner";
import "./DreamMapModal.css";

export default function DreamMapModal({
  open,
  onClose,
  onSubmit,
  onDelete,
  goals = [],
  initialData = null,
  pending = false,
  error,
}) {
  const isEditing = !!initialData;
  const [form, setForm] = useState({ title: "", goalId: "" });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageError, setImageError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileInputRef = useRef(null);
  const titleRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setForm({
      title: initialData?.title || "",
      goalId: initialData?.goalId || initialData?.goal_id || "",
    });
    setImageFile(null);
    setImagePreview(initialData?.imageUrl || initialData?.image_url || null);
    setImageError("");
    setConfirmDelete(false);
    const frame = requestAnimationFrame(() =>
      initialData ? titleRef.current?.focus() : fileInputRef.current?.click(),
    );
    return () => cancelAnimationFrame(frame);
  }, [open, initialData]);

  if (!open) return null;
  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
      setImageError("");
      requestAnimationFrame(() => titleRef.current?.focus());
    };
    reader.onerror = () =>
      setImageError(
        "Não foi possível ler a imagem. Escolha o arquivo novamente.",
      );
    reader.readAsDataURL(file);
  };
  const handleSubmit = (event) => {
    event.preventDefault();
    if (pending) return;
    if (!imagePreview) {
      setImageError("Escolha uma imagem para adicionar ao mapa.");
      return;
    }
    if (!form.title) return;
    onSubmit?.(form, imageFile);
  };
  return (
    <>
      <Modal
        open={open}
        onClose={pending ? undefined : onClose}
        title={isEditing ? "Editar imagem" : "Adicionar ao mapa dos sonhos"}
        subtitle="Uma imagem que lembre o porquê de cada meta."
        icon={Image}
        width={600}
        className={`dream-form-modal ${confirmDelete ? "is-confirming" : ""}`}
        hint="Enter salva · Esc cancela"
        footer={
          <>
            {isEditing && onDelete && (
              <Button
                className="dream-form-delete"
                variant="danger"
                icon={Trash2}
                disabled={pending}
                onClick={() => setConfirmDelete(true)}
              >
                Excluir
              </Button>
            )}
            <Button variant="ghost" disabled={pending} onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" form="dream-form" loading={pending}>
              {isEditing ? "Salvar alterações" : "Adicionar ao mapa"}
            </Button>
          </>
        }
      >
        <form id="dream-form" className="dream-form" onSubmit={handleSubmit}>
          <div className="dream-form-image-field">
            <span>Imagem</span>
            <input
              ref={fileInputRef}
              aria-label="Selecionar imagem"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={pending}
              hidden
            />
            {imagePreview ? (
              <div className="dream-form-preview">
                <img
                  src={imagePreview}
                  alt={form.title || "Prévia da imagem selecionada"}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Upload}
                  disabled={pending}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Trocar imagem
                </Button>
              </div>
            ) : (
              <button
                type="button"
                className="dream-form-upload"
                disabled={pending}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={24} strokeWidth={1.75} />
                <strong>Escolher uma imagem</strong>
                <span>Clique para selecionar um arquivo de imagem.</span>
              </button>
            )}
            <small>
              {imageFile?.name ||
                (isEditing
                  ? "Imagem atual · troque o arquivo se quiser atualizar."
                  : "Escolha uma imagem do que você quer viver.")}
            </small>
            {imageError && (
              <p className="dream-form-image-error" role="alert">
                {imageError}
              </p>
            )}
          </div>
          <Input
            ref={titleRef}
            label="Título"
            placeholder="Ex: Primeira maratona"
            required
            value={form.title}
            disabled={pending}
            onChange={(event) =>
              setForm({ ...form, title: event.target.value })
            }
          />
          <Select
            label="Meta relacionada"
            optional
            value={form.goalId}
            disabled={pending}
            onChange={(event) =>
              setForm({ ...form, goalId: event.target.value })
            }
          >
            <option value="">Nenhuma meta</option>
            {goals.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.title}
              </option>
            ))}
          </Select>
          {error && <Banner tone="danger">{error}</Banner>}
        </form>
      </Modal>
      {confirmDelete && (
        <ConfirmModal
          title="Excluir imagem?"
          icon={Trash2}
          confirmIcon={Trash2}
          width={440}
          danger
          confirmLabel="Excluir imagem"
          pending={pending}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={onDelete}
          message="A imagem será removida do mapa dos sonhos. A meta relacionada continua existindo."
        >
          <strong>{form.title}</strong>
          {error && <Banner tone="danger">{error}</Banner>}
        </ConfirmModal>
      )}
    </>
  );
}
