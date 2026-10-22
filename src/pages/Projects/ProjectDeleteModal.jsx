import { Trash2 } from "lucide-react";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import "./ProjectDeleteModal.css";
export default function ProjectDeleteModal({
  project,
  goal,
  mask,
  pending,
  error,
  onCancel,
  onConfirm,
  onArchive,
}) {
  return (
    <Modal
      width={440}
      className="project-delete-modal"
      title="Excluir projeto?"
      icon={Trash2}
      onClose={pending ? undefined : onCancel}
      footer={
        <>
          {onArchive && (
            <Button variant="ghost" onClick={onArchive} disabled={pending}>
              Arquivar em vez disso
            </Button>
          )}
          <Button
            variant="danger"
            icon={Trash2}
            onClick={onConfirm}
            loading={pending}
          >
            Excluir projeto
          </Button>
        </>
      }
    >
      <p className="project-delete-message">
        Esta ação não pode ser desfeita.
        {goal ? ` A meta “${mask(goal.title)}” deixa de contar com ele.` : ""}
        {onArchive ? " Se quiser só tirar da frente, arquive." : ""}
      </p>
      {error && (
        <p role="alert" className="project-delete-error">
          {error}
        </p>
      )}
      <p className="project-delete-name">{mask(project.title)}</p>
    </Modal>
  );
}
