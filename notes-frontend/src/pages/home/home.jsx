import React from "react";
import { useNavigate } from "react-router-dom";
import { isLoggedIn, getUser, getTipo } from '../../services/authService';
import HeaderDeslogado from "../../components/header-deslogado";
import HeaderLogado from "../../components/header-logado";
import Footer from "../../components/footer";
import HomeProfessor from "../home-professor/home-professor";
import "./home.css";
import CardDisciplinas from "../../components/card-disciplinas";
import heroImg from "../../assets/garota_home.png"; 
import { useNavigate } from "react-router-dom"

export default function Home() {
  const [q, setQ] = React.useState("");
  const navigate = useNavigate();

  const isAuthenticated = isLoggedIn();
  
  // Verificar se é professor
  const user = getUser();
  const tipo = getTipo() || user?.tipo || "";
  const isProfessor = tipo.toLowerCase() === "professor" || tipo.toLowerCase() === "prof";

  // Se for professor logado, mostrar home de professor
  if (isAuthenticated && isProfessor) {
    return <HomeProfessor />;
  }

  function handleSearch(e) {
    e.preventDefault();
  }

  function handleDisciplina(slug) {
    const areaMap = {
      'matematica': 'Matemática',
      'portugues': 'Português',
      'geografia': 'Geografia',
      'historia': 'História',
      'fisica': 'Física',
      'quimica': 'Química',
      'biologia': 'Biologia',
      'ingles': 'Inglês',
      'redacao': 'Redação',
      'programacao': 'Programação'
    };

    const areaNome = areaMap[slug] || slug;
    navigate(`/professores?area=${encodeURIComponent(areaNome)}`);
  }
  return (
    <div className="home">
      {isAuthenticated ? <HeaderLogado /> : <HeaderDeslogado />}

      {/* ===== HERO ===== */}
      {/* ...resto igual */}
      <section className="ll-hero">
        <div className="ll-hero__container">
          <div className="ll-hero__copy">
            <h1 className="ll-hero__title">Desenvolva habilidades que impulsionem sua carreira.</h1>
            <p className="ll-hero__subtitle">
              Aprenda com especialistas, em aulas curtas e práticas. Certificados, trilhas e professores verificados para você evoluir no seu ritmo.
            </p>
            <div className="ll-hero__ctas">
              <a className="btn btn--primary" href="#comecar">Começar agora</a>
              <a className="btn btn--outline" href="#cursos">Explorar cursos</a>
            </div>
            <form className="ll-search" onSubmit={handleSearch} role="search" aria-label="Buscar cursos">
              <svg aria-hidden viewBox="0 0 24 24" className="ll-search__icon">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
              <input
                className="ll-search__input"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="O que você quer aprender?"
                aria-label="Buscar cursos"
              />
              <button className="btn btn--ghost" type="submit">Buscar</button>
            </form>
            <ul className="ll-benefits" aria-label="Principais benefícios">
              <li><span className="dot" /> Instrutores verificados</li>
              <li><span className="dot" /> Certificados de conclusão</li>
              <li><span className="dot" /> Aulas curtas e práticas</li>
            </ul>
            <div className="ll-trusted">
              <span className="ll-trusted__label">Confiado por</span>
              <div className="ll-trusted__logos" aria-hidden>
                <span className="pill">globo</span>
                <span className="pill">Unalower</span>
                <span className="pill">PayPal</span>
                <span className="pill">Idiomas</span>
              </div>
            </div>
          </div>

          <div className="ll-hero__figure">
            <div className="ll-hero__frame">
              <img src={heroImg} alt="Estudante em ambiente iluminado estudando no notebook" className="ll-hero__img" />
            </div>
          </div>
        </div>
      </section>

      <CardDisciplinas onSelect={handleDisciplina} />
      <Footer />
    </div>
  );
}
