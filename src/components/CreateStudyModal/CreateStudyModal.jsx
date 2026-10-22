import { useState, useRef, useId, useEffect } from "react";
import {
  X,
  Book,
  GraduationCap,
  BookOpen,
  Image,
  ChevronDown,
  Compass,
} from "lucide-react";
import { studyService } from "../../services/studyService";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Field, { Input, Select } from "../ui/Field";
import Toast from "../ui/Toast";
import "./CreateStudyModal.css";

const STUDY_TYPES = [
  { id: "COURSE", label: "Curso", icon: BookOpen, color: "brasa" },
  {
    id: "UNIVERSITY",
    label: "Faculdade",
    icon: GraduationCap,
    color: "violeta",
  },
  { id: "MENTORSHIP", label: "Mentoria", icon: Compass, color: "ciano" },
  { id: "BOOK", label: "Livro", icon: Book, color: "verde" },
];

const CATEGORIES = [
  "Programação",
  "Audiovisual",
  "Design",
  "Marketing",
  "Finanças",
  "Idiomas",
  "Gestão",
  "Saúde",
  "Outros",
];

const STATUS_OPTIONS = [
  { id: "NOT_STARTED", label: "Não iniciado" },
  { id: "IN_PROGRESS", label: "Em andamento" },
  { id: "PAUSED", label: "Pausado" },
  { id: "COMPLETED", label: "Concluído" },
];

export default function CreateStudyModal({ onClose, onSubmit, userId }) {
  const [submitError, setSubmitError] = useState(false);
  const formId = useId();
  const [formData, setFormData] = useState({
    title: "",
    type: "COURSE",
    category: "",
    status: "NOT_STARTED",
    url: "",
    description: "",
  });
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const titleRef = useRef(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => titleRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setSubmitError(false);
    setIsUploading(true);

    try {
      // Se tiver arquivo de capa, faz upload primeiro
      let coverUrl = null;
      if (coverFile && userId) {
        coverUrl = await studyService.uploadCoverImage(coverFile, userId);
      }

      await onSubmit({
        title: formData.title.trim(),
        type: formData.type,
        category: formData.category || null,
        status: formData.status,
        url: formData.url || null,
        description: formData.description || null,
        coverUrl: coverUrl,
      });

      // Reset form
      setFormData({
        title: "",
        type: "COURSE",
        category: "",
        status: "NOT_STARTED",
        url: "",
        description: "",
      });
      setCoverFile(null);
      setCoverPreview(null);
      onClose();
    } catch (error) {
      console.error("Erro ao criar estudo:", error);
      setSubmitError(true);
    } finally {
      setIsUploading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      // Preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const removeCover = () => {
    setCoverFile(null);
    setCoverPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const getNameLabel = () => {
    switch (formData.type) {
      case "COURSE":
        return "Nome do curso";
      case "UNIVERSITY":
        return "Nome da faculdade/curso";
      case "MENTORSHIP":
        return "Nome da mentoria";
      case "BOOK":
        return "Título do livro";
      default:
        return "Nome";
    }
  };

  return (
    <Modal
      className="study-modal"
      width={600}
      title="Novo estudo"
      subtitle="Curso, faculdade, mentoria ou livro. O progresso vem do conteúdo."
      icon={GraduationCap}
      onClose={onClose}
      hint="Enter salva · Esc cancela"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form={formId}
            disabled={!formData.title.trim() || isUploading}
            loading={isUploading}
          >
            Criar estudo
          </Button>
        </>
      }
    >
      {submitError && (
        <Toast
          tone="danger"
          title="Não foi possível criar o estudo"
          detail="Tente novamente. Os campos foram mantidos."
          onClose={() => setSubmitError(false)}
        />
      )}
      <form id={formId} className="study-modal__form" onSubmit={handleSubmit}>
        <fieldset className="study-modal__type-field">
          <legend>Tipo de estudo</legend>
          <div className="study-modal__types">
            {STUDY_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  type="button"
                  className={`study-modal__type ${formData.type === type.id ? "active" : ""}`}
                  style={{
                    "--study-type-color": `var(--fa-p-${type.color}-500)`,
                    "--study-type-soft": `var(--fa-p-${type.color}-50)`,
                  }}
                  aria-pressed={formData.type === type.id}
                  onClick={() => handleChange("type", type.id)}
                >
                  <span>
                    <Icon size={17} strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  {type.label}
                </button>
              );
            })}
          </div>
        </fieldset>
        <Input
          ref={titleRef}
          id="study-title"
          label={getNameLabel()}
          placeholder="Digite o nome…"
          value={formData.title}
          onChange={(e) => handleChange("title", e.target.value)}
          autoFocus
        />
        <div className="study-modal__row">
          <div className="study-modal__select">
            <Select
              id="study-category"
              label="Categoria"
              value={formData.category}
              onChange={(e) => handleChange("category", e.target.value)}
            >
              <option value="">Selecione…</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </Select>
            <ChevronDown size={16} strokeWidth={1.75} aria-hidden="true" />
          </div>
          <div className="study-modal__select">
            <Select
              id="study-status"
              label="Status"
              value={formData.status}
              onChange={(e) => handleChange("status", e.target.value)}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </Select>
            <ChevronDown size={16} strokeWidth={1.75} aria-hidden="true" />
          </div>
        </div>
        <Input
          id="study-url"
          type="url"
          label="Link da plataforma"
          optional
          placeholder="https://"
          value={formData.url}
          onChange={(e) => handleChange("url", e.target.value)}
        />
        <div className="study-modal__cover-field">
          <label htmlFor="study-cover">
            Capa <span>· opcional</span>
          </label>
          <div
            className={`study-modal__upload ${coverPreview ? "has-preview" : ""}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <button
              type="button"
              className="study-modal__upload-trigger"
              onClick={triggerFileInput}
              aria-label={
                coverPreview
                  ? "Trocar imagem de capa"
                  : "Selecionar imagem de capa"
              }
            >
              {coverPreview ? (
                <img
                  src={coverPreview}
                  alt="Prévia da capa"
                  className="study-modal__preview-img"
                />
              ) : (
                <>
                  <span className="study-modal__upload-icon">
                    <Image size={18} strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <span className="study-modal__upload-text">
                    <strong>Clique ou arraste uma imagem</strong>
                    <span>Sem capa, o card usa a cor e o ícone do tipo.</span>
                  </span>
                </>
              )}
            </button>
            {coverPreview && (
              <button
                type="button"
                className="study-modal__remove-cover"
                aria-label="Remover capa"
                onClick={removeCover}
              >
                <X size={16} />
              </button>
            )}
            <input
              id="study-cover"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              hidden
            />
          </div>
        </div>
        <Field
          id="study-description"
          className="study-modal__description"
          label="Descrição"
          optional
          count={formData.description.length}
          maxLength={200}
        >
          <textarea
            id="study-description"
            placeholder="Do que se trata, em uma ou duas frases"
            value={formData.description}
            onChange={(e) => handleChange("description", e.target.value)}
            rows={2}
            maxLength={200}
          />
        </Field>
      </form>
    </Modal>
  );
}
