import React, { useState, useEffect, useRef } from "react";
import { logout } from "../../services/authService";
import logo from "../../assets/logo_estudai.jpg";
import { useNavigate } from "react-router-dom";
import { buscarUsuarios } from "../../services/apiService";
import "./index.css";

const HeaderLogado = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);
  const suggestionsRef = useRef(null);
  const navigate = useNavigate();

  const handleLogoClick = () => navigate("/");
  const handleDashboard = () => navigate("/dashboard-aluno");
  const handleProfile = () => navigate("/perfil");
  const handleLogout = () => logout();

  // Buscar usuários quando o usuário digita
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        const resultado = await buscarUsuarios(searchQuery, 8);
        if (resultado.success) {
          setSearchResults(resultado.data || []);
          setShowSuggestions(true);
        }
        setIsSearching(false);
      } else {
        setSearchResults([]);
        setShowSuggestions(false);
      }
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Fechar sugestões ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleUserSelect = (usuario) => {
    setSearchQuery("");
    setShowSuggestions(false);
    navigate(usuario.url);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchResults.length > 0) {
      handleUserSelect(searchResults[0]);
    }
  };

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
        <div className="search-wrap" ref={searchRef}>
          <form onSubmit={handleSearchSubmit}>
            <input
              className="search-input"
              placeholder="Procure por qualquer coisa..."
              aria-label="Buscar"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => {
                if (searchResults.length > 0) {
                  setShowSuggestions(true);
                }
              }}
            />
          </form>
          <button className="search-icon" aria-label="Buscar" type="submit" onClick={handleSearchSubmit}>
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>

          {/* Dropdown de sugestões */}
          {showSuggestions && (searchResults.length > 0 || isSearching) && (
            <div className="search-suggestions" ref={suggestionsRef}>
              {isSearching ? (
                <div className="suggestion-item loading">Buscando...</div>
              ) : searchResults.length === 0 ? (
                <div className="suggestion-item no-results">Nenhum resultado encontrado</div>
              ) : (
                searchResults.map((usuario) => (
                  <div
                    key={`${usuario.tipo}-${usuario._id || usuario.id}`}
                    className="suggestion-item"
                    onClick={() => handleUserSelect(usuario)}
                  >
                    <div className="suggestion-avatar">
                      {usuario.nome ? usuario.nome.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="suggestion-info">
                      <div className="suggestion-name">{usuario.nome}</div>
                      <div className="suggestion-meta">
                        <span className={`suggestion-badge ${usuario.tipo}`}>
                          {usuario.tipo === 'professor' ? '👨‍🏫 Professor' : '👤 Aluno'}
                        </span>
                        {usuario.email && <span className="suggestion-email">{usuario.email}</span>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
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
