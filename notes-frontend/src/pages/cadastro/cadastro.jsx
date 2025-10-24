import React from 'react';
import HeaderDeslogado from '../../components/header-deslogado';
import Footer from '../../components/footer';
import './cadastro.css';

const Cadastro = () => {
  const handleProfessorClick = () => {
    // Navegar para página de cadastro de professor
    window.location.href = '/cadastro/professor';
  };

  const handleAlunoClick = () => {
    // Navegar para página de cadastro de aluno
    window.location.href = '/cadastro/aluno';
  };

  return (
    <div className="cadastro-container">
      {/* Header */}
      <HeaderDeslogado />

      {/* Main Content */}
      <main className="main-content">
        <div className="cadastro-card">
          <h1 className="cadastro-title">Criar Conta</h1>
          <p className="cadastro-subtitle">Escolha o tipo de conta que deseja criar</p>
          
          <div className="cadastro-options">
            <button 
              onClick={handleProfessorClick}
              className="option-button professor-button"
            >
              <div className="option-icon">👨‍🏫</div>
              <h3 className="option-title">Professor</h3>
              <p className="option-description">
                Crie e gerencie suas aulas, compartilhe conhecimento e ensine outros.
              </p>
            </button>
            
            <button 
              onClick={handleAlunoClick}
              className="option-button aluno-button"
            >
              <div className="option-icon">👨‍🎓</div>
              <h3 className="option-title">Aluno</h3>
              <p className="option-description">
                Acesse aulas, acompanhe seu progresso e desenvolva novas habilidades.
              </p>
            </button>
          </div>
          
          <div className="login-section">
            <p className="login-text">Já tem uma conta?</p>
            <button type="button" className="login-button">
              FAZER LOGIN
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Cadastro;
