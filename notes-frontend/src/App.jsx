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

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />

          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/cadastro/aluno" element={<CadastroAluno />} />
          <Route path="/cadastro/professor" element={<CadastroProfessor />} />
          
          <Route path="/dashboard/aluno" element={<DashboardAluno />} />
          <Route path="/dashboard/professor" element={<DashboardProfessor />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App;