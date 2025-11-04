import React, { useState, useEffect, useRef } from 'react';
import { buscarAulasProfessor, criarAgendamento } from '../../services/apiService';
import { getUser } from '../../services/authService';
import './index.css';

const AgendarAula = ({ professor, onClose, onSuccess }) => {
  const [aulas, setAulas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [agendando, setAgendando] = useState(false);
  const [erro, setErro] = useState(null);
  const [profHasTokens, setProfHasTokens] = useState(false);
  const popupRef = useRef(null);

  const [formData, setFormData] = useState({
    id_aula: '',
    data_hora: '',
    hora: '',
    observacoes: ''
  });

  useEffect(() => {
    if (professor?._id || professor?.id) {
      carregarAulas();
      setProfHasTokens(checkProfessorObjectHasTokens(professor));
    }
  }, [professor]);

  // --- Helpers para OAuth/polling ---
  const professorIdFromProp = () => professor?._id || professor?.id || '';

  function checkProfessorObjectHasTokens(profObj) {
    if (!profObj) return false;
    // caso o próprio objeto professor passado já contenha google_tokens
    return !!(profObj.google_tokens && profObj.google_tokens.refresh_token);
  }

  async function fetchProfessor(profId) {
    // Busca o professor atual no backend (usar rota existente do seu backend)
    try {
      const res = await fetch(`/api/professores/${profId}`);
      if (!res.ok) return null;
      const json = await res.json();
      return json;
    } catch (err) {
      console.warn('Erro fetchProfessor', err);
      return null;
    }
  }

  async function startGoogleOauth(profId, agendaId = '') {
    const url = `/api/agenda/google/oauth/start?professor_id=${profId}&agenda_id=${agendaId}`;
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Erro iniciando OAuth: ${res.status} ${text}`);
    }
    return res.json(); // espera { auth_url: "..." }
  }

  function openPopup(url) {
    // abre popup inicialmente em branco pra evitar bloqueio
    const popup = window.open('', 'google_oauth_popup', 'width=700,height=800');
    if (!popup) throw new Error('Popup bloqueado. Permita popups para este site.');
    popup.location = url;
    return popup;
  }

  async function connectGoogleAndWait(profId, agendaId = '', {
    timeoutMs = 2 * 60 * 1000,
    intervalMs = 1000
  } = {}) {
    // Inicia OAuth e faz polling até detectar google_tokens no backend
    try {
      const { auth_url } = await startGoogleOauth(profId, agendaId);
      popupRef.current = openPopup(auth_url);

      const start = Date.now();

      return await new Promise((resolve, reject) => {
        const poll = setInterval(async () => {
          // se popup foi fechado manualmente
          if (!popupRef.current || popupRef.current.closed) {
            clearInterval(poll);
            reject(new Error('Popup fechado antes da autorização'));
            return;
          }

          const elapsed = Date.now() - start;
          if (elapsed > timeoutMs) {
            clearInterval(poll);
            try {
              popupRef.current.close();
            } catch (e) {}
            reject(new Error('Tempo esgotado para autorizar Google Calendar'));
            return;
          }

          // busca professor
          try {
            const prof = await fetchProfessor(profId);
            if (prof && prof.google_tokens && prof.google_tokens.refresh_token) {
              clearInterval(poll);
              try {
                popupRef.current.close();
              } catch (e) {}
              resolve(prof);
              return;
            }
          } catch (err) {
            // ignorar erro momentâneo e continuar polling
            console.warn('Erro no polling:', err);
          }
        }, intervalMs);
      });
    } catch (err) {
      // se start falhar
      if (popupRef.current && !popupRef.current.closed) {
        try { popupRef.current.close(); } catch (e) {}
      }
      throw err;
    }
  }

  // --- Fim helpers OAuth ---

  const carregarAulas = async () => {
    setLoading(true);
    setErro(null);
    try {
      const professorId = professor._id || professor.id;
      console.log('[AgendarAula] Professor ID:', professorId);
      const resultado = await buscarAulasProfessor(professorId);

      console.log('[AgendarAula] Resultado da busca:', resultado);

      if (resultado.success) {
        const aulasEncontradas = resultado.data || [];
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
      const alunoId = aluno?._id || aluno?.id;
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

      // Combinar data e hora e garantir timezone
      const dataHoraString = `${formData.data_hora}T${formData.hora}:00`;
      const dataHoraObj = new Date(dataHoraString);

      if (isNaN(dataHoraObj.getTime())) {
        setErro('Data ou hora inválida');
        setAgendando(false);
        return;
      }

      const dataHora = dataHoraObj.toISOString();

      const agendamentoData = {
        id_aluno: alunoId,
        id_professor: professorId,
        id_aula: formData.id_aula,
        data_hora: dataHora,
        observacoes: formData.observacoes || ''
      };

      // cria agendamento
      const resultado = await criarAgendamento(agendamentoData);

      if (resultado.success) {
        // se o professor não tiver tokens, iniciamos o fluxo OAuth e passamos agenda_id
        const created = resultado.data;
        // Professor object pode estar desatualizado; verificar no backend
        const profLatest = await fetchProfessor(professorId);
        const hasTokens = !!(profLatest && profLatest.google_tokens && profLatest.google_tokens.refresh_token);
        if (!hasTokens) {
          // inicia OAuth com agenda_id para que backend crie o evento após salvar tokens
          try {
            await connectGoogleAndWait(professorId, created._id);
            setProfHasTokens(true);
            // opcional: buscar agendamento atualizado se quiser mostrar link do evento
            // const agUpdate = await fetch(`/api/agenda/${created._id}`) ...
          } catch (err) {
            // Se falhar no OAuth, apenas mostrar aviso e continuar (agendamento já criado no banco)
            console.warn('OAuth falhou/foi cancelado:', err);
            setErro('Agendamento criado, mas não foi possível conectar ao Google Calendar: ' + err.message);
          }
        }

        if (onSuccess) onSuccess(resultado.data);
        if (onClose) onClose();
      } else {
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

  // Botão para conectar manualmente (útil para professor)
  const handleManualConnect = async () => {
    setErro(null);
    const profId = professorIdFromProp();
    if (!profId) {
      setErro('ID do professor inválido para conectar Google Calendar');
      return;
    }
    try {
      // inicia OAuth sem agenda_id
      await connectGoogleAndWait(profId, '');
      setProfHasTokens(true);
      alert('Google Calendar conectado com sucesso!');
    } catch (err) {
      console.error('Erro conectar manualmente:', err);
      setErro(err.message || 'Erro ao conectar Google Calendar');
    }
  };

  // Gerar horários disponíveis (8h às 22h)
  const gerarHorarios = () => {
    const horarios = [];
    for (let h = 8; h <= 22; h++) {
      horarios.push(`${String(h).padStart(2, '0')}:00`);
      if (h < 22) horarios.push(`${String(h).padStart(2, '0')}:30`);
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
              <div style={{ marginTop: 8 }}>
                {profHasTokens ? (
                  <small style={{ color: '#059669' }}>Google Calendar conectado</small>
                ) : (
                  <button
                    type="button"
                    onClick={handleManualConnect}
                    style={{
                      marginTop: 8,
                      padding: '6px 10px',
                      borderRadius: 6,
                      border: '1px solid #0A66C2',
                      background: 'white',
                      color: '#0A66C2',
                      cursor: 'pointer'
                    }}
                    disabled={agendando}
                  >
                    Conectar Google Calendar
                  </button>
                )}
              </div>
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
