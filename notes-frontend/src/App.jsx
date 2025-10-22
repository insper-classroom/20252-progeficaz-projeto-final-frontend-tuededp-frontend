import React from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import Login from './pages/login/login'
import Home from './pages/home/home'
import DashboardAluno from './pages/dashboard-aluno/dashboard-aluno'
import DashboardProfessor from './pages/dashboard-professor/dashboard-professor'
import './App.css'
import PerfilProfessor from "./components/cadastro";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard-aluno" element={<DashboardAluno />} />
          <Route path="/dashboard-professor" element={<DashboardProfessor />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App;