import { useEffect, useMemo, useRef, useState } from "react";
import { Target, Trash2, Wallet, Pencil } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { Input, Select, DateInput, Textarea } from "../ui/Field";
import Banner from "../ui/Banner";
import "./CreateGoalModal.css";

const DESCRIPTION_LIMIT = 280;

const GOAL_TYPES = [
  { value: "trimestral", label: "Trimestral (3 meses)" },
  { value: "semestral", label: "Semestral (6 meses)" },
  { value: "anual", label: "Anual (12 meses)" },
  { value: "custom", label: "Personalizado" },
];

const TRIMESTERS = [
  { value: 1, label: "1º Trimestre", months: [1, 2, 3] },
  { value: 2, label: "2º Trimestre", months: [4, 5, 6] },
  { value: 3, label: "3º Trimestre", months: [7, 8, 9] },
  { value: 4, label: "4º Trimestre", months: [10, 11, 12] },
];

const SEMESTERS = [
  { value: 1, label: "1º Semestre", months: [1, 2, 3, 4, 5, 6] },
  { value: 2, label: "2º Semestre", months: [7, 8, 9, 10, 11, 12] },
];

// Função auxiliar para converter "1º Trimestre" -> 1
const parseTrimesterValue = (val) => {
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    if (val.includes("1º")) return 1;
    if (val.includes("2º")) return 2;
    if (val.includes("3º")) return 3;
    if (val.includes("4º")) return 4;
  }
  return 1; // Padrão
};

const calculateTrimester = (startDate, endDate) => {
  if (!startDate) return null;
  const start = new Date(startDate);
  const startMonth = start.getMonth() + 1;

  if (endDate) {
    const end = new Date(endDate);
    const endMonth = end.getMonth() + 1;
    const startQuarter = Math.ceil(startMonth / 3);
    const endQuarter = Math.ceil(endMonth / 3);
    const quarters = [];
    for (let q = startQuarter; q <= endQuarter; q++) {
      if (TRIMESTERS[q - 1]) quarters.push(TRIMESTERS[q - 1]);
    }
    return quarters;
  }

  const quarter = Math.ceil(startMonth / 3);
  return [TRIMESTERS[quarter - 1]];
};

const isFinanceArea = (area) =>
  String(area || "").toLowerCase() === "financeiro";

