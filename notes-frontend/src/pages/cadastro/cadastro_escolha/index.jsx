import React from "react";
import { useNavigate } from "react-router-dom";
import HeaderDeslogado from "../../../components/header-deslogado";
import Footer from "../../../components/footer";
import "./index.css";


export default function CadastroEscolha() {
  const navigate = useNavigate();

  return (
    <div className="page-auth">
      <HeaderDeslogado />

      <main className="choice-main">
        <section className="choice-card" aria-labelledby="title-cadastro">
          <div className="choice-head">
            <h1 id="title-cadastro">Criar conta</h1>
            <p>Escolha o tipo de conta que deseja criar.</p>
          </div>

          <div className="choice-grid" role="list">
            <button
              className="choice-option"
              onClick={() => navigate("/cadastro-aluno")}
              aria-label="Cadastrar como aluno"
              type="button"
            >
              <div className="choice-badge" style={{ background: "#3b82f6" }}>A</div>
              <div>
                <p className="choice-title">Aluno</p>
                <p className="choice-desc">Acesso a cursos, trilhas e avaliações.</p>
              </div>
            </button>

            <button
              className="choice-option"
              onClick={() => navigate("/cadastro-professor")}
              aria-label="Cadastrar como professor"
              type="button"
            >
              <div className="choice-badge" style={{ background: "#0A66C2" }}>P</div>
              <div>
                <p className="choice-title">Professor</p>
                <p className="choice-desc">Crie e gerencie cursos e aulas.</p>
              </div>
            </button>
          </div>

          {/* Meta: 'Já tem conta? Entrar' — Entrar é link simples com underline no hover */}
          <div className="choice-meta">
            Já tem conta?{" "}
            <a
              className="meta-link"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate("/login");
              }}
            >
              Entrar
            </a>
          </div>
        </section>

        {/* opção visual escondida por padrão (mantive estrutura) */}
        <aside className="choice-figure" aria-hidden="true">
          <div className="figure-card">
            <h3>Aprenda e ensine no seu ritmo</h3>
            <p>Trilhas, aulas curtas, certificados, professores verificados e oportunidades para ensinar.</p>
          </div>
        </aside>
      </main>

      <Footer />
    </div>
  );
}
