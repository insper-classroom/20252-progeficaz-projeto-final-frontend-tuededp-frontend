import React from "react";
import { useNavigate } from "react-router-dom";
import HeaderDeslogado from "../../../components/header-deslogado";
import Footer from "../../../components/footer";
import "./index.css";

// Ícones SVG
const IconAluno = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const IconProfessor = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

export default function CadastroEscolha() {
  const navigate = useNavigate();

  return (
    <div className="page-auth">
      <HeaderDeslogado />

      <main className="choice-main">
        <section className="choice-section" aria-labelledby="title-cadastro">
          <header className="choice-header">
            <h1 id="title-cadastro" className="choice-title">Criar conta</h1>
            <p className="choice-subtitle">Escolha o tipo de conta que deseja criar.</p>
          </header>

          <div className="choice-grid" role="list">
            <button
              className="choice-card"
              onClick={() => navigate("/cadastro-aluno")}
              aria-label="Cadastrar como aluno"
              type="button"
            >
              <span className="choice-icon" aria-hidden>
                <IconAluno />
              </span>
              <span className="choice-name">Aluno</span>
            </button>

            <button
              className="choice-card"
              onClick={() => navigate("/cadastro-professor")}
              aria-label="Cadastrar como professor"
              type="button"
            >
              <span className="choice-icon" aria-hidden>
                <IconProfessor />
              </span>
              <span className="choice-name">Professor</span>
            </button>
          </div>

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
      </main>

      <Footer />
    </div>
  );
}
