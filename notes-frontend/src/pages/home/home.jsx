import React from 'react';
import HeaderDeslogado from '../../components/header-deslogado';
import Footer from '../../components/footer';
import './home.css';

const Home = () => {
  return (
    <div className="home-container">
      <HeaderDeslogado />
      
      <main className="home-main">
        <div className="home-content">
          <h1>Bem-vindo ao ESTUDAÍ</h1>
          <p>Seu dashboard de aprendizado</p>
          
          <div className="home-cards">
            <div className="home-card">
              <h3>Meus Cursos</h3>
              <p>Continue seus estudos</p>
            </div>
            <div className="home-card">
              <h3>Progresso</h3>
              <p>Acompanhe seu desenvolvimento</p>
            </div>
            <div className="home-card">
              <h3>Notificações</h3>
              <p>Mantenha-se atualizado</p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Home;
