import React, { useState } from "react";
import { logout } from "../../services/authService";
import logo from "../../assets/logo_estudai.jpg";
import { useNavigate } from "react-router-dom";
import "./index.css";

const HeaderLogado = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogoClick = () => navigate("/");
  const handleDashboard = () => navigate("/dashboard-aluno");
  const handleProfile = () => navigate("/perfil-aluno");
  const handleLogout = () => logout();

  return (
    <header className="header-logado">
      <div className="header-content">

        {/* Esquerda: logo */}
        <div className="logo-section">
          <button className="logo" onClick={handleLogoClick} aria-label="Início">
            <span className="logo-icon">
              <img src={logo} alt="ESTUDAÍ" />
            </span>
            <span className="logo-text">E S T U D A Í</span>
          </button>
        </div>

        {/* Centro: barra de busca */}
        <div className="search-wrap">
          <input
            className="search-input"
            placeholder="Procure por qualquer coisa..."
            aria-label="Buscar"
          />
          <button className="search-icon" aria-label="Buscar">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </div>

        {/* Direita: link curto + ícones */}
        <div className="header-right">
          <button className="icon-button" aria-label="Mensagens" onClick={() => navigate("/chats")}>
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" fill="none" strokeWidth="2">
              <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/>
            </svg>
          </button>

          <button className="icon-button" aria-label="Favoritos" onClick={() => navigate("/favoritos")}>
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" fill="none" strokeWidth="2">
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 22l7.8-8.6 1-1a5.5 5.5 0 0 0 0-7.8z"/>
            </svg>
          </button>

          {/* Carrinho e notificações removidos por solicitação do produto */}

          {/* Ícone de usuário abre o dropdown existente */}
          <button
            className="icon-button profile-btn"
            aria-label="Perfil"
            onClick={() => setIsMenuOpen((v) => !v)}
          >
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" fill="none" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </button>
        </div>

        {/* Dropdown (mesmo conteúdo que você já tinha) */}
        {isMenuOpen && (
          <div className="dropdown-menu">
            <div className="dropdown-content">
              <button onClick={handleDashboard} className="dropdown-item">Dashboard</button>
              <button onClick={handleProfile} className="dropdown-item">Meus Dados</button>
              <hr className="dropdown-divider" />
              <button onClick={handleLogout} className="dropdown-item logout">Sair</button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default HeaderLogado;
