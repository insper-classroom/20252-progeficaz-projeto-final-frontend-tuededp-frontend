import React, { useState, useEffect, useRef } from "react";
import { logout } from "../../services/authService";
import logo from "../../assets/logo_estudai.jpg";
import { useNavigate } from "react-router-dom";
import { buscarUsuarios } from "../../services/apiService";
import "./index.css";

/* -------- Avatar com fallback -------- */
function Avatar({ src, name, className = "" }) {
  const [broken, setBroken] = React.useState(false);
  const letter = (name || "?").trim().charAt(0).toUpperCase();

  if (src && !broken) {
    return (
      <img
        className={`avatar-img ${className}`}
        src={src}
        alt={name || "Avatar"}
        onError={() => setBroken(true)}
      />
    );
  }
  return (
    <span className={`avatar ${className}`} aria-hidden>
      {letter}
    </span>
  );
}

/* -------- Helpers de normalização -------- */
function normId(v) {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (v.$oid) return v.$oid;
  if (v._id?.$oid) return v._id.$oid;
  if (v._id) return String(v._id);
  return String(v);
}
function normalizeUserResult(u = {}) {
  const id = normId(u.id ?? u._id);
  const nome = u.nome || u.name || u.fullname || "Usuário";
  const email = u.email || "";
  const avatarUrl = u.avatarUrl || u.avatar_url || "";
  // padroniza tipo para "professor" | "aluno"
  let tipo = u.tipo;
  if (tipo === "prof") tipo = "professor";
  if (tipo !== "professor" && tipo !== "aluno") {
    // tenta inferir (opcional)
    tipo = u.is_prof ? "professor" : "aluno";
  }
  // URL de navegação: se a API já manda, usa; senão tenta um fallback
  const url =
    u.url ||
    (u.slug ? `/perfil-publico/${u.slug}` : (tipo === "professor" ? `/prof/${id}` : `/aluno/${id}`));

  return { id, nome, email, avatarUrl, tipo, url };
}

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

  // Buscar usuários conforme digita (com debounce)
  useEffect(() => {
    const t = setTimeout(async () => {
      const q = searchQuery.trim();
      if (q.length >= 2) {
        try {
          setIsSearching(true);
          const r = await buscarUsuarios(q, 8);
          if (r && r.success) {
            const list = Array.isArray(r.data) ? r.data : [];
            setSearchResults(list.map(normalizeUserResult));
            setShowSuggestions(true);
          } else {
            setSearchResults([]);
            setShowSuggestions(true);
          }
        } catch {
          setSearchResults([]);
          setShowSuggestions(true);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowSuggestions(false);
      }
    }, 300);
    return () => clearTimeout(t);
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

  const handleSearchChange = (e) => setSearchQuery(e.target.value);

  const handleUserSelect = (usuario) => {
    setSearchQuery("");
    setShowSuggestions(false);
    if (usuario?.url) {
      navigate(usuario.url);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchResults.length > 0) handleUserSelect(searchResults[0]);
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
          <form onSubmit={handleSearchSubmit} className="search-form">
            <input
              className="search-input"
              placeholder="Procure por pessoas"
              aria-label="Buscar"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => {
                if (searchResults.length > 0) setShowSuggestions(true);
              }}
            />
            <button
              className="search-icon"
              aria-label="Buscar"
              type="submit"
              onClick={handleSearchSubmit}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
            <button className="hidden-submit" type="submit" aria-hidden />
          </form>

          {/* Dropdown de sugestões */}
          {showSuggestions && (searchResults.length > 0 || isSearching) && (
            <div className="search-suggestions" ref={suggestionsRef}>
              {isSearching ? (
                <div className="suggestion-item loading">Buscando…</div>
              ) : searchResults.length === 0 ? (
                <div className="suggestion-item no-results">Nenhum resultado</div>
              ) : (
                searchResults.map((usuario) => (
                  <div
                    key={`${usuario.tipo}-${usuario.id}`}
                    className="suggestion-item"
                    onClick={() => handleUserSelect(usuario)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && handleUserSelect(usuario)}
                  >
                    <div className="suggestion-avatar">
                      <Avatar
                        src={usuario.avatarUrl}
                        name={usuario.nome}
                        className="sm"
                      />
                    </div>
                    <div className="suggestion-info">
                      <div className="suggestion-name">{usuario.nome}</div>
                      <div className="suggestion-meta">
                        <span className={`suggestion-badge ${usuario.tipo}`}>
                          {usuario.tipo === "professor" ? "👨‍🏫 Professor" : "👤 Aluno"}
                        </span>
                        {usuario.email && (
                          <span className="suggestion-email">{usuario.email}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Direita: atalhos e menu */}
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
