import React, { useState, useEffect, useRef } from 'react';
import logo from '../../assets/logo_estudai.jpg';
import { useNavigate } from 'react-router-dom';
import { buscarUsuarios } from '../../services/apiService';
import './index.css';

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
  let tipo = u.tipo;
  if (tipo === "prof") tipo = "professor";
  if (tipo !== "professor" && tipo !== "aluno") {
    tipo = u.is_prof ? "professor" : "aluno";
  }
  const url = u.url || (u.slug ? `/perfil-publico/${u.slug}` : (tipo === "professor" ? `/professor/${u.slug || id}` : `/aluno/${u.slug || id}`));
  return { id, nome, email, avatarUrl, tipo, url };
}

const HeaderDeslogado = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);
  const suggestionsRef = useRef(null);

  const handleEntrarClick = () => {
    navigate('/login');
  };

  const handleJunteSeNosClick = () => {
    navigate('/junte-se-nos');
  };

  const handleLogoClick = () => {
    navigate('/');
  };

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
    } else if (usuario?.tipo === "professor") {
      navigate(`/professor/${usuario.slug || usuario.id}`);
    } else {
      navigate(`/aluno/${usuario.slug || usuario.id}`);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchResults.length > 0) handleUserSelect(searchResults[0]);
  };

  return (
    <header className="header-deslogado">
      <div className="header-content">
        {/* Logo */}
        <div className="logo-section">
          <div className="logo" onClick={handleLogoClick}>
            <div className="logo-icon">
              <img src={logo} alt="ESTUDAÍ" />
            </div>
            <span className="logo-text">E S T U D A Í</span>
          </div>
        </div>

        {/* Barra de busca */}
        <div className="search-wrap" ref={searchRef}>
          <form onSubmit={handleSearchSubmit}>
            <input
              className="search-input"
              placeholder="Procure por pessoas, aulas, temas…"
              aria-label="Buscar"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => {
                if (searchResults.length > 0) setShowSuggestions(true);
              }}
            />
            <button className="hidden-submit" type="submit" aria-hidden />
          </form>

          <button
            className="search-icon"
            aria-label="Buscar"
            type="button"
            onClick={handleSearchSubmit}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>

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

        {/* Entrar Button */}
        <div className="header-actions">
          <button 
            className="junte-se-button"
            onClick={handleJunteSeNosClick}
          >
            Junte-se a nós
          </button>
          <button 
            className="entrar-button"
            onClick={handleEntrarClick}
          >
            Entrar
          </button>
        </div>
      </div>
    </header>
  );
};

export default HeaderDeslogado;
