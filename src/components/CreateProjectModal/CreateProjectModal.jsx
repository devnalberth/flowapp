import { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Check,
  FolderKanban,
  CircleCheck,
  ChevronDown,
} from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { Input, Select, DateInput } from "../ui/Field";
import { projectColorToken } from "../../utils/projectAppearance";
import ClientModal from "../ClientModal/ClientModal.jsx";

import "./CreateProjectModal.css";

const AREAS = ["Profissional", "Pessoal", "Financeiro", "Estudos"];
const STATUS_OPTIONS = ["todo", "in_progress", "review", "completed"];
const COLOR_OPTIONS = [
  { label: "Laranja", value: "ff9500" },
  { label: "Azul", value: "007aff" },
  { label: "Verde", value: "34c759" },
  { label: "Rosa", value: "ff2d55" },
  { label: "Roxo", value: "af52de" },
  { label: "Cinza", value: "8e8e93" },
];
const DESCRIPTION_LIMIT = 200;

const DEFAULT_FORM = {
  title: "",
  area: AREAS[0],
  status: "todo",
  color: COLOR_OPTIONS[0].value,
  description: "",
  goalId: "",
  startDate: "",
  endDate: "",
  clientId: "",
};

const toDateInput = (value) => (value ? String(value).slice(0, 10) : "");

function ProjectSelect(props) {
  return (
    <div className="project-form-select">
      <Select {...props} />
      <ChevronDown size={16} strokeWidth={1.75} aria-hidden="true" />
    </div>
  );
}

export default function CreateProjectModal({
  open,
  onClose,
  onSubmit,
  goalOptions = [],
  clientOptions = [],
  onCreateClient,
  initialData = null,
  error,
}) {
  const [form, setForm] = useState(() => ({ ...DEFAULT_FORM }));
  const [showClientModal, setShowClientModal] = useState(false);
  const nameRef = useRef(null);

  const remainingChars = useMemo(
    () => `${(form.description || "").length}/${DESCRIPTION_LIMIT}`,
    [form.description],
  );
  useEffect(() => {
    if (open && !showClientModal)
      requestAnimationFrame(() => nameRef.current?.focus());
  }, [open, showClientModal]);

  useEffect(() => {
    if (!open) return undefined;
    if (initialData) {
      setForm({
        ...DEFAULT_FORM,
        ...initialData,
        description: initialData.description || "",
        goalId:
          initialData.goalId || initialData.goal_id || DEFAULT_FORM.goalId,
        clientId:
          initialData.clientId ||
          initialData.client_id ||
          DEFAULT_FORM.clientId,
        startDate: toDateInput(initialData.startDate || initialData.start_date),
        endDate: toDateInput(initialData.endDate || initialData.end_date),
      });
    } else {
      setForm(() => ({ ...DEFAULT_FORM }));
    }
  }, [open, initialData]);

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit?.(form);
  };

  const handleCreateClient = async (clientData) => {
    const created = await onCreateClient?.(clientData);
    if (created?.id) {
      setForm((prev) => ({ ...prev, clientId: created.id }));
    }
    setShowClientModal(false);
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        width={600}
        className="createProjectModal"
        title={initialData ? "Editar projeto" : "Novo projeto"}
        subtitle="Ligue a uma meta para ele contar no progresso dela."
        icon={FolderKanban}
        hint="Enter salva · Esc cancela"
        footer={
          <>
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" form="project-form">
              {initialData ? "Salvar alterações" : "Criar projeto"}
            </Button>
          </>
        }
      >
        <form
          id="project-form"
          className="project-form"
          onSubmit={handleSubmit}
        >
          {error && <p className="project-form-error" role="alert">{error}</p>}
          <Input
            label="Nome do projeto"
            ref={nameRef}
            name="title"
            value={form.title}
            onChange={updateField("title")}
            placeholder="Nome do projeto"
            required
          />
          <div className="project-form-row">
            <ProjectSelect
              label="Área"
              name="area"
              value={form.area}
              onChange={updateField("area")}
            >
              {AREAS.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </ProjectSelect>
            <fieldset className="project-form-colors">
              <legend>Cor do projeto</legend>
              <div>
                {COLOR_OPTIONS.map((color) => (
                  <button
                    type="button"
                    key={color.value}
                    aria-label={color.label}
                    aria-pressed={form.color === color.value}
                    style={{
                      "--swatch":
                        color.value === "8e8e93"
                          ? "var(--fa-text-muted)"
                          : projectColorToken(color.value),
                    }}
                    onClick={() =>
                      setForm((prev) => ({ ...prev, color: color.value }))
                    }
                  >
                    {form.color === color.value && <Check size={14} />}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
          <div className="project-form-row">
            <ProjectSelect
              label="Vincular a meta · opcional"
              name="goalId"
              value={form.goalId}
              onChange={updateField("goalId")}
            >
              <option value="">Sem vínculo</option>
              {goalOptions?.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.title}
                </option>
              ))}
            </ProjectSelect>
            <div className="project-form-client">
              <ProjectSelect
                label="Cliente · opcional"
                name="clientId"
                value={form.clientId}
                onChange={updateField("clientId")}
              >
                <option value="">Sem cliente</option>
                {clientOptions?.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                    {client.company ? ` · ${client.company}` : ""}
                  </option>
                ))}
              </ProjectSelect>
              <button type="button" onClick={() => setShowClientModal(true)}>
                <Plus size={12} /> Cadastrar novo cliente
              </button>
            </div>
          </div>
          <div className="project-form-row">
            <DateInput
              label="Início"
              name="startDate"
              value={form.startDate}
              onChange={updateField("startDate")}
            />
            <DateInput
              label="Prazo de término"
              name="endDate"
              value={form.endDate}
              onChange={updateField("endDate")}
            />
          </div>
          <fieldset className="project-form-status">
            <legend>Status</legend>
            <div>
              {STATUS_OPTIONS.map((status, i) => (
                <button
                  key={status}
                  type="button"
                  data-status={status}
                  aria-pressed={form.status === status}
                  onClick={() => setForm((prev) => ({ ...prev, status }))}
                >
                  <i />
                  {
                    ["A fazer", "Em andamento", "Em finalização", "Concluído"][
                      i
                    ]
                  }
                </button>
              ))}
            </div>
            <p>
              <CircleCheck size={15} /> Depois ele acompanha as tarefas: 80%
              feitas vira Em finalização e 100% vira Concluído.
            </p>
          </fieldset>
          <label className="project-form-description">
            <span>Descrição · opcional</span>
            <div>
              <textarea
                name="description"
                placeholder="Descreva o objetivo e escopo do projeto..."
                maxLength={DESCRIPTION_LIMIT}
                value={form.description}
                onChange={updateField("description")}
              />
              <span>{remainingChars}</span>
            </div>
          </label>
        </form>
      </Modal>
      {showClientModal && (
        <ClientModal
          open
          onClose={() => setShowClientModal(false)}
          onSubmit={handleCreateClient}
        />
      )}
    </>
  );
}
