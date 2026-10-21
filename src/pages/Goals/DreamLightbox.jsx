import { useState } from "react";
import { Flag } from "lucide-react";
import Modal from "../../components/ui/Modal";
import "./DreamLightbox.css";

export default function DreamLightbox({
  dream,
  goal,
  onClose,
  mask = (value) => value,
}) {
  const [ratio, setRatio] = useState(880 / 620);
  const title = mask(dream.title || "Imagem do mapa dos sonhos");
  return (
    <Modal
      title={title}
      onClose={onClose}
      width="100vw"
      className="goal-dream-lightbox"
    >
      <button
        type="button"
        className="goal-dream-lightbox-dismiss"
        aria-label="Fechar visualização da imagem"
        onClick={onClose}
      />
      <figure className="goal-dream-lightbox-figure">
        <div style={{ "--dream-image-ratio": ratio }}>
          <img
            src={dream.imageUrl || dream.image_url}
            alt={title}
            onLoad={(event) => {
              const img = event.currentTarget;
              if (img.naturalHeight)
                setRatio(img.naturalWidth / img.naturalHeight);
            }}
          />
        </div>
        <figcaption>
          <strong>{title}</strong>
          <span>
            {goal && <Flag size={13} strokeWidth={1.75} />}{" "}
            {goal
              ? `${mask(goal.title)} · ${goal.progressPercent || 0}%`
              : "Sem meta"}
          </span>
        </figcaption>
      </figure>
      <span className="goal-dream-lightbox-hint">Esc fecha</span>
    </Modal>
  );
}
