import React, { useEffect, useState } from 'react';
import HeaderLogado from '../../components/header-logado';
import Footer from '../../components/footer';
import { requireAuth, getUser } from '../../services/authService';
import { buscarAgendamentosProfessor, buscarAvaliacoesProfessor, buscarStatsProfessor } from '../../services/apiService';
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
  const agendamentosCount = agendamentos ? agendamentos.length : 0;

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

      // Buscar agendamentos
      const agendamentosRes = await buscarAgendamentosProfessor(professorId);
      if (agendamentosRes.success && agendamentosRes.data) {
        setAgendamentos(agendamentosRes.data);
        
        // Extrair alunos únicos
        const alunosMap = new Map();
        agendamentosRes.data.forEach(agendamento => {
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

      // Buscar avaliações
      const avaliacoesRes = await buscarAvaliacoesProfessor(professorId);
      if (avaliacoesRes.success && avaliacoesRes.data) {
        setAvaliacoes(avaliacoesRes.data);
      } else {
        console.warn('Nenhuma avaliação encontrada:', avaliacoesRes.error);
        setAvaliacoes([]);
      }

      // Buscar estatísticas
      const statsRes = await buscarStatsProfessor(professorId);
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      } else {
        console.warn('Estatísticas não disponíveis:', statsRes.error);
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
    if (!agendamentos || agendamentos.length === 0) {
      setGraficoData([]);
      return;
    }

    const agora = new Date();
    const dataMap = new Map();

    agendamentos.forEach(agendamento => {
      if (!agendamento.data_hora) return;
      
      try {
        const dataAula = new Date(agendamento.data_hora);
        if (isNaN(dataAula.getTime())) return; // Data inválida
        
        let chave = '';

        if (periodoGrafico === 'semana') {
          // Últimas 7 semanas
          const diffTime = agora - dataAula;
          const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
          if (diffWeeks >= 0 && diffWeeks < 7) {
            chave = `${7 - diffWeeks} semanas atrás`;
          }
        } else if (periodoGrafico === 'mes') {
          // Últimos 6 meses
          const ano = dataAula.getFullYear();
          const mes = dataAula.getMonth();
          chave = `${String(mes + 1).padStart(2, '0')}/${ano}`;
        } else if (periodoGrafico === 'ano') {
          // Últimos 3 anos
          chave = `${dataAula.getFullYear()}`;
        }

        if (chave) {
          dataMap.set(chave, (dataMap.get(chave) || 0) + 1);
        }
      } catch (error) {
        console.warn('Erro ao processar data do agendamento:', error);
      }
    });

    // Converter para array e ordenar
    const dados = Array.from(dataMap.entries())
      .map(([periodo, quantidade]) => ({ periodo, quantidade }))
      .sort((a, b) => {
        try {
          if (periodoGrafico === 'semana') {
            return parseInt(a.periodo) - parseInt(b.periodo);
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
    if (agendamentosCount > 0 && agendamentos) {
      prepararGrafico(agendamentos);
    } else {
      setGraficoData([]);
    }
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
    const classes = {
      'agendada': 'status-badge status-agendada',
      'confirmada': 'status-badge status-confirmada',
      'concluida': 'status-badge status-concluida',
      'cancelada': 'status-badge status-cancelada',
      'ausente': 'status-badge status-ausente'
    };
    return classes[status] || 'status-badge';
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
                  <div className="stat-value">{stats.total_avaliacoes || 0}</div>
                  <div className="stat-label">Avaliações Recebidas</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.nota_media ? stats.nota_media.toFixed(1) : '0.0'}</div>
                  <div className="stat-label">Nota Média</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{agendamentos.length}</div>
                  <div className="stat-label">Total de Aulas</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{alunosUnicos.length}</div>
                  <div className="stat-label">Alunos Únicos</div>
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

          {/* Lista de Alunos */}
          <section className="dashboard-section">
            <h2>Meus Alunos ({alunosUnicos.length})</h2>
            {alunosUnicos.length > 0 ? (
              <div className="alunos-grid">
                {alunosUnicos.map((aluno) => (
                  <div key={aluno.id} className="aluno-card">
                    <div className="aluno-avatar">
                      {aluno.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="aluno-info">
                      <h3>{aluno.nome}</h3>
                      <p>{aluno.email}</p>
                      <span className="aulas-count">
                        {agendamentos.filter(a => {
                      const alunoId = a.aluno?.id || a.aluno?._id;
                      return alunoId === aluno.id;
                    }).length} aula(s) agendada(s)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">Nenhum aluno ainda</div>
            )}
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
                    </tr>
                  </thead>
                  <tbody>
                    {agendamentos.slice(0, 10).map((agendamento) => (
                      <tr key={agendamento._id}>
                        <td>{agendamento.aluno?.nome || 'N/A'}</td>
                        <td>{agendamento.aula?.titulo || 'N/A'}</td>
                        <td>{formatarData(agendamento.data_hora)}</td>
                        <td>
                          <span className={getStatusBadgeClass(agendamento.status)}>
                            {agendamento.status || 'N/A'}
                          </span>
                        </td>
                      </tr>
                    ))}
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
