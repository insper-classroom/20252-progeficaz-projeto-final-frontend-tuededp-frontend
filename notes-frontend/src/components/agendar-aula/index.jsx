import React, { useState, useEffect } from 'react';
import { buscarAulasProfessor, criarAgendamento } from '../../services/apiService';
import { getUser } from '../../services/authService';
import './index.css';

const AgendarAula = ({ professor, onClose, onSuccess }) => {
  const [aulas, setAulas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [agendando, setAgendando] = useState(false);
  const [erro, setErro] = useState(null);
  
  const [formData, setFormData] = useState({
    id_aula: '',
    data_hora: '',
    hora: '',
    observacoes: ''
  });

  useEffect(() => {
    if (professor?._id || professor?.id) {
      carregarAulas();
    }
  }, [professor]);

  const carregarAulas = async () => {
    setLoading(true);
    setErro(null);
    try {
      const professorId = professor._id || professor.id;
      console.log('[AgendarAula] Professor ID:', professorId);
      console.log('[AgendarAula] Professor objeto:', professor);
      
      const resultado = await buscarAulasProfessor(professorId);
      
      console.log('[AgendarAula] Resultado da busca:', resultado);
      
      if (resultado.success) {
        const aulasEncontradas = resultado.data || [];
        console.log('[AgendarAula] Aulas encontradas:', aulasEncontradas.length);
        setAulas(aulasEncontradas);
        
        if (aulasEncontradas.length === 0) {
          setErro('Este professor ainda não tem aulas disponíveis. Peça para o professor criar aulas no sistema.');
        }
      } else {
        console.error('[AgendarAula] Erro na busca:', resultado.error);
        setErro(resultado.error || 'Erro ao carregar aulas');
      }
    } catch (error) {
      console.error('Erro ao carregar aulas:', error);
      setErro('Erro ao carregar aulas do professor');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(null);
    setAgendando(true);

    try {
      const aluno = getUser();
      const alunoId = aluno._id || aluno.id;
      const professorId = professor._id || professor.id;

      if (!alunoId) {
        setErro('Você precisa estar logado como aluno para agendar uma aula');
        setAgendando(false);
        return;
      }

      if (!formData.id_aula) {
        setErro('Selecione uma aula');
        setAgendando(false);
        return;
      }

      if (!formData.data_hora || !formData.hora) {
        setErro('Selecione data e hora para a aula');
        setAgendando(false);
        return;
      }

      // Combinar data e hora e garantir timezone UTC
      const dataHoraString = `${formData.data_hora}T${formData.hora}:00`;
      const dataHoraObj = new Date(dataHoraString);
      
      // Verificar se a data é válida
      if (isNaN(dataHoraObj.getTime())) {
        setErro('Data ou hora inválida');
        setAgendando(false);
        return;
      }
      
      // Formatar para ISO string com timezone
      const dataHora = dataHoraObj.toISOString();

      const agendamentoData = {
        id_aluno: alunoId,
        id_professor: professorId,
        id_aula: formData.id_aula,
        data_hora: dataHora,
        observacoes: formData.observacoes || ''
      };

      const resultado = await criarAgendamento(agendamentoData);

      if (resultado.success) {
        if (onSuccess) {
          onSuccess(resultado.data);
        }
        if (onClose) {
          onClose();
        }
      } else {
        // Mensagens de erro mais amigáveis
        const errorMessage = resultado.error || 'Erro ao agendar aula';
        let mensagemFinal = errorMessage;
        
        if (errorMessage.includes('schedule_conflict')) {
          mensagemFinal = 'Já existe um agendamento neste horário. Escolha outro horário.';
        } else if (errorMessage.includes('not_found')) {
          mensagemFinal = 'Professor ou aula não encontrado. Tente novamente.';
        } else if (errorMessage.includes('invalid')) {
          mensagemFinal = 'Dados inválidos. Verifique as informações e tente novamente.';
        }
        
        setErro(mensagemFinal);
      }
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      setErro('Erro ao processar agendamento');
    } finally {
      setAgendando(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Gerar horários disponíveis (8h às 22h)
  const gerarHorarios = () => {
    const horarios = [];
    for (let h = 8; h <= 22; h++) {
      horarios.push(`${String(h).padStart(2, '0')}:00`);
      if (h < 22) {
        horarios.push(`${String(h).padStart(2, '0')}:30`);
      }
    }
    return horarios;
  };

  // Data mínima: hoje
  const hoje = new Date().toISOString().split('T')[0];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content agendar-aula-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Agendar Aula</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          {professor && (
            <div className="professor-info">
              <h3>Professor: {professor.nome}</h3>
              {professor.email && <p>{professor.email}</p>}
            </div>
          )}

          {erro && (
            <div className="error-message">
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="id_aula">Selecione a Aula *</label>
              {loading ? (
                <p>Carregando aulas...</p>
              ) : aulas.length === 0 ? (
                <p className="no-aulas">Este professor ainda não tem aulas disponíveis.</p>
              ) : (
                <select
                  id="id_aula"
                  name="id_aula"
                  value={formData.id_aula}
                  onChange={handleChange}
                  required
                  disabled={agendando}
                >
                  <option value="">Selecione uma aula</option>
                  {aulas.map((aula) => (
                    <option key={aula._id} value={aula._id}>
                      {aula.titulo} - R$ {aula.preco_decimal ? parseFloat(aula.preco_decimal).toFixed(2) : '0.00'}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="data_hora">Data *</label>
                <input
                  type="date"
                  id="data_hora"
                  name="data_hora"
                  value={formData.data_hora}
                  onChange={handleChange}
                  min={hoje}
                  required
                  disabled={agendando}
                />
              </div>

              <div className="form-group">
                <label htmlFor="hora">Hora *</label>
                <select
                  id="hora"
                  name="hora"
                  value={formData.hora}
                  onChange={handleChange}
                  required
                  disabled={agendando}
                >
                  <option value="">Selecione a hora</option>
                  {gerarHorarios().map((horario) => (
                    <option key={horario} value={horario}>
                      {horario}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="observacoes">Observações (opcional)</label>
              <textarea
                id="observacoes"
                name="observacoes"
                value={formData.observacoes}
                onChange={handleChange}
                rows="3"
                placeholder="Adicione alguma observação sobre a aula..."
                disabled={agendando}
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-cancel"
                onClick={onClose}
                disabled={agendando}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={agendando || aulas.length === 0}
              >
                {agendando ? 'Agendando...' : 'Confirmar Agendamento'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AgendarAula;

