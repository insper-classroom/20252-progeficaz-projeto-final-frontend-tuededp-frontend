import React from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import Login from './pages/login/login'
import Cadastro from "./pages/cadastro/cadastro";
import CadastroAluno from "./pages/cadastro/cadastro_aluno/cadastro_aluno";
import CadastroProfessor from "./pages/cadastro/cadastro_professor/cadastro_professor";
import Home from './pages/home/home'
import DashboardAluno from './pages/dashboard-aluno/dashboard-aluno'
import DashboardProfessor from './pages/dashboard-professor/dashboard-professor'
import './App.css'
import PerfilProfessor from "./components/cadastro";
import PerfilAluno from './components/perfil-aluno'
import ChatsPage from './pages/chats/chats';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard-aluno" element={<DashboardAluno />} />
          <Route path="/dashboard-professor" element={<DashboardProfessor />} />
          <Route path="/perfil-aluno" element={<PerfilAluno />} />
          <Route path="/chats" element={<ChatsPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App;