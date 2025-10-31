import React from "react";
import { useNavigate } from "react-router-dom";
import { isLoggedIn } from '../../services/authService';
import HeaderDeslogado from "../../components/header-deslogado";
import HeaderLogado from "../../components/header-logado";
import Footer from "../../components/footer";
import "./junte-se-nos.css";

export default function JunteSeNos() {
  const navigate = useNavigate();
  const isAuthenticated = isLoggedIn();

  const handleCadastroAluno = () => {
    navigate('/cadastro-aluno');
  };

  const handleCadastroProfessor = () => {
    navigate('/cadastro-professor');
  };

  return (
    <div className="junte-se-nos">
      {isAuthenticated ? <HeaderLogado /> : <HeaderDeslogado />}

      {/* ===== HERO SECTION ===== */}
      <section className="js-hero">
        <div className="js-hero__container">
          <div className="js-hero__content">
            <h1 className="js-hero__title">
              Junte-se a nós e transforme a educação
            </h1>
            <p className="js-hero__subtitle">
              Conectamos alunos que buscam conhecimento com professores apaixonados por ensinar. 
              Faça parte de uma comunidade que valoriza o aprendizado contínuo e o crescimento mútuo.
            </p>
          </div>
        </div>
      </section>

      {/* ===== OBJETIVO DO SITE ===== */}
      <section className="js-objectivo">
        <div className="js-objectivo__container">
          <h2 className="js-section-title">Nosso Objetivo</h2>
          <p className="js-objectivo__text">
            O ESTUDAÍ nasceu da necessidade de tornar a educação mais acessível e personalizada. 
            Acreditamos que todos têm o direito de aprender com os melhores professores, no seu próprio 
            ritmo e de forma descomplicada. Nossa missão é criar uma ponte entre quem quer ensinar 
            e quem quer aprender, oferecendo uma plataforma moderna, segura e eficiente.
          </p>
        </div>
      </section>

      {/* ===== BENEFÍCIOS PARA ALUNOS ===== */}
      <section className="js-beneficios">
        <div className="js-beneficios__container">
          <div className="js-beneficios__header">
            <div className="js-beneficios__icon js-beneficios__icon--aluno">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <h2 className="js-beneficios__title">Para Alunos</h2>
            <p className="js-beneficios__subtitle">
              Descubra como o ESTUDAÍ pode acelerar seu aprendizado
            </p>
          </div>

          <div className="js-beneficios__grid">
            <div className="js-beneficio-card">
              <div className="js-beneficio-card__icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
              </div>
              <h3 className="js-beneficio-card__title">Aulas Personalizadas</h3>
              <p className="js-beneficio-card__text">
                Conecte-se com professores especializados que se adaptam ao seu ritmo e estilo de aprendizado.
              </p>
            </div>

            <div className="js-beneficio-card">
              <div className="js-beneficio-card__icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <h3 className="js-beneficio-card__title">Flexibilidade Total</h3>
              <p className="js-beneficio-card__text">
                Agende suas aulas no horário que for melhor para você, com total flexibilidade de agenda.
              </p>
            </div>

            <div className="js-beneficio-card">
              <div className="js-beneficio-card__icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <h3 className="js-beneficio-card__title">Preços Acessíveis</h3>
              <p className="js-beneficio-card__text">
                Encontre aulas de qualidade com preços justos que cabem no seu orçamento.
              </p>
            </div>

            <div className="js-beneficio-card">
              <div className="js-beneficio-card__icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
              </div>
              <h3 className="js-beneficio-card__title">Professores Verificados</h3>
              <p className="js-beneficio-card__text">
                Acesse um time de professores qualificados e verificados pela nossa plataforma.
              </p>
            </div>

            <div className="js-beneficio-card">
              <div className="js-beneficio-card__icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="8.5" cy="7" r="4"></circle>
                  <path d="M20 8v6M23 11h-6"></path>
                </svg>
              </div>
              <h3 className="js-beneficio-card__title">Comunidade Ativa</h3>
              <p className="js-beneficio-card__text">
                Faça parte de uma comunidade engajada de estudantes e compartilhe conhecimento.
              </p>
            </div>

            <div className="js-beneficio-card">
              <div className="js-beneficio-card__icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
              <h3 className="js-beneficio-card__title">Avaliações e Feedback</h3>
              <p className="js-beneficio-card__text">
                Veja avaliações reais de outros alunos antes de escolher seu professor ideal.
              </p>
            </div>
          </div>

          <div className="js-cta-section">
            <button className="js-cta-button js-cta-button--primary" onClick={handleCadastroAluno}>
              Criar conta como Aluno
            </button>
          </div>
        </div>
      </section>

      {/* ===== BENEFÍCIOS PARA PROFESSORES ===== */}
      <section className="js-beneficios js-beneficios--professor">
        <div className="js-beneficios__container">
          <div className="js-beneficios__header">
            <div className="js-beneficios__icon js-beneficios__icon--professor">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                <path d="M22 22v-4a4 4 0 0 0-4-4"></path>
                <path d="M18 18v4"></path>
              </svg>
            </div>
            <h2 className="js-beneficios__title">Para Professores</h2>
            <p className="js-beneficios__subtitle">
              Moneteize seu conhecimento e alcance mais alunos
            </p>
          </div>

          <div className="js-beneficios__grid">
            <div className="js-beneficio-card">
              <div className="js-beneficio-card__icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
              <h3 className="js-beneficio-card__title">Ganhe Renda Extra</h3>
              <p className="js-beneficio-card__text">
                Transforme seu conhecimento em fonte de renda fazendo o que você ama: ensinar.
              </p>
            </div>

            <div className="js-beneficio-card">
              <div className="js-beneficio-card__icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <h3 className="js-beneficio-card__title">Agenda Flexível</h3>
              <p className="js-beneficio-card__text">
                Defina seus próprios horários e tenha controle total sobre sua disponibilidade.
              </p>
            </div>

            <div className="js-beneficio-card">
              <div className="js-beneficio-card__icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="8.5" cy="7" r="4"></circle>
                  <path d="M20 8v6M23 11h-6"></path>
                </svg>
              </div>
              <h3 className="js-beneficio-card__title">Alcance Mais Alunos</h3>
              <p className="js-beneficio-card__text">
                Conecte-se com estudantes de todo o país através da nossa plataforma digital.
              </p>
            </div>

            <div className="js-beneficio-card">
              <div className="js-beneficio-card__icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 9V5a3 3 0 0 0-6 0v4"></path>
                  <rect x="2" y="9" width="20" height="12" rx="2" ry="2"></rect>
                  <circle cx="12" cy="15" r="1"></circle>
                </svg>
              </div>
              <h3 className="js-beneficio-card__title">Plataforma Segura</h3>
              <p className="js-beneficio-card__text">
                Trabalhe com segurança e confiança em uma plataforma confiável e bem estabelecida.
              </p>
            </div>

            <div className="js-beneficio-card">
              <div className="js-beneficio-card__icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
              </div>
              <h3 className="js-beneficio-card__title">Construa sua Reputação</h3>
              <p className="js-beneficio-card__text">
                Receba avaliações dos alunos e construa uma reputação sólida na plataforma.
              </p>
            </div>

            <div className="js-beneficio-card">
              <div className="js-beneficio-card__icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <h3 className="js-beneficio-card__title">Gestão Simplificada</h3>
              <p className="js-beneficio-card__text">
                Utilize ferramentas intuitivas para gerenciar suas aulas, alunos e agenda em um só lugar.
              </p>
            </div>
          </div>

          <div className="js-cta-section">
            <button className="js-cta-button js-cta-button--secondary" onClick={handleCadastroProfessor}>
              Criar conta como Professor
            </button>
          </div>
        </div>
      </section>

      {/* ===== CTA FINAL ===== */}
      <section className="js-cta-final">
        <div className="js-cta-final__container">
          <h2 className="js-cta-final__title">Pronto para começar?</h2>
          <p className="js-cta-final__text">
            Junte-se a milhares de alunos e professores que já transformaram sua relação com a educação.
          </p>
          <div className="js-cta-final__buttons">
            <button className="js-cta-button js-cta-button--primary" onClick={handleCadastroAluno}>
              Sou Aluno
            </button>
            <button className="js-cta-button js-cta-button--outline" onClick={handleCadastroProfessor}>
              Sou Professor
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

