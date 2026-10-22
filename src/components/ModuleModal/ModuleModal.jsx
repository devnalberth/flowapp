import { useEffect, useMemo, useRef, useState, useId } from "react";
import {
  Plus,
  Layers,
  Boxes,
  BookOpen,
  PlayCircle,
  Calendar,
  CalendarClock,
  ListChecks,
  Type,
} from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Field, { Input, DateInput, Select } from "../ui/Field";
import Toast from "../ui/Toast";
import "./ModuleModal.css";

export const KIND_META = {
  module: {
    label: "Módulo",
    icon: Layers,
    color: "var(--fa-p-brasa-500)",
    soft: "var(--fa-p-brasa-50)",
    hint: "Grande bloco do curso",
    placeholder: "Ex: Fundamentos do Front-end",
  },
  submodule: {
    label: "Sub-módulo",
    icon: Boxes,
    color: "var(--fa-p-ciano-500)",
    soft: "var(--fa-p-ciano-50)",
    hint: "Divisão dentro do módulo",
    placeholder: "Ex: HTML & CSS",
  },
  subject: {
    label: "Matéria",
    icon: BookOpen,
    color: "var(--fa-p-violeta-500)",
    soft: "var(--fa-p-violeta-50)",
    hint: "Agrupa aulas",
    placeholder: "Ex: Flexbox e Grid",
  },
  lesson: {
    label: "Aula",
    icon: PlayCircle,
    color: "var(--fa-p-verde-500)",
    soft: "var(--fa-p-verde-50)",
    hint: "Conteúdo individual",
    placeholder: "Ex: Introdução ao Flexbox",
  },
};

const PRIORITIES = [
  { id: "Baixa", label: "Baixa", asset: "baixa" },
  { id: "Normal", label: "Normal", asset: "normal" },
  { id: "Alta", label: "Alta", asset: "alta" },
  { id: "Urgente", label: "Urgente", asset: "urgente" },
];

const isFlowPriority = (p) => p === "Alta" || p === "Urgente";
const article = (kind) => (kind === "subject" || kind === "lesson" ? "a" : "o");

// Uma linha por item. Ignora linhas vazias e marcadores comuns de lista
// ("1.", "-", "•"), porque quase todo índice de curso vem colado nesse formato.
const parseBulk = (text) =>
  String(text || "")
    .split("\n")
    .map((line) => line.replace(/^\s*(?:\d+[.)]\s*|[-*•]\s*)?/, "").trim())
    .filter(Boolean);

