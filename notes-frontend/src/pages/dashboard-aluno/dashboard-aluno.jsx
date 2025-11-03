import { useState, useEffect } from 'react';
import './dashboard-aluno.css';
import HeaderLogado from '../../components/header-logado';
import Footer from '../../components/footer';
import { getUser, getToken, requireAuth } from '../../services/authService';
import AvaliacaoForm from '../../components/avaliacao-form';
import { listarAvaliacoes } from '../../services/avaliacoesService';

const DashboardAluno = () => {
  const user = getUser();
  const [stats, setStats] = useState({ agendadas: 0, concluidas: 0, paraAvaliar: 0, proximas: 0 });
  const [agendamentos, setAgendamentos] = useState([]);
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [aulasParaAvaliar, setAulasParaAvaliar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [avaliandoAula, setAvaliandoAula] = useState(null);

  const API = '/api';

  useEffect(() => {
    requireAuth();
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const alunoId = user?._id || user?.id;
      
      if (!alunoId) {
        console.error('ID do aluno não encontrado');
        setLoading(false);
        return;
      }

      const token = getToken();
      
      // Buscar agendamentos e avaliações em paralelo
      const [resAgenda, avaliacoesData] = await Promise.all([
        fetch(`${API}/agenda?aluno=${alunoId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        listarAvaliacoes({ id_aluno: alunoId }).catch(() => [])
      ]);
      
      const agendaData = await resAgenda.json();
      const agenda = agendaData.data || agendaData || [];
      
      // Buscar dados completos das aulas para cada agendamento
      const agendamentosCompletos = await Promise.all(
        agenda.map(async (agendamento) => {
          if (agendamento.aula?._id || agendamento.id_aula) {
            const aulaId = agendamento.aula?._id || agendamento.id_aula;
            try {
              const aulaResponse = await fetch(`${API}/aulas/${aulaId}`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              if (aulaResponse.ok) {
                const aulaData = await aulaResponse.json();
                return {
                  ...agendamento,
                  aula: aulaData,
                };
              }
            } catch (err) {
              console.error('Erro ao buscar dados da aula:', err);
            }
          }
          return agendamento;
        })
      );
      
      setAgendamentos(agendamentosCompletos);
      setAvaliacoes(Array.isArray(avaliacoesData) ? avaliacoesData : []);

      console.log('[dashboard-aluno] Agendamentos carregados:', agendamentosCompletos.length);
      console.log('[dashboard-aluno] Avaliações carregadas:', Array.isArray(avaliacoesData) ? avaliacoesData.length : 0);
      console.log('[dashboard-aluno] Dados de avaliações:', avaliacoesData);

      const agora = new Date();
      
      // Função auxiliar para normalizar IDs (garantir comparação correta)
      const normalizarId = (id) => {
        if (!id) return null;
        // Se for objeto, extrair o ID
        if (typeof id === 'object') {
          return id._id || id.id || id.$oid || String(id);
        }
        // Converter para string para comparação
        return String(id);
      };

      // Identificar aulas concluídas que ainda não foram avaliadas
      const idsAvaliadas = new Set(
        (Array.isArray(avaliacoesData) ? avaliacoesData : [])
          .map(av => {
            // Tentar diferentes formatos do campo id_aula
            const aulaId = av.id_aula?._id || av.id_aula?.id || av.id_aula || av.aula?._id || av.aula?.id;
            return normalizarId(aulaId);
          })
          .filter(id => id !== null) // Remover nulls
      );
      
      console.log('[dashboard-aluno] IDs de aulas já avaliadas:', Array.from(idsAvaliadas));
      
      const concluidasSemAval = agendamentosCompletos.filter(a => {
        const statusLower = (a.status || '').toLowerCase();
        const estaConcluida = statusLower === 'concluida' || 
                             statusLower === 'concluída' || 
                             statusLower.includes('conclu');
        
        if (!estaConcluida) return false;
        
        // Normalizar ID da aula do agendamento
        const aulaId = normalizarId(a.aula?._id || a.aula?.id || a.id_aula);
        
        if (!aulaId) {
          console.warn('[dashboard-aluno] Agendamento sem ID de aula:', a);
          return false;
        }
        
        const foiAvaliada = idsAvaliadas.has(aulaId);
        console.log('[dashboard-aluno] Aula:', aulaId, 'Foi avaliada?', foiAvaliada);
        
        return !foiAvaliada;
      });
      
      setAulasParaAvaliar(concluidasSemAval);
      
      // Calcular estatísticas
      const agendadas = agendamentosCompletos.filter(a => {
        const status = (a.status || '').toLowerCase();
        return ['agendada', 'confirmada'].includes(status) && 
               new Date(a.data_hora) > agora;
      });
      
      const concluidas = agendamentosCompletos.filter(a => {
        const status = (a.status || '').toLowerCase();
        return status === 'concluida' || status === 'concluída' || status.includes('conclu');
      });
      
      setStats({
        agendadas: agendadas.length,
        concluidas: concluidas.length,
        paraAvaliar: concluidasSemAval.length,
        proximas: agendadas.slice(0, 3).length
      });
    } catch (e) {
      console.error('Erro ao carregar dados:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAvaliar = (agendamento) => {
    setAvaliandoAula(agendamento);
  };

  const handleAvaliacaoConcluida = () => {
    setAvaliandoAula(null);
    carregarDados(); // Recarrega para atualizar dados
  };

  const formatData = (d) => {
    if (!d) return 'N/A';
    const date = new Date(d);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleString('pt-BR', { 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const Badge = ({ status }) => {
    const statusLower = (status || '').toLowerCase();
    const map = {
      agendada: 'agendada',
      confirmada: 'confirmada',
      concluida: 'concluida',
      'concluída': 'concluida',
      cancelada: 'cancelada',
      ausente: 'ausente'
    };
    const badgeClass = map[statusLower] || 'default';
    return <span className={`badge badge-${badgeClass}`}>{status || 'N/A'}</span>;
  };

  const filtrados = filtroStatus === 'todos' 
    ? agendamentos 
    : agendamentos.filter(a => {
        const statusLower = (a.status || '').toLowerCase();
        const filtroLower = filtroStatus.toLowerCase();
        return statusLower === filtroLower || 
               (filtroLower === 'concluida' && (statusLower === 'concluida' || statusLower === 'concluída'));
      });

  if (loading) {
    return (
      <div className="dashboard-aluno">
        <HeaderLogado />
        <div className="loading">Carregando...</div>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <HeaderLogado />
      <div className="dashboard-aluno">
        <header className="header">
          <h1>Dashboard do Aluno</h1>
          <p>Bem-vindo de volta!</p>
        </header>

        <div className="stats">
          <div className="card">
            <div className="num">{stats.agendadas}</div>
            <div>Aulas Agendadas</div>
          </div>
          <div className="card">
            <div className="num">{stats.concluidas}</div>
            <div>Aulas Concluídas</div>
          </div>
          <div className="card highlight">
            <div className="num">{stats.paraAvaliar}</div>
            <div>Aguardando Avaliação</div>
          </div>
          <div className="card">
            <div className="num">{stats.proximas}</div>
            <div>Próximas Aulas</div>
          </div>
        </div>

        {aulasParaAvaliar.length > 0 && (
          <section className="section">
            <div className="section-header">
              <h2>
                Aulas para Avaliar <span className="badge badge-alert">{aulasParaAvaliar.length}</span>
              </h2>
            </div>
            <div className="cards-list">
              {aulasParaAvaliar.map(a => (
                <div key={a._id || a.id} className="aula-card">
                  <div>
                    <h3>{a.aula?.titulo || 'Aula'}</h3>
                    <p className="prof">Prof. {a.professor?.nome || a.aula?.professor?.nome || 'N/A'}</p>
                    <p className="date">{formatData(a.data_hora)}</p>
                  </div>
                  <button className="btn-avaliar" onClick={() => handleAvaliar(a)}>
                    Avaliar
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="section">
          <div className="section-header">
            <h2>Meus Agendamentos</h2>
            <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
              <option value="todos">Todos</option>
              <option value="agendada">Agendada</option>
              <option value="confirmada">Confirmada</option>
              <option value="concluida">Concluída</option>
              <option value="cancelada">Cancelada</option>
              <option value="ausente">Ausente</option>
            </select>
          </div>

          {filtrados.length === 0 ? (
            <div className="empty">Nenhum agendamento encontrado</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Aula</th>
                  <th>Professor</th>
                  <th>Data/Hora</th>
                  <th>Status</th>
                  <th>Preço</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map(a => {
                  const agendamentoId = a._id || a.id;
                  
                  // Função auxiliar para normalizar IDs
                  const normalizarId = (id) => {
                    if (!id) return null;
                    if (typeof id === 'object') {
                      return id._id || id.id || id.$oid || String(id);
                    }
                    return String(id);
                  };
                  
                  // Normalizar ID da aula do agendamento
                  const aAulaId = normalizarId(a.aula?._id || a.aula?.id || a.id_aula);
                  
                  // Verificar se foi avaliada comparando IDs normalizados
                  const jaAvaliou = avaliacoes.some(av => {
                    const avAulaId = normalizarId(
                      av.id_aula?._id || av.id_aula?.id || av.id_aula || av.aula?._id || av.aula?.id
                    );
                    return avAulaId !== null && aAulaId !== null && avAulaId === aAulaId;
                  });
                  
                  const statusLower = (a.status || '').toLowerCase();
                  const estaConcluida = statusLower === 'concluida' || 
                                       statusLower === 'concluída' || 
                                       statusLower.includes('conclu');
                  
                  return (
                    <tr key={agendamentoId}>
                      <td>
                        <strong>{a.aula?.titulo || '-'}</strong>
                      </td>
                      <td>{a.professor?.nome || a.aula?.professor?.nome || '-'}</td>
                      <td>{formatData(a.data_hora)}</td>
                      <td>
                        <Badge status={a.status} />
                        {estaConcluida && !jaAvaliou && (
                          <button 
                            className="btn-avaliar-inline" 
                            onClick={() => handleAvaliar(a)}
                            style={{ marginLeft: '8px', padding: '4px 8px', fontSize: '0.85rem' }}
                          >
                            Avaliar
                          </button>
                        )}
                        {estaConcluida && jaAvaliou && (
                          <span style={{ marginLeft: '8px', fontSize: '0.85rem', color: '#666' }}>
                            ✓ Avaliada
                          </span>
                        )}
                      </td>
                      <td>{a.aula?.preco_decimal ? `R$ ${a.aula.preco_decimal.toFixed(2)}` : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        <section className="section">
          <div className="section-header">
            <h2>Minhas Avaliações</h2>
          </div>

          {avaliacoes.length === 0 ? (
            <div className="empty">Você ainda não fez nenhuma avaliação</div>
          ) : (
            <div className="aval-list">
              {avaliacoes.map(av => {
                const avId = av._id || av.id;
                return (
                  <div key={avId} className="aval-card">
                    <div className="aval-header">
                      <div>
                        <h3>{av.aula?.titulo || av.id_aula?.titulo || 'Aula'}</h3>
                        <p className="prof">Prof. {av.professor?.nome || av.id_prof?.nome || 'N/A'}</p>
                      </div>
                      <div className="nota-badge">
                        <span className="nota-val">{av.nota?.toFixed(1) || '0.0'}</span>/10
                      </div>
                    </div>
                    {av.texto && <p className="aval-texto">{av.texto}</p>}
                    <p className="date">{formatData(av.created_at)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
      <Footer />

      {/* Modal de avaliação usando o componente AvaliacaoForm */}
      {avaliandoAula && (
        <AvaliacaoForm
          agendamento={avaliandoAula}
          onClose={() => setAvaliandoAula(null)}
          onSuccess={handleAvaliacaoConcluida}
        />
      )}
    </>
  );
};

export default DashboardAluno;
