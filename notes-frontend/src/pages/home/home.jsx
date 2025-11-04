import React from "react";
import { useNavigate } from "react-router-dom";
import { isLoggedIn, getUser, getTipo } from '../../services/authService';
import { buscarEstatisticas } from '../../services/apiService';
import HeaderDeslogado from "../../components/header-deslogado";
import HeaderLogado from "../../components/header-logado";
import Footer from "../../components/footer";
import HomeProfessor from "../home-professor/home-professor";
import ProfessoresDestaque from "../../components/professores-destaque";
import "./home.css";
import CardDisciplinas from "../../components/card-disciplinas";
import heroImg from "../../assets/garota_home.png"; 

export default function Home() {
  const navigate = useNavigate()
  const [stats, setStats] = React.useState({
    totalAlunos: 0,
    totalProfessores: 0,
    totalAulas: 0
  });

  React.useEffect(() => {
    carregarEstatisticas();
  }, []);

  const carregarEstatisticas = async () => {
    const resultado = await buscarEstatisticas();
    console.log('[Home] Resultado das estatísticas:', resultado);
    if (!resultado.error) {
      setStats(resultado);
    } else {
      console.error('[Home] Erro ao carregar estatísticas:', resultado.error);
    }
  };

  const isAuthenticated = isLoggedIn();

  // Verificar se é professor
  const user = getUser();
  const tipo = getTipo() || user?.tipo || "";
  const isProfessor = tipo.toLowerCase() === "professor" || tipo.toLowerCase() === "prof";

  // Se for professor logado, mostrar home de professor
  if (isAuthenticated && isProfessor) {
    return <HomeProfessor />;
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

      {/* ANCORAGEM: elemento topo para o footer rolar até aqui */}
      <div id="top" />

      {/* ===== HERO ===== */}
      <section className="ll-hero">
        <div className="ll-hero__container">
          <div className="ll-hero__copy">
            <h1 className="ll-hero__title">Desenvolva habilidades que impulsionem sua carreira.</h1>
            <p className="ll-hero__subtitle">
              Aprenda com especialistas, em aulas curtas e práticas. Certificados, trilhas e professores verificados para você evoluir no seu ritmo.
            </p>
            <div className="ll-hero__ctas">
              <a className="btn btn--primary" href="#comecar" onClick={(e) => { e.preventDefault(); navigate('/cadastro-escolha'); }}>Começar agora</a>
              <a className="btn btn--outline" href="#professores" onClick={(e) => { e.preventDefault(); document.getElementById('professores')?.scrollIntoView({ behavior: 'smooth' }); }}>Ver professores</a>
            </div>
            
            <div className="ll-hero__stats">
              <div className="ll-hero__stat">
                <div className="ll-hero__stat-number">+{stats.totalAlunos}</div>
                <div className="ll-hero__stat-label">Alunos ativos</div>
              </div>
              <div className="ll-hero__stat">
                <div className="ll-hero__stat-number">+{stats.totalProfessores}</div>
                <div className="ll-hero__stat-label">Professores</div>
              </div>
              <div className="ll-hero__stat">
                <div className="ll-hero__stat-number">+{stats.totalAulas}</div>
                <div className="ll-hero__stat-label">Aulas disponíveis</div>
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

      {/* ===== OBJETIVO/MISSÃO ===== */}
      <section className="home-objectivo" id="sobre">
        <div className="home-objectivo__container">
          <h2 className="home-objectivo__title">Nosso Objetivo</h2>
          <p className="home-objectivo__text">
            O ESTUDAÍ nasceu da necessidade de tornar a educação mais acessível e personalizada. 
            Acreditamos que todos têm o direito de aprender com os melhores professores, no seu próprio 
            ritmo e de forma descomplicada. Nossa missão é criar uma ponte entre quem quer ensinar 
            e quem quer aprender, oferecendo uma plataforma moderna, segura e eficiente.
          </p>
        </div>
      </section>

      {/* ===== PROFESSORES EM ALTA ===== */}
      <ProfessoresDestaque />

      {/* ===== BENEFÍCIOS ===== */}
      <section className="home-beneficios" id="beneficios">
        <div className="home-beneficios__container">
          <h2 className="home-beneficios__title">Tudo que você precisa para aprender</h2>
          
          <div className="home-beneficios__grid">
            <div className="home-beneficio-item">
              <div className="home-beneficio-item__number">01</div>
              <h3 className="home-beneficio-item__title">Aulas Personalizadas</h3>
              <p className="home-beneficio-item__text">
                Professores especializados adaptados ao seu ritmo de aprendizado.
              </p>
            </div>

            <div className="home-beneficio-item">
              <div className="home-beneficio-item__number">02</div>
              <h3 className="home-beneficio-item__title">Flexibilidade Total</h3>
              <p className="home-beneficio-item__text">
                Agende aulas no horário ideal para você, com agenda flexível.
              </p>
            </div>

            <div className="home-beneficio-item">
              <div className="home-beneficio-item__number">03</div>
              <h3 className="home-beneficio-item__title">Preços Acessíveis</h3>
              <p className="home-beneficio-item__text">
                Aulas de qualidade com preços justos que cabem no seu orçamento.
              </p>
            </div>

            <div className="home-beneficio-item">
              <div className="home-beneficio-item__number">04</div>
              <h3 className="home-beneficio-item__title">Professores Verificados</h3>
              <p className="home-beneficio-item__text">
                Time de professores qualificados e verificados pela plataforma.
              </p>
            </div>

            <div className="home-beneficio-item">
              <div className="home-beneficio-item__number">05</div>
              <h3 className="home-beneficio-item__title">Comunidade Ativa</h3>
              <p className="home-beneficio-item__text">
                Participe de uma comunidade engajada de estudantes.
              </p>
            </div>

            <div className="home-beneficio-item">
              <div className="home-beneficio-item__number">06</div>
              <h3 className="home-beneficio-item__title">Avaliações Reais</h3>
              <p className="home-beneficio-item__text">
                Veja feedback de outros alunos antes de escolher seu professor.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== DISCIPLINAS ===== */}
      <CardDisciplinas onSelect={handleDisciplina} />

      {/* ===== CTA FINAL ===== */}
      <section className="home-cta" id="comecar">
        <div className="home-cta__container">
          <h2 className="home-cta__title">Pronto para começar?</h2>
          <p className="home-cta__text">
            Junte-se a milhares de alunos e professores que já transformaram sua relação com a educação.
          </p>
          <div className="home-cta__buttons">
            <button 
              className="btn btn--primary home-cta__button"
              onClick={() => navigate('/cadastro-escolha')}
            >
              Criar conta gratuita
            </button>
            <button 
              className="btn btn--outline home-cta__button"
              onClick={() => navigate('/junte-se-nos')}
            >
              Saiba mais
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
