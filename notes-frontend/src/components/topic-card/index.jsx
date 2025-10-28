// topic-card/index.jsx
import "./index.css";

export default function TopicCard() {
  return (
    <article className="topic-card">
      <header>
        <div className="avatar">A</div>
        <div className="meta">
          <strong>Header</strong>
          <small>Subhead</small>
        </div>
      </header>
      
      {/* ÁREA DE MEDIA SEM FOTO - apenas ícones placeholder */}
      <div className="media">
        <div className="media-placeholder">
          <svg className="media-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v6m0 6v6" />
            <path d="M21 12h-6m-6 0H3" />
          </svg>
          <svg className="media-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
          </svg>
        </div>
      </div>

      <div className="body">
        <h4>Title</h4>
        <small>Subtitle</small>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor</p>
        <div className="actions">
          <button className="btn secondary">Secondary</button>
          <button className="btn primary">Primary</button>
        </div>
      </div>
    </article>
  );
}