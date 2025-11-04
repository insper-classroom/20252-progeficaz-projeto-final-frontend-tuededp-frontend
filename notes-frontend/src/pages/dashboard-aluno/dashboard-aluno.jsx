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

      // Normalizar o ID do aluno logado para comparação
      const alunoIdNormalizado = normalizarId(alunoId);
      
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
                
                // Função auxiliar para extrair ID do professor de diferentes formatos
                const extrairIdProfessor = (prof) => {
                  if (!prof) return null;
                  if (typeof prof === 'string') return prof;
                  if (typeof prof === 'object') {
                    return prof._id || prof.id || prof.$oid || null;
                  }
                  return null;
                };
                
                // Tentar obter dados do professor de várias fontes
                let professorData = agendamento.professor || aulaData.professor || aulaData.id_prof || 
                                  aulaData.id_professor || aulaData.professor_id || null;
                
                // Extrair ID do professor se necessário
                let profId = null;
                if (professorData) {
                  if (typeof professorData === 'string') {
                    // Professor veio apenas como string ID
                    profId = professorData;
                    professorData = null;
                  } else if (typeof professorData === 'object' && !professorData.nome) {
                    // Professor veio como objeto mas sem nome (apenas ID)
                    profId = extrairIdProfessor(professorData);
                    professorData = null;
                  } else if (typeof professorData === 'object' && professorData.nome) {
                    // Professor já veio com dados completos
                    return {
                      ...agendamento,
                      aula: aulaData,
                      professor: professorData,
                    };
                  }
                }
                
                // Se não temos dados completos, buscar pelo ID
                if (!professorData && profId) {
                  try {
                    const profResponse = await fetch(`${API}/professores/${profId}`, {
                      headers: {
                        Authorization: `Bearer ${token}`,
                      },
                    });
                    if (profResponse.ok) {
                      professorData = await profResponse.json();
                      console.log('[dashboard-aluno] Dados do professor buscados:', professorData);
                    } else {
                      console.warn('[dashboard-aluno] Erro ao buscar professor:', profResponse.status);
                    }
                  } catch (err) {
                    console.warn('[dashboard-aluno] Erro ao buscar dados do professor:', err);
                  }
                }
                
                // Log para debug
                if (!professorData || !professorData.nome) {
                  console.warn('[dashboard-aluno] Professor não encontrado para agendamento:', {
                    agendamentoId: agendamento._id || agendamento.id,
                    aulaId: aulaId,
                    professorData: professorData,
                    profId: profId,
                    aulaData: aulaData
                  });
                }
                
                return {
                  ...agendamento,
                  aula: aulaData,
                  professor: professorData,
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
      
      // Filtrar avaliações para garantir que sejam apenas do aluno logado
      const avaliacoesArray = Array.isArray(avaliacoesData) ? avaliacoesData : [];
      const avaliacoesFiltradas = avaliacoesArray.filter(av => {
        // Tentar diferentes formatos do campo id_aluno da avaliação
        const avAlunoId = av.id_aluno?._id || av.id_aluno?.id || av.id_aluno || 
                         av.aluno?._id || av.aluno?.id || av.aluno;
        const avAlunoIdNormalizado = normalizarId(avAlunoId);
        
        // Só incluir se o ID do aluno da avaliação corresponder ao aluno logado
        const pertenceAoAluno = avAlunoIdNormalizado !== null && 
                                alunoIdNormalizado !== null && 
                                avAlunoIdNormalizado === alunoIdNormalizado;
        
        if (!pertenceAoAluno && avAlunoId) {
          console.warn('[dashboard-aluno] Avaliação filtrada - não pertence ao aluno:', {
            avaliacaoId: av._id || av.id,
            alunoIdAvaliacao: avAlunoIdNormalizado,
            alunoIdLogado: alunoIdNormalizado
          });
        }
        
        return pertenceAoAluno;
      });
      
      // Buscar dados completos do professor e da aula para cada avaliação
      const avaliacoesCompletas = await Promise.all(
        avaliacoesFiltradas.map(async (avaliacao) => {
          // Função auxiliar para extrair ID do professor de diferentes formatos
          const extrairIdProfessor = (prof) => {
            if (!prof) return null;
            if (typeof prof === 'string') return prof;
            if (typeof prof === 'object') {
              return prof._id || prof.id || prof.$oid || null;
            }
            return null;
          };

          // Função auxiliar para extrair ID da aula
          const extrairIdAula = (aula) => {
            if (!aula) return null;
            if (typeof aula === 'string') return aula;
            if (typeof aula === 'object') {
              return aula._id || aula.id || aula.$oid || null;
            }
            return null;
          };

          // Tentar obter dados do professor de várias fontes
          let professorData = avaliacao.professor || avaliacao.id_prof || 
                            avaliacao.id_professor || avaliacao.professor_id || null;
          
          // Extrair ID do professor se necessário
          let profId = null;
          if (professorData) {
            if (typeof professorData === 'string') {
              // Professor veio apenas como string ID
              profId = professorData;
              professorData = null;
            } else if (typeof professorData === 'object' && !professorData.nome) {
              // Professor veio como objeto mas sem nome (apenas ID)
              profId = extrairIdProfessor(professorData);
              professorData = null;
            } else if (typeof professorData === 'object' && professorData.nome) {
              // Professor já veio com dados completos
              // Não fazer nada, já temos os dados
            }
          }

          // Se não temos dados completos do professor, buscar pelo ID
          if (!professorData && profId) {
            try {
              const profResponse = await fetch(`${API}/professores/${profId}`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });
              if (profResponse.ok) {
                professorData = await profResponse.json();
                console.log('[dashboard-aluno] Dados do professor buscados para avaliação:', professorData);
              } else {
                console.warn('[dashboard-aluno] Erro ao buscar professor para avaliação:', profResponse.status);
              }
            } catch (err) {
              console.warn('[dashboard-aluno] Erro ao buscar dados do professor para avaliação:', err);
            }
          }

          // Tentar obter dados da aula de várias fontes
          let aulaData = avaliacao.aula || avaliacao.id_aula || null;

          // Extrair ID da aula se necessário
          let aulaId = null;
          if (aulaData) {
            if (typeof aulaData === 'string') {
              // Aula veio apenas como string ID
              aulaId = aulaData;
              aulaData = null;
            } else if (typeof aulaData === 'object' && !aulaData.titulo) {
              // Aula veio como objeto mas sem título (apenas ID)
              aulaId = extrairIdAula(aulaData);
              aulaData = null;
            } else if (typeof aulaData === 'object' && aulaData.titulo) {
              // Aula já veio com dados completos
              // Verificar se tem professor dentro da aula
              if (!professorData && aulaData.professor) {
                const aulaProfId = extrairIdProfessor(aulaData.professor || aulaData.id_prof);
                if (aulaProfId && typeof aulaData.professor === 'object' && aulaData.professor.nome) {
                  professorData = aulaData.professor;
                } else if (aulaProfId) {
                  // Tentar buscar professor da aula
                  try {
                    const profResponse = await fetch(`${API}/professores/${aulaProfId}`, {
                      headers: {
                        Authorization: `Bearer ${token}`,
                      },
                    });
                    if (profResponse.ok) {
                      professorData = await profResponse.json();
                      console.log('[dashboard-aluno] Dados do professor buscados da aula:', professorData);
                    }
                  } catch (err) {
                    console.warn('[dashboard-aluno] Erro ao buscar professor da aula:', err);
                  }
                }
              }
              // Não fazer nada, já temos os dados
            }
          }

          // Se não temos dados completos da aula, buscar pelo ID
          if (!aulaData && aulaId) {
            try {
              const aulaResponse = await fetch(`${API}/aulas/${aulaId}`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });
              if (aulaResponse.ok) {
                aulaData = await aulaResponse.json();
                console.log('[dashboard-aluno] Dados da aula buscados para avaliação:', aulaData);
                
                // Se não temos dados do professor ainda, tentar pegar da aula
                if (!professorData && aulaData.professor) {
                  const aulaProfId = extrairIdProfessor(aulaData.professor || aulaData.id_prof);
                  if (aulaProfId && typeof aulaData.professor === 'object' && aulaData.professor.nome) {
                    professorData = aulaData.professor;
                  } else if (aulaProfId) {
                    // Tentar buscar professor da aula
                    try {
                      const profResponse = await fetch(`${API}/professores/${aulaProfId}`, {
                        headers: {
                          Authorization: `Bearer ${token}`,
                        },
                      });
                      if (profResponse.ok) {
                        professorData = await profResponse.json();
                        console.log('[dashboard-aluno] Dados do professor buscados da aula:', professorData);
                      }
                    } catch (err) {
                      console.warn('[dashboard-aluno] Erro ao buscar professor da aula:', err);
                    }
                  }
                }
              } else {
                console.warn('[dashboard-aluno] Erro ao buscar aula para avaliação:', aulaResponse.status);
              }
            } catch (err) {
              console.warn('[dashboard-aluno] Erro ao buscar dados da aula para avaliação:', err);
            }
          }

          // Log para debug se não encontrou dados
          if (!professorData || !professorData.nome) {
            console.warn('[dashboard-aluno] Professor não encontrado para avaliação:', {
              avaliacaoId: avaliacao._id || avaliacao.id,
              professorData: professorData,
              profId: profId,
              aulaData: aulaData
            });
          }

          return {
            ...avaliacao,
            professor: professorData,
            aula: aulaData,
          };
        })
      );
      
      setAvaliacoes(avaliacoesCompletas);

      console.log('[dashboard-aluno] Agendamentos carregados:', agendamentosCompletos.length);
      console.log('[dashboard-aluno] Avaliações carregadas (filtradas):', avaliacoesFiltradas.length);
      console.log('[dashboard-aluno] Avaliações completas (com dados de professor/aula):', avaliacoesCompletas.length);
      console.log('[dashboard-aluno] Avaliações totais recebidas do backend:', avaliacoesArray.length);
      console.log('[dashboard-aluno] Dados de avaliações completas:', avaliacoesCompletas);

      const agora = new Date();

      // Identificar aulas concluídas que ainda não foram avaliadas
      // Usar avaliacoesCompletas para garantir que só considere avaliações do aluno logado
      const idsAvaliadas = new Set(
        avaliacoesCompletas.map(av => {
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
                  
                  // Buscar nome do professor em vários lugares possíveis
                  let professorNome = a.professor?.nome || 
                                     a.aula?.professor?.nome || 
                                     a.aula?.id_prof?.nome ||
                                     a.aula?.id_professor?.nome ||
                                     a.aula?.professor_id?.nome ||
                                     a.id_prof?.nome ||
                                     null;
                  
                  // Se não encontrou nome, log para debug
                  if (!professorNome) {
                    console.warn('[dashboard-aluno] Nome do professor não encontrado para agendamento:', {
                      agendamentoId: agendamentoId,
                      professor: a.professor,
                      aula: a.aula,
                      id_prof: a.id_prof
                    });
                  }
                  
                  professorNome = professorNome || '-';
                  
                  return (
                    <tr key={agendamentoId}>
                      <td>
                        <strong>{a.aula?.titulo || '-'}</strong>
                      </td>
                      <td>{professorNome}</td>
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
                
                // Buscar nome do professor em vários lugares possíveis
                let professorNome = av.professor?.nome || 
                                   av.id_prof?.nome ||
                                   av.id_professor?.nome ||
                                   av.professor_id?.nome ||
                                   av.aula?.professor?.nome ||
                                   av.aula?.id_prof?.nome ||
                                   av.aula?.id_professor?.nome ||
                                   av.aula?.professor_id?.nome ||
                                   null;
                
                // Buscar título da aula em vários lugares possíveis
                let aulaTitulo = av.aula?.titulo || 
                                av.id_aula?.titulo ||
                                null;
                
                // Se não encontrou nome, log para debug
                if (!professorNome) {
                  console.warn('[dashboard-aluno] Nome do professor não encontrado para avaliação:', {
                    avaliacaoId: avId,
                    professor: av.professor,
                    id_prof: av.id_prof,
                    aula: av.aula
                  });
                }
                
                professorNome = professorNome || 'N/A';
                aulaTitulo = aulaTitulo || 'Aula';
                
                return (
                  <div key={avId} className="aval-card">
                    <div className="aval-header">
                      <div>
                        <h3>{aulaTitulo}</h3>
                        <p className="prof">Prof. {professorNome}</p>
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
