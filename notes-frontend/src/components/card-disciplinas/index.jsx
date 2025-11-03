import React from "react";
import "./index.css";

// Componentes de ícones SVG
const IconMath = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2v20M2 12h20M6 6l12 12M18 6L6 18"/>
  </svg>
);

const IconBook = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);

const IconMap = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
    <line x1="8" y1="2" x2="8" y2="18"/>
    <line x1="16" y1="6" x2="16" y2="22"/>
  </svg>
);

const IconHistory = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2v10l4 4"/>
    <circle cx="12" cy="12" r="10"/>
  </svg>
);

const IconAtom = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="1"/>
    <path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5z"/>
    <path d="M15.7 15.7c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5z"/>
    <path d="M8.3 8.3c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5z"/>
  </svg>
);

const IconFlask = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10 2v10M14 2v10"/>
    <path d="M6 12h12M8 12v8a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-8"/>
  </svg>
);

const IconDna = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M2 12h20M5 12c0 4.97 2.24 9 5 9s5-4.03 5-9M5 12c0-4.97 2.24-9 5-9s5 4.03 5 9M14 12c0 4.97 2.24 9 5 9s5-4.03 5-9M14 12c0-4.97 2.24-9 5-9s5 4.03 5 9"/>
  </svg>
);

const IconLanguage = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);

const IconPen = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 20h9"/>
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
  </svg>
);

const IconCode = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="16 18 22 12 16 6"/>
    <polyline points="8 6 2 12 8 18"/>
  </svg>
);

const DEFAULT_SUBJECTS = [
  { slug: "matematica",   name: "Matemática",   icon: IconMath },
  { slug: "portugues",    name: "Português",    icon: IconBook },
  { slug: "geografia",    name: "Geografia",    icon: IconMap },
  { slug: "historia",     name: "História",     icon: IconHistory },
  { slug: "fisica",       name: "Física",       icon: IconAtom },
  { slug: "quimica",      name: "Química",      icon: IconFlask },
  { slug: "biologia",     name: "Biologia",     icon: IconDna },
  { slug: "ingles",       name: "Inglês",       icon: IconLanguage },
  { slug: "redacao",      name: "Redação",      icon: IconPen },
  { slug: "programacao",  name: "Programação",  icon: IconCode },
];

export default function CardDisciplinas({ subjects = DEFAULT_SUBJECTS, onSelect }) {
  return (
    <section className="subjects">
      <div className="subjects__container">
        <header className="subjects__header">
          <h2 className="subjects__title">Escolha uma disciplina</h2>
          <p className="subjects__subtitle">
            Encontre aulas e trilhas criadas pelos nossos professores.
          </p>
        </header>

        <ul className="subjects__grid" role="list">
          {subjects.map((s) => {
            const IconComponent = s.icon;
            return (
              <li key={s.slug} className="subjects__item">
                <button
                  type="button"
                  className="subject"
                  onClick={() => onSelect?.(s.slug)}
                  aria-label={`Abrir cursos de ${s.name}`}
                >
                  <span className="subject__icon" aria-hidden>
                    <IconComponent />
                  </span>
                  <span className="subject__name">{s.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
