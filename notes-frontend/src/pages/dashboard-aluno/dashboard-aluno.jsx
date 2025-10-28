import React, { useEffect } from "react";
import HeaderLogado from "../../components/header-logado";
import Footer from "../../components/footer";
import { requireAuth, getUser } from "../../services/authService";
import SectionTitle from "../../components/section-title";
import TopicsCarousel from "../../components/topics-carousel";
import WelcomePanel from "../../components/welcome-panel";
import ProfessoresGrid from "../../components/professores-grid";
import CTAShare from "../../components/cta-share";
import "./dashboard-aluno.css";

export default function DashboardAluno() {
  const user = getUser();

  useEffect(() => {
    requireAuth();
  }, []);

  return (
    <div className="dashboard-aluno-container">
      <HeaderLogado />

      <main className="dashboard-main">
        <div className="dashboard-content">
          {/* ===== LINHA SUPERIOR (Grid Layout) ===== */}
          <div className="row-top">
            {/* Coluna Esquerda - Tópicos */}
            <div className="topics-column">
              <SectionTitle>Tópicos em alta</SectionTitle>
              <TopicsCarousel />
            </div>

            {/* Coluna Direita - Welcome Panel */}
            <aside className="welcome">
              <WelcomePanel nome={user?.nome?.split(" ")[0]} />
            </aside>
          </div>

          {/* ===== Professores em alta ===== */}
          <section className="prof-section">
            <SectionTitle>Professores em alta</SectionTitle>
            <ProfessoresGrid />
          </section>

          {/* ===== CTA Compartilhar Conhecimento ===== */}
          <section className="cta-section">
            <SectionTitle>Compartilhe seu conhecimento</SectionTitle>
            <CTAShare />
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}