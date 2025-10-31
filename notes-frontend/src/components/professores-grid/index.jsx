import React, { useState, useEffect } from 'react';
import { buscarProfessores } from '../../services/apiService';
import AgendarAula from '../agendar-aula';
import './index.css';

export default function ProfessoresGrid() {
  const [professores, setProfessores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [professorSelecionado, setProfessorSelecionado] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  useEffect(() => {
    carregarProfessores();
  }, []);

  const carregarProfessores = async () => {
    setLoading(true);
    setErro(null);
    try {
      const resultado = await buscarProfessores({ limit: 6 });
      
      if (resultado.success) {
        setProfessores(resultado.data || []);
      } else {
        setErro(resultado.error || 'Erro ao carregar professores');
      }
    } catch (error) {
      console.error('Erro ao carregar professores:', error);
      setErro('Erro ao carregar professores');
    } finally {
      setLoading(false);
    }
  };

  const handleAgendar = (professor) => {
    setProfessorSelecionado(professor);
    setMostrarModal(true);
  };

  const handleCloseModal = () => {
    setMostrarModal(false);
    setProfessorSelecionado(null);
  };

  const handleAgendamentoSucesso = () => {
    handleCloseModal();
    // Opcional: mostrar mensagem de sucesso ou atualizar lista
    alert('Aula agendada com sucesso!');
  };

  if (loading) {
    return (
      <div className="professores-grid">
        <div className="loading">Carregando professores...</div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="professores-grid">
        <div className="error">{erro}</div>
      </div>
    );
  }

  if (professores.length === 0) {
    return (
      <div className="professores-grid">
        <div className="empty">Nenhum professor disponível no momento.</div>
      </div>
    );
  }

  return (
    <>
      <div className="professores-grid">
        <div className="grid">
          {professores.map((professor) => (
            <div key={professor._id || professor.id} className="professor-card">
              <div className="professor-avatar">
                {professor.nome ? professor.nome.charAt(0).toUpperCase() : 'P'}
              </div>
              <div className="professor-info">
                <h3>{professor.nome || 'Professor'}</h3>
                <p className="professor-email">{professor.email}</p>
                {professor.bio && (
                  <p className="professor-bio">{professor.bio.substring(0, 100)}...</p>
                )}
                {professor.endereco?.cidade && (
                  <p className="professor-location">
                    📍 {professor.endereco.cidade}, {professor.endereco.estado}
                  </p>
                )}
              </div>
              <button
                className="btn-agendar"
                onClick={() => handleAgendar(professor)}
              >
                Agendar Aula
              </button>
            </div>
          ))}
        </div>
        <button className="see-more">Veja mais</button>
      </div>

      {mostrarModal && professorSelecionado && (
        <AgendarAula
          professor={professorSelecionado}
          onClose={handleCloseModal}
          onSuccess={handleAgendamentoSucesso}
        />
      )}
    </>
  );
}
