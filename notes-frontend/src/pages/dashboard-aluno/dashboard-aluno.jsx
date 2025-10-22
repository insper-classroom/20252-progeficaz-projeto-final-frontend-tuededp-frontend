import React, { useEffect } from 'react';
import HeaderLogado from '../../components/header-logado';
import Footer from '../../components/footer';
import { requireAuth, getUser, logout } from '../../services/authService';
import './dashboard-aluno.css';

const DashboardAluno = () => {
  const user = getUser();

  useEffect(() => {
    if (!requireAuth()) {
      return;
    }
  }, []);

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="dashboard-aluno-container">
      <HeaderLogado />
      
      <main className="dashboard-main">
        <div className="dashboard-content">
          <h1>Dashboard do Aluno</h1>
          <p>Bem-vindo, {user?.nome}!</p>
          
          <div className="dashboard-cards">
            <div className="dashboard-card">
              <h3>Meus Cursos</h3>
              <p>Continue seus estudos</p>
            </div>
            <div className="dashboard-card">
              <h3>Progresso</h3>
              <p>Acompanhe seu desenvolvimento</p>
            </div>
            <div className="dashboard-card">
              <h3>Notificações</h3>
              <p>Mantenha-se atualizado</p>
            </div>
          </div>
          
          <button onClick={handleLogout} className="logout-button">
            Sair
          </button>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default DashboardAluno;
