import React from 'react';
import logo from '../../assets/logo_estudai.jpg';
import { useNavigate } from 'react-router-dom';
import './index.css';

const HeaderDeslogado = () => {
  const navigate = useNavigate();

  const handleEntrarClick = () => {
    navigate('/login');
  };

  const handleJunteSeNosClick = () => {
    navigate('/junte-se-nos');
  };

  const handleLogoClick = () => {
    navigate('/');
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