export default function ModuleModal({
  open,
  onClose,
  onSubmit,
  onBulkSubmit,
  mode = "create",
  allowedKinds = ["module"],
  initial = null,
  parentLabel = null,
  parentOptions = null,
}) {
  const formId = useId();
  const [submitError, setSubmitError] = useState(false);
  const [kind, setKind] = useState(allowedKinds[0]);
  const [title, setTitle] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [isBulk, setIsBulk] = useState(false);
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [priority, setPriority] = useState("Normal");
  const [saving, setSaving] = useState(false);
  const titleRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    setKind(initial?.kind || allowedKinds[0]);
    setTitle(initial?.title || "");
    setBulkText("");
    setIsBulk(false);
    setDescription(initial?.description || "");
    setParentId(initial?.parentId || "");
    setScheduledDate(initial?.scheduledDate || "");
    setScheduledTime(initial?.scheduledTime || "");
    setPriority(initial?.priority || "Normal");
    setSubmitError(false);
    const frame = requestAnimationFrame(() => titleRef.current?.focus());
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const bulkTitles = useMemo(() => parseBulk(bulkText), [bulkText]);

  if (!open) return null;

  const meta = KIND_META[kind] || KIND_META.module;
  const isEdit = mode === "edit";
  const showPicker = !isEdit && allowedKinds.length > 1;
  const showMove =
    isEdit && Array.isArray(parentOptions) && parentOptions.length > 0;
  // Lote só faz sentido criando vários irmãos do mesmo tipo.
  const canBulk = !isEdit && typeof onBulkSubmit === "function";
  const canSubmit = isBulk ? bulkTitles.length > 0 : title.trim().length > 0;

  const submitLabel = () => {
    if (saving) return "Salvando...";
    if (isEdit) return "Salvar";
    if (isBulk)
      return bulkTitles.length === 1
        ? "Criar 1 item"
        : `Criar ${bulkTitles.length} itens`;
    return `Criar ${meta.label.toLowerCase()}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || saving) return;
    setSubmitError(false);
    setSaving(true);
    try {
      if (isBulk) {
        await onBulkSubmit?.({ kind, titles: bulkTitles });
      } else {
        await onSubmit?.({
          title: title.trim(),
          description: description.trim() || null,
          kind,
          scheduledDate: scheduledDate || null,
          scheduledTime: scheduledDate ? scheduledTime || null : null,
          priority: scheduledDate ? priority : null,
          ...(showMove ? { parentModuleId: parentId || null } : {}),
        });
      }
      onClose?.();
    } catch (err) {
      console.error("Erro ao salvar:", err);
      setSubmitError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      width={600}
      className="moduleModal"
      onClose={onClose}
      title={
        isEdit ? `Editar ${meta.label.toLowerCase()}` : "Adicionar conteúdo"
      }
      subtitle={
        parentLabel
          ? `Dentro de “${parentLabel}”`
          : isEdit
            ? meta.hint
            : "Escolha o tipo e dê um nome."
      }
      icon={Plus}
      hint="Enter salva · Esc cancela"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} disabled={saving || !canSubmit}>
            {submitLabel()}
          </Button>
        </>
      }
    >
      {submitError && (
        <Toast
          tone="danger"
          title="Não foi possível salvar o conteúdo"
          detail="Tente novamente. Os campos foram mantidos."
          onClose={() => setSubmitError(false)}
        />
      )}
      <form id={formId} className="moduleModal__form" onSubmit={handleSubmit}>
        {showPicker && (
          <fieldset className="moduleModal__type-field">
            <legend>Tipo</legend>
            <div className="moduleModal__types">
              {allowedKinds.map((k) => {
                const km = KIND_META[k],
                  Icon = km.icon;
                return (
                  <button
                    type="button"
                    key={k}
                    className={`moduleModal__type ${kind === k ? "is-active" : ""}`}
                    aria-pressed={kind === k}
                    onClick={() => setKind(k)}
                    style={{ "--kind-color": km.color, "--kind-soft": km.soft }}
                  >
                    <span className="moduleModal__typeIcon">
                      <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
                    </span>
                    <span className="moduleModal__typeText">
                      <strong>{km.label}</strong>
                      <span>{km.hint}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}
        <div className="moduleModal__name">
          <div className="moduleModal__labelRow">
            <label htmlFor="mm-title">
              {isBulk
                ? `Nome de cada ${meta.label.toLowerCase()}`
                : `Nome d${article(kind)} ${meta.label.toLowerCase()}`}
            </label>
            {canBulk && (
              <button
                type="button"
                className="moduleModal__bulkToggle"
                aria-pressed={isBulk}
                onClick={() => setIsBulk((v) => !v)}
              >
                {isBulk ? <Type size={13} /> : <ListChecks size={13} />}{" "}
                {isBulk ? "Adicionar um só" : "Vários de uma vez"}
              </button>
            )}
          </div>
          <Field
            id="mm-title"
            hint={
              isBulk
                ? bulkTitles.length > 0
                  ? `${bulkTitles.length} ${bulkTitles.length === 1 ? "item será criado" : "itens serão criados"}, na ordem da lista.`
                  : "Cole o índice do curso. Numeração e marcadores no começo da linha são removidos."
                : undefined
            }
          >
            {isBulk ? (
              <textarea
                id="mm-title"
                ref={titleRef}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={
                  "Um por linha. Ex:\nVariáveis e Constantes\nCondicionais\nFunções"
                }
                rows={7}
              />
            ) : (
              <input
                id="mm-title"
                ref={titleRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={meta.placeholder}
                required
              />
            )}
          </Field>
        </div>
        {!isBulk && (
          <section
            className="moduleModal__schedule"
            aria-label="Agendar conteúdo"
          >
            <h3>
              <Calendar size={14} strokeWidth={1.75} aria-hidden="true" />
              Agendar <span>opcional</span>
            </h3>
            <div className="moduleModal__row2">
              <DateInput
                label="Data"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
              <Input
                type="time"
                label="Horário"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                disabled={!scheduledDate}
                title={scheduledDate ? "Horário" : "Defina a data primeiro"}
              />
            </div>
            {scheduledDate && (
              <fieldset className="moduleModal__priority-field">
                <legend>Prioridade</legend>
                <div className="moduleModal__prios">
                  {PRIORITIES.map((p) => (
                    <button
                      type="button"
                      key={p.id}
                      className={`moduleModal__prio ${priority === p.id ? "is-active" : ""}`}
                      aria-pressed={priority === p.id}
                      onClick={() => setPriority(p.id)}
                    >
                      <img
                        src={`/assets/redesign/studies/priorities/${p.asset}.svg`}
                        width="8"
                        height="8"
                        alt=""
                      />
                      {p.label}
                      {isFlowPriority(p.id) && (
                        <span className="moduleModal__flowTag">Flow</span>
                      )}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}
            <p className="moduleModal__hint">
              <CalendarClock size={13} strokeWidth={1.75} aria-hidden="true" />
              Com data, {article(kind)} {meta.label.toLowerCase()} aparece nas
              Tarefas com o pomodoro. Alta e Urgente entram no Flow.
            </p>
          </section>
        )}
        {showMove && (
          <Select
            id="mm-parent"
            label="Mover para"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
          >
            {parentOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </Select>
        )}
        {!isBulk && (
          <Field
            id="mm-desc"
            className="moduleModal__description"
            label="Descrição"
            optional
          >
            <textarea
              id="mm-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Objetivo, ementa, pré-requisitos…"
              rows={2}
            />
          </Field>
        )}
      </form>
    </Modal>
  );
}
