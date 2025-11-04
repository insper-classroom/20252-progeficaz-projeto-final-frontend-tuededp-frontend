import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { isLoggedIn } from '../../services/authService';
import { buscarStatsProfessor } from '../../services/apiService';
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
  const [avaliacoesMap, setAvaliacoesMap] = useState({});
  
  const isAuthenticated = isLoggedIn();

  useEffect(() => {
    buscarProfessores();
  }, [area]);

  useEffect(() => {
    if (professores.length > 0) {
      carregarAvaliacoes();
    }
  }, [professores]);

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

  async function carregarAvaliacoes() {
    const map = {};
    const promises = professores.map(async (prof) => {
      const profId = prof._id || prof.id;
      if (!profId) return;
      
      try {
        const stats = await buscarStatsProfessor(profId);
        if (stats && stats.success && stats.data) {
          map[profId] = {
            nota_media: stats.data.nota_media || 0,
            total_avaliacoes: stats.data.total_avaliacoes || 0
          };
        } else {
          map[profId] = { nota_media: 0, total_avaliacoes: 0 };
        }
      } catch (err) {
        console.error(`Erro ao buscar avaliações do professor ${profId}:`, err);
        map[profId] = { nota_media: 0, total_avaliacoes: 0 };
      }
    });
    
    await Promise.all(promises);
    setAvaliacoesMap(map);
  }

  function handleVerPerfil(professorIdOrSlug) {
    navigate(`/professor/${professorIdOrSlug}`);
  }

  const renderStars = (nota) => {
    // Converte de 0-10 (escala das avaliações) para 0-5 (estrelas)
    const notaValida = Math.max(0, Math.min(5, Number(nota) / 2 || 0));
    const fullStars = Math.floor(notaValida);
    const hasHalfStar = notaValida % 1 >= 0.5;
    const emptyStars = Math.max(0, Math.min(5, 5 - fullStars - (hasHalfStar ? 1 : 0)));

    return (
      <div className="pd-stars">
        {fullStars > 0 && [...Array(fullStars)].map((_, i) => (
          <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
        {hasHalfStar && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fillOpacity="0.5" />
          </svg>
        )}
        {emptyStars > 0 && [...Array(emptyStars)].map((_, i) => (
          <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
      </div>
    );
  };

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
                    {(() => {
                      const avatarUrl = prof.avatar_url || prof.avatar || prof.avatarUrl || '';
                      if (avatarUrl && avatarUrl.startsWith('http')) {
                        return <img src={avatarUrl} alt={prof.nome} />;
                      } else if (avatarUrl) {
                        return <img src={`http://localhost:5000${avatarUrl}`} alt={prof.nome} />;
                      } else {
                        return (
                          <div className="pd-card__avatar-placeholder">
                            {prof.nome?.charAt(0).toUpperCase() || 'P'}
                          </div>
                        );
                      }
                    })()}
                  </div>
                  
                  <div className="pd-card__content">
                    <h3 className="pd-card__name">{prof.nome}</h3>
                    
                    {Array.isArray(prof.quer_ensinar) && prof.quer_ensinar.length > 0 && (
                      <div className="pd-card__ensinar">
                        <span className="pd-card__ensinar-text">
                          {prof.quer_ensinar.slice(0, 3).join(', ')}
                          {prof.quer_ensinar.length > 3 && '...'}
                        </span>
                      </div>
                    )}
                    
                    {(() => {
                      const profId = prof._id || prof.id;
                      const avaliacao = avaliacoesMap[profId] || { nota_media: 0, total_avaliacoes: 0 };
                      return (
                        <div className="pd-card__rating">
                          {renderStars(avaliacao.nota_media)}
                          <span className="pd-card__rating-text">
                            {avaliacao.nota_media.toFixed(1)} ({avaliacao.total_avaliacoes} avaliações)
                          </span>
                        </div>
                      );
                    })()}
                    
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




