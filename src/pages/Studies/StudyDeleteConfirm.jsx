import { Trash2 } from "lucide-react";
import ConfirmModal from "../../components/ui/ConfirmModal";
import Toast from "../../components/ui/Toast";
import { studyOverview } from "../../utils/studyMetrics";
import "./StudyDeleteConfirm.css";

export default function StudyDeleteConfirm({
  study,
  pending,
  error,
  onCancel,
  onConfirm,
  onDismissError,
}) {
  const ov = studyOverview(study);
  const contents = ov.modulesCount
    ? `${ov.modulesCount === 1 ? "O" : "Os"} ${ov.modulesCount} módulo${ov.modulesCount === 1 ? "" : "s"}${ov.lessonUnits ? ` e ${ov.lessonUnits === 1 ? "a" : "as"} ${ov.lessonUnits} aula${ov.lessonUnits === 1 ? "" : "s"}` : ""}, com resumos, notas e links, ${ov.modulesCount === 1 && !ov.lessonUnits ? "será apagado" : "serão apagados"}. Não dá para desfazer.`
    : "Este estudo será apagado. Não dá para desfazer.";
  return (
    <ConfirmModal
      className="study-delete-confirm"
      width={440}
      title="Excluir estudo?"
      icon={Trash2}
      confirmIcon={Trash2}
      message={contents}
      danger
      confirmLabel="Excluir estudo"
      onConfirm={onConfirm}
      onCancel={onCancel}
      pending={pending}
    >
      <p className="study-delete-name">{study.title}</p>
      {error && (
        <Toast
          tone="danger"
          title="Não foi possível excluir o estudo"
          detail="Tente novamente."
          onClose={onDismissError}
        />
      )}
    </ConfirmModal>
  );
}
