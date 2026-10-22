import { useEffect, useRef, useState } from "react";
import { User } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { Input, Textarea } from "../ui/Field";
import "./ClientModal.css";

const DEFAULT_FORM = {
  name: "",
  company: "",
  email: "",
  phone: "",
  notes: "",
};

export default function ClientModal({
  open,
  onClose,
  onSubmit,
  initialData = null,
}) {
  const [form, setForm] = useState(() => ({ ...DEFAULT_FORM }));
  const [saving, setSaving] = useState(false);
  const nameRef = useRef(null);

  useEffect(() => {
    if (open) requestAnimationFrame(() => nameRef.current?.focus());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setForm(
      initialData ? { ...DEFAULT_FORM, ...initialData } : { ...DEFAULT_FORM },
    );
  }, [open, initialData]);

  if (!open) return null;

  const update = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || saving) return;
    try {
      setSaving(true);
      await onSubmit?.(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      width={520}
      className="clientModal"
      title={initialData ? "Editar cliente" : "Novo cliente"}
      subtitle="Fica salvo para os próximos projetos."
      icon={User}
      hint="Enter salva · Esc cancela"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="client-form"
            disabled={saving || !form.name.trim()}
          >
            {saving ? "Salvando..." : "Salvar cliente"}
          </Button>
        </>
      }
    >
      <form id="client-form" className="client-form" onSubmit={handleSubmit}>
        <Input
          label="Nome do cliente"
          ref={nameRef}
          name="name"
          placeholder="Nome do cliente"
          value={form.name}
          onChange={update("name")}
          required
        />
        <Input
          label="Empresa · opcional"
          name="company"
          placeholder="Empresa"
          value={form.company}
          onChange={update("company")}
        />
        <div className="client-form-row">
          <Input
            label="E-mail"
            type="email"
            name="email"
            placeholder="email@cliente.com"
            value={form.email}
            onChange={update("email")}
          />
          <Input
            label="Telefone"
            name="phone"
            placeholder="(00) 00000-0000"
            value={form.phone}
            onChange={update("phone")}
          />
        </div>
        <Textarea
          label="Notas · opcional"
          name="notes"
          placeholder="Observações sobre o cliente..."
          value={form.notes}
          onChange={update("notes")}
        />
      </form>
    </Modal>
  );
}
