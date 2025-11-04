import React, { useEffect, useState } from 'react';
import HeaderLogado from '../../components/header-logado';
import Footer from '../../components/footer';
import { requireAuth, getUser, getToken } from '../../services/authService';
import { buscarAgendamentosProfessor, buscarAvaliacoesProfessor, buscarStatsProfessor, atualizarStatusAgendamento } from '../../services/apiService';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './dashboard-professor.css';

const DashboardProfessor = () => {
  const user = getUser();
  const [agendamentos, setAgendamentos] = useState([]);
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [stats, setStats] = useState(null);
  const [alunosUnicos, setAlunosUnicos] = useState([]);
  const [graficoData, setGraficoData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periodoGrafico, setPeriodoGrafico] = useState('mes'); // 'mes', 'semana', 'ano'
  const [erro, setErro] = useState(null);
  const [atualizandoStatus, setAtualizandoStatus] = useState({}); // { agendamentoId: true/false }
  const agendamentosCount = agendamentos ? agendamentos.length : 0;

  // Helpers de KPIs (fallback quando API de stats não retornar)
  const calcularNotaMedia = (items) => {
    if (!items || items.length === 0) return 0;
    const soma = items.reduce((acc, a) => acc + (Number(a.nota) || 0), 0);
    return soma / items.length;
  };

  const totalAvaliacoesKPI = (stats?.total_avaliacoes ?? 0) || avaliacoes.length;
  const notaMediaKPI = (stats?.nota_media ?? 0) || calcularNotaMedia(avaliacoes);
  const totalAulasKPI = agendamentos.length;
  const alunosUnicosKPI = alunosUnicos.length;

  useEffect(() => {
    if (!requireAuth()) {
      setLoading(false);
      return;
    }
    
    // Aguardar um pouco para garantir que user está carregado
    const currentUser = getUser();
    if (!currentUser) {
      setLoading(false);
      console.error('Usuário não encontrado');
      return;
    }
    
    // Verificar se user existe e tem ID
    const userId = currentUser._id || currentUser.id;
    if (userId) {
      carregarDados(userId);
    } else {
      setLoading(false);
      console.error('Usuário sem ID válido');
    }
  }, []); // Executar apenas uma vez ao montar

  const carregarDados = async (professorId) => {
    setLoading(true);
    setErro(null);
    try {
      const token = getToken();
      const API = '/api';

      // Buscar agendamentos
      const agendamentosRes = await buscarAgendamentosProfessor(professorId);
      if (agendamentosRes.success && agendamentosRes.data) {
        // Buscar dados completos de aluno e aula para cada agendamento
        const agendamentosCompletos = await Promise.all(
          agendamentosRes.data.map(async (agendamento) => {
            // Função auxiliar para extrair ID
            const extrairId = (obj) => {
              if (!obj) return null;
              if (typeof obj === 'string') return obj;
              if (typeof obj === 'object') {
                return obj._id || obj.id || obj.$oid || null;
              }
              return null;
            };

            let alunoData = agendamento.aluno || agendamento.id_aluno || null;
            let aulaData = agendamento.aula || agendamento.id_aula || null;

            // Buscar dados completos do aluno se necessário
            let alunoId = null;
            if (alunoData) {
              if (typeof alunoData === 'string') {
                // Aluno veio apenas como string ID
                alunoId = alunoData;
                alunoData = null;
              } else if (typeof alunoData === 'object' && !alunoData.nome) {
                // Aluno veio como objeto mas sem nome (apenas ID)
                alunoId = extrairId(alunoData);
                alunoData = null;
              } else if (typeof alunoData === 'object' && alunoData.nome) {
                // Aluno já veio com dados completos - não fazer nada
                alunoId = null;
              }
            }

            // Se não temos dados completos do aluno, buscar pelo ID
            if (!alunoData && alunoId) {
              try {
                const alunoResponse = await fetch(`${API}/alunos/${alunoId}`, {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                });
                if (alunoResponse.ok) {
                  alunoData = await alunoResponse.json();
                  console.log('[dashboard-professor] Dados do aluno buscados:', alunoData);
                } else {
                  console.warn('[dashboard-professor] Erro ao buscar aluno:', alunoResponse.status);
                }
              } catch (err) {
                console.warn('[dashboard-professor] Erro ao buscar dados do aluno:', err);
              }
            }

            // Buscar dados completos da aula se necessário
            let aulaId = null;
            if (aulaData) {
              if (typeof aulaData === 'string') {
                // Aula veio apenas como string ID
                aulaId = aulaData;
                aulaData = null;
              } else if (typeof aulaData === 'object' && !aulaData.titulo) {
                // Aula veio como objeto mas sem título (apenas ID)
                aulaId = extrairId(aulaData);
                aulaData = null;
              } else if (typeof aulaData === 'object' && aulaData.titulo) {
                // Aula já veio com dados completos - não fazer nada
                aulaId = null;
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
                  console.log('[dashboard-professor] Dados da aula buscados:', aulaData);
                } else {
                  console.warn('[dashboard-professor] Erro ao buscar aula:', aulaResponse.status);
                }
              } catch (err) {
                console.warn('[dashboard-professor] Erro ao buscar dados da aula:', err);
              }
            }

            // Log para debug se não encontrou dados
            if (!alunoData || !alunoData.nome) {
              console.warn('[dashboard-professor] Aluno não encontrado para agendamento:', {
                agendamentoId: agendamento._id || agendamento.id,
                alunoData: alunoData,
                alunoId: alunoId || extrairId(agendamento.aluno || agendamento.id_aluno),
                alunoOriginal: agendamento.aluno || agendamento.id_aluno
              });
            }
            if (!aulaData || !aulaData.titulo) {
              console.warn('[dashboard-professor] Aula não encontrada para agendamento:', {
                agendamentoId: agendamento._id || agendamento.id,
                aulaData: aulaData,
                aulaId: aulaId || extrairId(agendamento.aula || agendamento.id_aula),
                aulaOriginal: agendamento.aula || agendamento.id_aula
              });
            }

            return {
              ...agendamento,
              aluno: alunoData,
              aula: aulaData,
            };
          })
        );

        setAgendamentos(agendamentosCompletos);
        
        // Extrair alunos únicos
        const alunosMap = new Map();
        agendamentosCompletos.forEach(agendamento => {
          if (agendamento.aluno) {
            const alunoId = agendamento.aluno.id || agendamento.aluno._id;
            if (alunoId && !alunosMap.has(alunoId)) {
              alunosMap.set(alunoId, {
                id: alunoId,
                nome: agendamento.aluno.nome || 'Aluno',
                email: agendamento.aluno.email || ''
              });
            }
          }
        });
        setAlunosUnicos(Array.from(alunosMap.values()));

        // O gráfico será atualizado pelo useEffect quando agendamentos mudarem
      } else {
        console.warn('Nenhum agendamento encontrado:', agendamentosRes.error);
        setAgendamentos([]);
      }

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

      // Normalizar o ID do professor logado para comparação
      const professorIdNormalizado = normalizarId(professorId);

      // Buscar avaliações
      console.log('[dashboard-professor] Buscando avaliações para professor:', professorId);
      const avaliacoesRes = await buscarAvaliacoesProfessor(professorId);
      console.log('[dashboard-professor] Resposta de avaliações:', avaliacoesRes);
      
      // Filtrar avaliações para garantir que sejam apenas do professor logado
      const avaliacoesArray = avaliacoesRes.success && avaliacoesRes.data 
        ? (Array.isArray(avaliacoesRes.data) ? avaliacoesRes.data : [])
        : [];
      
      const avaliacoesFiltradas = avaliacoesArray.filter(av => {
        // Tentar diferentes formatos do campo id_prof da avaliação
        const avProfId = av.id_prof?._id || av.id_prof?.id || av.id_prof || 
                        av.professor?._id || av.professor?.id || av.professor ||
                        av.id_professor?._id || av.id_professor?.id || av.id_professor;
        const avProfIdNormalizado = normalizarId(avProfId);
        
        // Só incluir se o ID do professor da avaliação corresponder ao professor logado
        const pertenceAoProfessor = avProfIdNormalizado !== null && 
                                    professorIdNormalizado !== null && 
                                    avProfIdNormalizado === professorIdNormalizado;
        
        if (!pertenceAoProfessor && avProfId) {
          console.warn('[dashboard-professor] Avaliação filtrada - não pertence ao professor:', {
            avaliacaoId: av._id || av.id,
            profIdAvaliacao: avProfIdNormalizado,
            profIdLogado: professorIdNormalizado
          });
        }
        
        return pertenceAoProfessor;
      });
      
      console.log('[dashboard-professor] Total de avaliações recebidas do backend:', avaliacoesArray.length);
      console.log('[dashboard-professor] Total de avaliações filtradas:', avaliacoesFiltradas.length);
      setAvaliacoes(avaliacoesFiltradas);

      // Buscar estatísticas
      console.log('[dashboard-professor] Buscando estatísticas para professor:', professorId);
      const statsRes = await buscarStatsProfessor(professorId);
      console.log('[dashboard-professor] Resposta de estatísticas:', statsRes);
      if (statsRes.success && statsRes.data) {
        console.log('[dashboard-professor] Estatísticas recebidas:', statsRes.data);
        // Normalizar dados para aceitar diferentes formatos do backend
        const statsData = statsRes.data;
        const normalizedStats = {
          total_avaliacoes: statsData.total_avaliacoes || statsData.total || 0,
          nota_media: statsData.nota_media || statsData.media || 0,
          nota_min: statsData.nota_min || statsData.min || 0,
          nota_max: statsData.nota_max || statsData.max || 0
        };
        console.log('[dashboard-professor] Estatísticas normalizadas:', normalizedStats);
        setStats(normalizedStats);
      } else {
        console.warn('[dashboard-professor] Estatísticas não disponíveis:', statsRes.error);
        // Criar stats padrão se não encontrar
        setStats({
          total_avaliacoes: 0,
          nota_media: 0,
          nota_min: 0,
          nota_max: 0
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setErro('Erro ao carregar dados. Verifique sua conexão e tente novamente.');
      // Garantir que os estados estejam vazios em caso de erro
      setAgendamentos([]);
      setAvaliacoes([]);
      setStats({
        total_avaliacoes: 0,
        nota_media: 0,
        nota_min: 0,
        nota_max: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const prepararGrafico = (agendamentos) => {
    const agora = new Date();
    const anoAtual = agora.getFullYear();
    const dataMap = new Map();

    // Gerar todos os períodos necessários
    if (periodoGrafico === 'semana') {
      // Todos os dias da semana
      const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      diasSemana.forEach(dia => {
        dataMap.set(dia, 0);
      });
    } else if (periodoGrafico === 'mes') {
      // Todos os meses do ano atual
      for (let mes = 1; mes <= 12; mes++) {
        const chave = `${String(mes).padStart(2, '0')}/${anoAtual}`;
        dataMap.set(chave, 0);
      }
    } else if (periodoGrafico === 'ano') {
      // Últimos 3 anos
      for (let i = 2; i >= 0; i--) {
        const ano = anoAtual - i;
        dataMap.set(`${ano}`, 0);
      }
    }

    // Processar agendamentos e contar
    if (agendamentos && agendamentos.length > 0) {
      agendamentos.forEach(agendamento => {
        if (!agendamento.data_hora) return;
        
        try {
          const dataAula = new Date(agendamento.data_hora);
          if (isNaN(dataAula.getTime())) return; // Data inválida
          
          let chave = '';

          if (periodoGrafico === 'semana') {
            // Obter o dia da semana (0 = Domingo, 1 = Segunda, etc.)
            const diaSemana = dataAula.getDay();
            const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
            chave = diasSemana[diaSemana];
          } else if (periodoGrafico === 'mes') {
            // Apenas meses do ano atual
            const ano = dataAula.getFullYear();
            if (ano === anoAtual) {
              const mes = dataAula.getMonth();
              chave = `${String(mes + 1).padStart(2, '0')}/${ano}`;
            }
          } else if (periodoGrafico === 'ano') {
            // Últimos 3 anos
            const ano = dataAula.getFullYear();
            if (ano >= anoAtual - 2 && ano <= anoAtual) {
              chave = `${ano}`;
            }
          }

          if (chave && dataMap.has(chave)) {
            dataMap.set(chave, (dataMap.get(chave) || 0) + 1);
          }
        } catch (error) {
          console.warn('Erro ao processar data do agendamento:', error);
        }
      });
    }

    // Converter para array e ordenar
    const dados = Array.from(dataMap.entries())
      .map(([periodo, quantidade]) => ({ periodo, quantidade }))
      .sort((a, b) => {
        try {
          if (periodoGrafico === 'semana') {
            // Ordenar por ordem dos dias da semana
            const ordemDias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
            return ordemDias.indexOf(a.periodo) - ordemDias.indexOf(b.periodo);
          } else if (periodoGrafico === 'mes') {
            const [mesA, anoA] = a.periodo.split('/');
            const [mesB, anoB] = b.periodo.split('/');
            return new Date(anoA, mesA - 1) - new Date(anoB, mesB - 1);
          } else {
            return parseInt(a.periodo) - parseInt(b.periodo);
          }
        } catch (error) {
          return 0;
        }
      });

    setGraficoData(dados);
  };

  // Efeito para atualizar gráfico quando período mudar ou quando agendamentos forem carregados
  useEffect(() => {
    // Sempre preparar o gráfico, mesmo sem agendamentos, para mostrar todos os períodos
    prepararGrafico(agendamentos || []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodoGrafico, agendamentosCount]);

  const formatarData = (dataHora) => {
    if (!dataHora) return 'N/A';
    const data = new Date(dataHora);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeClass = (status) => {
    const statusLower = status?.toLowerCase() || '';
    const classes = {
      'agendada': 'status-badge status-agendada',
      'confirmada': 'status-badge status-confirmada',
      'concluida': 'status-badge status-concluida',
      'concluída': 'status-badge status-concluida',
      'cancelada': 'status-badge status-cancelada',
      'ausente': 'status-badge status-ausente'
    };
    return classes[statusLower] || 'status-badge';
  };

  const handleAlterarStatus = async (agendamento, novoStatus) => {
    const agendamentoId = agendamento._id || agendamento.id;
    if (!agendamentoId) {
      alert('ID do agendamento não encontrado');
      return;
    }

    // Confirmação para status concluída
    if (novoStatus === 'concluida' || novoStatus === 'concluída') {
      const confirmar = window.confirm(
        'Tem certeza que deseja marcar este agendamento como concluído? ' +
        'Após isso, o aluno poderá avaliar a aula.'
      );
      if (!confirmar) return;
    }

    setAtualizandoStatus(prev => ({ ...prev, [agendamentoId]: true }));

    try {
      const resultado = await atualizarStatusAgendamento(agendamentoId, novoStatus);
      
      if (resultado.success) {
        // Atualiza o agendamento na lista local
        setAgendamentos(prev => 
          prev.map(ag => 
            (ag._id === agendamentoId || ag.id === agendamentoId)
              ? { ...ag, status: novoStatus }
              : ag
          )
        );
        alert('Status atualizado com sucesso!');
      } else {
        alert(`Erro ao atualizar status: ${resultado.error}`);
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status. Tente novamente.');
    } finally {
      setAtualizandoStatus(prev => ({ ...prev, [agendamentoId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="dashboard-professor-container">
        <HeaderLogado />
        <main className="dashboard-main">
          <div className="dashboard-content">
            <div className="loading-spinner">Carregando...</div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="dashboard-professor-container">
      <HeaderLogado />
      
      <main className="dashboard-main">
        <div className="dashboard-content">
          {erro && (
            <div className="error-message">
              <p>{erro}</p>
            </div>
          )}
          <div className="dashboard-header">
            <div>
              <h1>Dashboard do Professor</h1>
              <p>Bem-vindo, {user?.nome || getUser()?.nome || 'Professor'}!</p>
            </div>
            {stats && (
              <div className="stats-cards">
                <div className="stat-card">
                  <div className="stat-value">{totalAvaliacoesKPI}</div>
                  <div className="stat-label">Avaliações Recebidas</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{notaMediaKPI.toFixed(1)}</div>
                  <div className="stat-label">Nota Média</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{totalAulasKPI}</div>
                  <div className="stat-label">Total de Aulas</div>
                </div>
              </div>
            )}
          </div>

          {/* Gráfico de Aulas */}
          <section className="dashboard-section">
            <div className="section-header">
              <h2>Evolução de Aulas</h2>
              <div className="periodo-selector">
                <button 
                  className={periodoGrafico === 'semana' ? 'active' : ''}
                  onClick={() => setPeriodoGrafico('semana')}
                >
                  Semana
                </button>
                <button 
                  className={periodoGrafico === 'mes' ? 'active' : ''}
                  onClick={() => setPeriodoGrafico('mes')}
                >
                  Mês
                </button>
                <button 
                  className={periodoGrafico === 'ano' ? 'active' : ''}
                  onClick={() => setPeriodoGrafico('ano')}
                >
                  Ano
                </button>
              </div>
            </div>
            <div className="chart-container">
              {graficoData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={graficoData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="periodo" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="quantidade" fill="#0A66C2" name="Aulas" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state">Nenhum dado disponível para o período selecionado</div>
              )}
            </div>
          </section>

          {/* Avaliações */}
          <section className="dashboard-section">
            <h2>Avaliações Recebidas ({avaliacoes.length})</h2>
            {avaliacoes.length > 0 ? (
              <div className="avaliacoes-list">
                {avaliacoes.map((avaliacao) => (
                  <div key={avaliacao._id} className="avaliacao-card">
                    <div className="avaliacao-header">
                      <div className="avaliacao-aluno">
                        <div className="avaliacao-avatar">
                          {avaliacao.aluno?.nome?.charAt(0).toUpperCase() || 'A'}
                        </div>
                        <div>
                          <h3>{avaliacao.aluno?.nome || 'Aluno'}</h3>
                          {avaliacao.aula && (
                            <p className="aula-titulo">{avaliacao.aula.titulo}</p>
                          )}
                        </div>
                      </div>
                      <div className="avaliacao-nota">
                        <span className="nota-badge">{avaliacao.nota}/10</span>
                      </div>
                    </div>
                    {avaliacao.texto && (
                      <p className="avaliacao-texto">"{avaliacao.texto}"</p>
                    )}
                    <div className="avaliacao-data">
                      {avaliacao.created_at && formatarData(avaliacao.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">Nenhuma avaliação ainda</div>
            )}
          </section>

          {/* Agendamentos Recentes */}
          <section className="dashboard-section">
            <h2>Agendamentos Recentes</h2>
            {agendamentos.length > 0 ? (
              <div className="agendamentos-table">
                <table>
                  <thead>
                    <tr>
                      <th>Aluno</th>
                      <th>Aula</th>
                      <th>Data/Hora</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agendamentos.slice(0, 10).map((agendamento) => {
                      const agendamentoId = agendamento._id || agendamento.id;
                      const statusAtual = agendamento.status?.toLowerCase() || '';
                      const estaAtualizando = atualizandoStatus[agendamentoId];
                      const statusOptions = ['agendada', 'confirmada', 'concluida', 'cancelada', 'ausente'];
                      
                      // Buscar nome do aluno em vários lugares possíveis
                      let alunoNome = agendamento.aluno?.nome || 
                                     agendamento.id_aluno?.nome ||
                                     null;
                      
                      // Buscar título da aula em vários lugares possíveis
                      let aulaTitulo = agendamento.aula?.titulo || 
                                      agendamento.id_aula?.titulo ||
                                      null;
                      
                      // Se não encontrou nome, log para debug
                      if (!alunoNome) {
                        console.warn('[dashboard-professor] Nome do aluno não encontrado para agendamento:', {
                          agendamentoId: agendamentoId,
                          aluno: agendamento.aluno,
                          id_aluno: agendamento.id_aluno
                        });
                      }
                      if (!aulaTitulo) {
                        console.warn('[dashboard-professor] Título da aula não encontrado para agendamento:', {
                          agendamentoId: agendamentoId,
                          aula: agendamento.aula,
                          id_aula: agendamento.id_aula
                        });
                      }
                      
                      alunoNome = alunoNome || 'N/A';
                      aulaTitulo = aulaTitulo || 'N/A';
                      
                      return (
                        <tr key={agendamento._id}>
                          <td>{alunoNome}</td>
                          <td>{aulaTitulo}</td>
                          <td>{formatarData(agendamento.data_hora)}</td>
                          <td>
                            <span className={getStatusBadgeClass(agendamento.status)}>
                              {agendamento.status || 'N/A'}
                            </span>
                          </td>
                          <td>
                            <select
                              className="status-select"
                              value={statusAtual}
                              onChange={(e) => handleAlterarStatus(agendamento, e.target.value)}
                              disabled={estaAtualizando}
                              title="Alterar status do agendamento"
                            >
                              {statusOptions.map(opt => (
                                <option key={opt} value={opt}>
                                  {opt === 'concluida' ? 'Concluída' : opt.charAt(0).toUpperCase() + opt.slice(1)}
                                </option>
                              ))}
                            </select>
                            {estaAtualizando && (
                              <span className="status-updating">Atualizando...</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">Nenhum agendamento ainda</div>
            )}
          </section>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default DashboardProfessor;