export default function CreateGoalModal({
  open,
  onClose,
  onSubmit,
  onDelete,
  areaOptions = [],
  projectOptions = [],
  financeCategories = [],
  defaultArea = null,
  initialData = null,
}) {
  const [form, setForm] = useState(() => ({
    title: "",
    area: defaultArea ?? areaOptions[0] ?? "",
    type: "trimestral",
    trimester: 1,
    semester: 1,
    startDate: "",
    endDate: "",
    target: "",
    projectId: "",
    financeCategory: "",
    financeTarget: "",
  }));
  const titleRef = useRef(null);

  const calculatedTrimesters = useMemo(() => {
    return calculateTrimester(form.startDate, form.endDate);
  }, [form.startDate, form.endDate]);

  useEffect(() => {
    if (!open) return undefined;
    const currentYear = new Date().getFullYear();

    if (initialData) {
      // CORREÇÃO CRÍTICA: Converter string do trimestre para número seguro
      const safeTrimester = parseTrimesterValue(initialData.trimester);

      setForm({
        title: initialData.title || initialData.name || "",
        area: initialData.area || defaultArea || areaOptions[0] || "",
        type: initialData.type || "trimestral",
        trimester: safeTrimester,
        semester: initialData.semester || 1,
        startDate:
          initialData.startDate ||
          initialData.start_date ||
          `${currentYear}-01-01`,
        endDate:
          initialData.endDate || initialData.end_date || `${currentYear}-03-31`,
        target: initialData.target || "",
        projectId: initialData.projects?.[0]?.id || "",
        financeCategory:
          initialData.financeCategory || initialData.finance_category || "",
        financeTarget:
          initialData.financeTarget ?? initialData.finance_target ?? "",
      });
    } else {
      setForm({
        title: "",
        area: defaultArea ?? areaOptions[0] ?? "",
        type: "trimestral",
        trimester: 1,
        semester: 1,
        startDate: `${currentYear}-01-01`,
        endDate: `${currentYear}-03-31`,
        target: "",
        projectId: "",
        financeCategory: "",
        financeTarget: "",
      });
    }

    // Pequeno timeout para focar e garantir que o estado atualizou
    const focusTimer = setTimeout(() => titleRef.current?.focus(), 50);
    return () => clearTimeout(focusTimer);
  }, [open, initialData]);

  // Atualizar datas automaticamente (BLINDADO CONTRA CRASH)
  // Atualizar datas automaticamente (BLINDADO CONTRA CRASH)
  useEffect(() => {
    // Se for personalizado, ou se os dados necessários não existirem, não faz nada
    if (form.type === "custom") return;

    const currentYear = new Date().getFullYear();
    let newStartDate = "";
    let newEndDate = "";

    if (form.type === "trimestral" && form.trimester) {
      const trimesterData = TRIMESTERS[form.trimester - 1];
      if (trimesterData) {
        const months = trimesterData.months;
        // Start: 1º dia do 1º mês
        newStartDate = `${currentYear}-${String(months[0]).padStart(2, "0")}-01`;

        // End: Último dia do último mês
        const lastMonth = months[2];
        const lastDay = [4, 6, 9, 11].includes(lastMonth) ? 30 : 31;
        newEndDate = `${currentYear}-${String(lastMonth).padStart(2, "0")}-${lastDay}`;
      }
    } else if (form.type === "semestral" && form.semester) {
      const semesterData = SEMESTERS[form.semester - 1];
      if (semesterData) {
        const months = semesterData.months;
        newStartDate = `${currentYear}-${String(months[0]).padStart(2, "0")}-01`;

        const lastMonth = months[months.length - 1];
        const lastDay = lastMonth === 6 ? 30 : 31;
        newEndDate = `${currentYear}-${String(lastMonth).padStart(2, "0")}-${lastDay}`;
      }
    } else if (form.type === "anual") {
      newStartDate = `${currentYear}-01-01`;
      newEndDate = `${currentYear}-12-31`;
    }

    if (newStartDate && newEndDate) {
      setForm((prev) => {
        // Evita updates infinitos
        if (prev.startDate !== newStartDate || prev.endDate !== newEndDate) {
          return { ...prev, startDate: newStartDate, endDate: newEndDate };
        }
        return prev;
      });
    }
  }, [form.type, form.trimester, form.semester]);

  if (!open) return null;

  const updateField = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => {
      const newForm = { ...prev, [field]: value };

      if (field === "type") {
        const currentYear = new Date().getFullYear();
        if (value === "trimestral") {
          newForm.trimester = 1;
          newForm.startDate = `${currentYear}-01-01`;
        } else if (value === "semestral") {
          newForm.semester = 1;
          newForm.startDate = `${currentYear}-01-01`;
        } else if (value === "anual") {
          newForm.startDate = `${currentYear}-01-01`;
          newForm.endDate = `${currentYear}-12-31`;
        }
      }

      // Casting para número ao mudar selects
      if (field === "trimester") newForm.trimester = parseInt(value);
      if (field === "semester") newForm.semester = parseInt(value);

      return newForm;
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimesters = calculatedTrimesters || [];

    const finance = isFinanceArea(form.area);
    const payload = {
      ...form,
      trimesters: trimesters.length > 0 ? trimesters[0].label : "1º Trimestre", // Simplificação para salvar o principal
      trimesterValues: trimesters.map((t) => t.value),
      // Só persiste vínculo financeiro quando a área é Financeiro
      financeCategory: finance ? form.financeCategory || null : null,
      financeTarget:
        finance && form.financeTarget !== ""
          ? Number(form.financeTarget)
          : null,
    };
    onSubmit?.(payload);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialData ? "Editar meta" : "Nova meta"}
      subtitle={
        initialData
          ? "O progresso segue vindo dos projetos ligados."
          : "Mapeie o objetivo. Projetos e tarefas fazem ela andar."
      }
      icon={initialData ? Pencil : Target}
      width={600}
      className={`goal-form-modal ${initialData ? "is-editing" : ""}`}
      hint="Enter salva · Esc cancela"
      footer={
        <>
          {initialData && onDelete && (
            <Button
              className="goal-form-delete"
              variant="danger"
              icon={Trash2}
              onClick={onDelete}
            >
              Excluir
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="goal-form">
            {initialData ? "Salvar alterações" : "Criar meta"}
          </Button>
        </>
      }
    >
      <form id="goal-form" className="goal-form" onSubmit={handleSubmit}>
        <Input
          label="Título da meta"
          ref={titleRef}
          value={form.title}
          onChange={updateField("title")}
          required
          placeholder="O que você quer construir?"
        />
        <div className="goal-form-row">
          <Select label="Área" value={form.area} onChange={updateField("area")}>
            {areaOptions.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </Select>
          <Select
            label="Tipo de meta"
            value={form.type}
            onChange={updateField("type")}
          >
            {GOAL_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </Select>
        </div>
        {isFinanceArea(form.area) && (
          <section className="goal-form-finance">
            <p>
              <Wallet size={16} strokeWidth={1.75} />
              Meta financeira: acompanhada pelas receitas da categoria no mês.
            </p>
            <div className="goal-form-row">
              <Select
                label="Categoria vinculada"
                value={form.financeCategory}
                onChange={updateField("financeCategory")}
              >
                <option value="">Selecione…</option>
                {financeCategories
                  .filter((c) => (c.type || "").toUpperCase() !== "DESPESA")
                  .map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
              </Select>
              <Input
                label="Alvo mensal (R$)"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={form.financeTarget}
                onChange={updateField("financeTarget")}
                placeholder="Ex: 1500"
              />
            </div>
          </section>
        )}
        <div className="goal-form-row">
          {form.type === "trimestral" && (
            <Select
              label="Trimestre"
              value={form.trimester}
              onChange={updateField("trimester")}
            >
              {TRIMESTERS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          )}
          {form.type === "semestral" && (
            <Select
              label="Semestre"
              value={form.semester}
              onChange={updateField("semester")}
            >
              {SEMESTERS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          )}
          <Select
            label="Vincular a projeto"
            optional
            value={form.projectId}
            onChange={updateField("projectId")}
          >
            <option value="">Sem vínculo</option>
            {projectOptions.map((proj) => (
              <option key={proj.id} value={proj.id}>
                {proj.title}
              </option>
            ))}
          </Select>
        </div>
        {initialData?.projects?.length > 1 && (
          <Banner tone="info">
            Esta meta tem {initialData.projects.length} projetos. Se escolher um
            projeto diferente dos atuais ou “Sem vínculo”, os projetos atuais
            serão desvinculados.
          </Banner>
        )}
        <div className="goal-form-row">
          <DateInput
            label="Início"
            value={form.startDate}
            onChange={updateField("startDate")}
            disabled={form.type !== "custom"}
            hint={form.type !== "custom" ? "Calculado pelo tipo" : undefined}
          />
          <DateInput
            label="Prazo"
            value={form.endDate}
            min={form.startDate}
            onChange={updateField("endDate")}
            disabled={form.type !== "custom"}
            hint={form.type !== "custom" ? "Calculado pelo tipo" : undefined}
          />
        </div>
        <Textarea
          rows={(form.target || "").length > 75 ? 2 : 1}
          label="Resultado desejado"
          placeholder="Como você vai reconhecer essa conquista?"
          maxLength={DESCRIPTION_LIMIT}
          value={form.target}
          onChange={updateField("target")}
        />
      </form>
    </Modal>
  );
}
