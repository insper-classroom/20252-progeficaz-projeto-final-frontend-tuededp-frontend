import React from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import Login from './pages/login/login'
import CadastroAluno from "./pages/cadastro/cadastro_aluno/cadastro_aluno";
import CadastroProfessor from "./pages/cadastro/cadastro_professor/cadastro_professor";
import Home from './pages/home/home'
import DashboardAluno from './pages/dashboard-aluno/dashboard-aluno'
import DashboardProfessor from './pages/dashboard-professor/dashboard-professor'
import './App.css'
import PerfilProfessor from "./components/cadastro";
import CadastroEscolha from './pages/cadastro/cadastro_escolha';
import PerfilAluno from './components/perfil-aluno'
import ChatsPage from './pages/chats/chats';
import PerfilPublico from './pages/perfil-publico';
import JunteSeNos from './pages/junte-se-nos/junte-se-nos';
import ProtectedRoute from './components/ProtectedRoute';
import ListaProfessores from "./pages/lista-professores/lista-professores.jsx";
import MinhasAulas from './pages/minhas-aulas/minhas-aulas';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/junte-se-nos" element={<JunteSeNos />} />
          <Route path="/cadastro-escolha" element={<CadastroEscolha />} />
          <Route 
            path="/dashboard-aluno" 
            element={
              <ProtectedRoute requiredTipo="aluno">
                <DashboardAluno />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard-professor" 
            element={
              <ProtectedRoute requiredTipo="prof">
                <DashboardProfessor />
              </ProtectedRoute>
            } 
          />
          <Route path="/cadastro-aluno" element={<CadastroAluno />} />
          <Route path="/cadastro-professor" element={<CadastroProfessor />} />
          <Route path="/perfil" element={<PerfilAluno />} />
          <Route path="/perfil-aluno" element={<PerfilAluno />} />
          <Route path="/chats" element={<ChatsPage />} />
          <Route 
            path="/minhas-aulas" 
            element={
              <ProtectedRoute requiredTipo="aluno">
                <MinhasAulas />
              </ProtectedRoute>
            } 
          />
          <Route path="/aluno/:slug" element={<PerfilPublico />} />
          <Route path="/professores" element={<ListaProfessores />} />  
          <Route path="/professor/:slug" element={<PerfilPublico />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App;