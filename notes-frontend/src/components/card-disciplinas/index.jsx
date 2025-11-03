import React from "react";
import "./index.css";

const DEFAULT_SUBJECTS = [
  { slug: "matematica",   name: "Matemática",   icon: "🧮" },
  { slug: "portugues",    name: "Português",    icon: "📚" },
  { slug: "geografia",    name: "Geografia",    icon: "🗺️" },
  { slug: "historia",     name: "História",     icon: "🏛️" },
  { slug: "fisica",       name: "Física",       icon: "🧲" },
  { slug: "quimica",      name: "Química",      icon: "⚗️" },
  { slug: "biologia",     name: "Biologia",     icon: "🧬" },
  { slug: "ingles",       name: "Inglês",       icon: "🗣️" },
  { slug: "redacao",      name: "Redação",      icon: "✍️" },
  { slug: "programacao",  name: "Programação",  icon: "💻" },
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
          {subjects.map((s) => (
            <li key={s.slug} className="subjects__item">
              <button
                type="button"
                className="subject"
                onClick={() => onSelect?.(s.slug)}
                aria-label={`Abrir cursos de ${s.name}`}
              >
                <span className="subject__icon" aria-hidden>
                  {s.icon}
                </span>
                <span className="subject__name">{s.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
