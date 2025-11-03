import React from 'react';
import { useNavigate } from 'react-router-dom';
import { buscarProfessoresEmAlta } from '../../services/apiService';
import './index.css';

export default function ProfessoresDestaque() {
  const [professores, setProfessores] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const navigate = useNavigate();

  React.useEffect(() => {
    carregarProfessores();
  }, []);

  const carregarProfessores = async () => {
    setLoading(true);
    const resultado = await buscarProfessoresEmAlta(6);
    if (resultado.data) {
      setProfessores(resultado.data);
    }
    setLoading(false);
  };

  const handleVerPerfil = (professor) => {
    const slug = professor.slug || professor.nome?.toLowerCase().replace(/\s+/g, '-');
    navigate(`/professor/${slug}`);
  };

  const renderStars = (nota) => {
    const fullStars = Math.floor(nota);
    const hasHalfStar = nota % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="pd-stars">
        {[...Array(fullStars)].map((_, i) => (
          <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
        {hasHalfStar && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fillOpacity="0.5" />
          </svg>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <section className="professores-destaque" id="professores">
      <div className="pd-container">
        <div className="pd-header">
          <h2 className="pd-title">Professores em Alta</h2>
          <p className="pd-subtitle">Conheça os professores mais bem avaliados da nossa plataforma</p>
        </div>

        {loading ? (
          <div className="pd-loading">Carregando professores...</div>
        ) : professores.length === 0 ? (
          <div className="pd-empty">
            <p>Nenhum professor em alta no momento. Seja o primeiro a avaliar!</p>
          </div>
        ) : (
          <div className="pd-grid">
            {professores.map((professor) => (
            <div key={professor._id || professor.id} className="pd-card">
              <div className="pd-card__avatar">
                {professor.avatar && professor.avatar.startsWith('http') ? (
                  <img src={professor.avatar} alt={professor.nome} />
                ) : professor.avatar ? (
                  <img src={`http://localhost:5000${professor.avatar}`} alt={professor.nome} />
                ) : (
                  <div className="pd-card__avatar-placeholder">
                    {professor.nome?.charAt(0).toUpperCase() || 'P'}
                  </div>
                )}
              </div>
              
              <div className="pd-card__content">
                <h3 className="pd-card__name">{professor.nome}</h3>
                
                {professor.bio && (
                  <p className="pd-card__bio">{professor.bio.substring(0, 100)}{professor.bio.length > 100 ? '...' : ''}</p>
                )}
                
                <div className="pd-card__rating">
                  {renderStars(professor.nota_media || 0)}
                  <span className="pd-card__rating-text">
                    {professor.nota_media?.toFixed(1) || '0.0'} ({professor.total_avaliacoes || 0} avaliações)
                  </span>
                </div>
                
                <button 
                  className="pd-card__button"
                  onClick={() => handleVerPerfil(professor)}
                >
                  Ver Perfil
                </button>
              </div>
            </div>
          ))}
          </div>
        )}
      </div>
    </section>
  );
}

