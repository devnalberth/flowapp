import { CircleCheck } from "lucide-react";
import HeroCard from "./HeroCard.jsx";
import ProgressRing from "./ProgressRing.jsx";
import "./HeroCelebration.css";

export default function HeroCelebration({
  badge,
  summary,
  title,
  description,
  children,
  actions,
  className = "",
}) {
  return (
    <HeroCard className={`fa-celebration ${className}`}>
      {summary || (
        <div className="fa-celebration__top">
          <div>
            <span className="fa-celebration__badge">
              <CircleCheck size={14} strokeWidth={1.75} aria-hidden="true" />
              {badge}
            </span>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
          <ProgressRing value={100} size="lg" label="Concluído" />
        </div>
      )}
      {children}
      {actions && <div className="fa-celebration__actions">{actions}</div>}
    </HeroCard>
  );
}
