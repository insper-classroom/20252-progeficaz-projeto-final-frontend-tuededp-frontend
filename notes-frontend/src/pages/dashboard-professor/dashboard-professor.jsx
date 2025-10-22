import React, { useEffect } from 'react';
import HeaderLogado from '../../components/header-logado';
import Footer from '../../components/footer';
import { requireAuth, getUser, logout } from '../../services/authService';
import './dashboard-professor.css';

const DashboardProfessor = () => {
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
    <div className="dashboard-professor-container">
      <HeaderLogado />
      
      <main className="dashboard-main">
        <div className="dashboard-content">
          <h1>Dashboard do Professor</h1>
          <p>Bem-vindo, {user?.nome}!</p>
          
          <div className="dashboard-cards">
            <div className="dashboard-card">
              <h3>Meus Cursos</h3>
              <p>Gerencie seus cursos</p>
            </div>
            <div className="dashboard-card">
              <h3>Alunos</h3>
              <p>Acompanhe seus alunos</p>
            </div>
            <div className="dashboard-card">
              <h3>Relatórios</h3>
              <p>Visualize estatísticas</p>
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

export default DashboardProfessor;
