export default function ProjectsSkeleton() {
  return (
    <div className="project-gallery-skeleton" role="status" aria-live="polite">
      <span className="fa-sr-only">Carregando projetos…</span>
      <div aria-hidden="true">
        <div className="project-skeleton-heading" />
        <div className="project-skeleton-overview">
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className="project-skeleton-deadlines" />
        <div className="project-skeleton-filters" />
        <div className="project-skeleton-grid">
          <i />
          <i />
          <i />
        </div>
      </div>
    </div>
  );
}
