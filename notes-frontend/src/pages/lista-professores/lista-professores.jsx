import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { isLoggedIn } from '../../services/authService';
import HeaderDeslogado from '../../components/header-deslogado';
import HeaderLogado from '../../components/header-logado';
import Footer from '../../components/footer';
import "./lista-professores.css";

const API_BASE_URL = 'http://localhost:5000';

export default function ListaProfessores() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const area = searchParams.get('area');
  
  const [professores, setProfessores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const isAuthenticated = isLoggedIn();

  useEffect(() => {
    buscarProfessores();
  }, [area]);

  async function buscarProfessores() {
    setLoading(true);
    setError(null);
    
    try {
      const url = area 
        ? `${API_BASE_URL}/api/professores/?area=${encodeURIComponent(area)}`
        : `${API_BASE_URL}/api/professores/`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar professores');
      }
      
      const data = await response.json();
      setProfessores(data.data || []);
    } catch (err) {
      setError(err.message);
      console.error('Erro ao buscar professores:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleVoltar() {
    navigate('/');
  }

  function handleVerPerfil(professorIdOrSlug) {
    navigate(`/professor/${professorIdOrSlug}`);
  }

  return (
    <div className="lista-professores-page">
      {isAuthenticated ? <HeaderLogado /> : <HeaderDeslogado />}
      
      <main className="lista-professores-container">
        <div className="lista-professores-header">
          <button onClick={handleVoltar} className="btn-voltar">
            ← Voltar
          </button>
          
          <h1 className="lista-titulo">
            {area ? `Professores de ${area}` : 'Todos os Professores'}
          </h1>
          
          {area && (
            <p className="lista-subtitulo">
              Encontre o professor ideal para suas aulas de {area}
            </p>
          )}
        </div>

        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Carregando professores...</p>
          </div>
        )}

        {error && (
          <div className="error-state">
            <p className="error-message">❌ {error}</p>
            <button onClick={buscarProfessores} className="btn btn--primary">
              Tentar novamente
            </button>
          </div>
        )}

        {!loading && !error && professores.length === 0 && (
          <div className="empty-state">
            <p>Nenhum professor encontrado para esta área.</p>
            <button onClick={handleVoltar} className="btn btn--outline">
              Voltar para home
            </button>
          </div>
        )}

        {!loading && !error && professores.length > 0 && (
          <div className="pd-grid">
            {professores.map((prof) => {
              const slug = prof.slug || prof.nome?.toLowerCase().replace(/\s+/g, '-');
              return (
                <div key={prof._id || prof.id} className="pd-card">
                  <div className="pd-card__avatar">
                    {prof.avatar && prof.avatar.startsWith('http') ? (
                      <img src={prof.avatar} alt={prof.nome} />
                    ) : prof.avatar ? (
                      <img src={`http://localhost:5000${prof.avatar}`} alt={prof.nome} />
                    ) : (
                      <div className="pd-card__avatar-placeholder">
                        {prof.nome?.charAt(0).toUpperCase() || 'P'}
                      </div>
                    )}
                  </div>
                  
                  <div className="pd-card__content">
                    <h3 className="pd-card__name">{prof.nome}</h3>
                    
                    {prof.bio && (
                      <p className="pd-card__bio">{prof.bio.substring(0, 100)}{prof.bio.length > 100 ? '...' : ''}</p>
                    )}
                    
                    {prof.email && (
                      <div className="pd-card__email">
                        <span className="pd-card__email-text">{prof.email}</span>
                      </div>
                    )}
                    
                    <button 
                      className="pd-card__button"
                      onClick={() => handleVerPerfil(slug || prof._id)}
                    >
                      Ver perfil completo
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}

