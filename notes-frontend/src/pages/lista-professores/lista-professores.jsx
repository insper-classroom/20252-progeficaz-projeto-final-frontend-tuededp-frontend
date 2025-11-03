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

  function handleVerPerfil(professorId) {
    navigate(`/professor/${professorId}`);
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
            <p>😔 Nenhum professor encontrado para esta área.</p>
            <button onClick={handleVoltar} className="btn btn--outline">
              Voltar para home
            </button>
          </div>
        )}

        {!loading && !error && professores.length > 0 && (
          <div className="professores-grid">
            {professores.map((prof) => (
              <div key={prof._id} className="professor-card">
                <div className="professor-card-header">
                  <div className="professor-avatar">
                    {prof.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="professor-info">
                    <h3 className="professor-nome">{prof.nome}</h3>
                    {prof.area && (
                      <span className="professor-area">{prof.area}</span>
                    )}
                  </div>
                </div>

                {prof.bio && (
                  <p className="professor-bio">
                    {prof.bio.length > 150 
                      ? `${prof.bio.substring(0, 150)}...` 
                      : prof.bio}
                  </p>
                )}

                <div className="professor-detalhes">
                  {prof.endereco && (
                    <div className="professor-detalhe">
                      <span className="detalhe-icon">📍</span>
                      <span>{prof.endereco}</span>
                    </div>
                  )}
                  
                  {prof.email && (
                    <div className="professor-detalhe">
                      <span className="detalhe-icon">✉️</span>
                      <span>{prof.email}</span>
                    </div>
                  )}
                  
                  {prof.telefone && (
                    <div className="professor-detalhe">
                      <span className="detalhe-icon">📞</span>
                      <span>{prof.telefone}</span>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => handleVerPerfil(prof._id)}
                  className="btn btn--primary btn-ver-perfil"
                >
                  Ver perfil completo
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}