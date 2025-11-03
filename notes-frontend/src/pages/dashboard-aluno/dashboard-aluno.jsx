import { useState, useEffect } from 'react';
import './dashboard-aluno.css';
import HeaderLogado from '../../components/header-logado';
import Footer from '../../components/footer';

const DashboardAluno = () => {
  const [stats, setStats] = useState({ agendadas: 0, concluidas: 0, paraAvaliar: 0, proximas: 0 });
  const [agendamentos, setAgendamentos] = useState([]);
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [aulasParaAvaliar, setAulasParaAvaliar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [modalAberto, setModalAberto] = useState(false);
  const [aulaAtual, setAulaAtual] = useState(null);
  const [nota, setNota] = useState(5);
  const [texto, setTexto] = useState('');

  const API = '/api';
  const ID_ALUNO = 'USUARIO_LOGADO_ID'; // TODO: Pegar do contexto/auth

  useEffect(() => { carregarDados(); }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [resAgenda, resAval] = await Promise.all([
        fetch(`${API}/agenda?aluno=${ID_ALUNO}&limit=100`),
        fetch(`${API}/avaliacoes?aluno=${ID_ALUNO}&limit=100`)
      ]);
      
      const agenda = (await resAgenda.json()).data || [];
      const avals = (await resAval.json()).data || [];
      
      setAgendamentos(agenda);
      setAvaliacoes(avals);

      const agora = new Date();
      const idsAvaliadas = new Set(avals.map(a => a.id_aula));
      const concluidasSemAval = agenda.filter(a => a.status === 'concluida' && !idsAvaliadas.has(a.id_aula));
      
      setAulasParaAvaliar(concluidasSemAval);
      setStats({
        agendadas: agenda.filter(a => ['agendada', 'confirmada'].includes(a.status) && new Date(a.data_hora) > agora).length,
        concluidas: agenda.filter(a => a.status === 'concluida').length,
        paraAvaliar: concluidasSemAval.length,
        proximas: agenda.filter(a => ['agendada', 'confirmada'].includes(a.status) && new Date(a.data_hora) > agora).slice(0, 3).length
      });
    } catch (e) {
      console.error('Erro ao carregar dados:', e);
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = (aula) => {
    setAulaAtual(aula);
    setModalAberto(true);
    setNota(5);
    setTexto('');
  };

  const enviarAvaliacao = async () => {
    if (!aulaAtual) return;
    try {
      const res = await fetch(`${API}/avaliacoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_aluno: aulaAtual.id_aluno,
          id_aula: aulaAtual.id_aula,
          id_prof: aulaAtual.id_professor,
          nota: parseFloat(nota),
          texto
        })
      });
      if (res.ok) {
        alert('Avaliação enviada!');
        setModalAberto(false);
        carregarDados();
      } else {
        alert('Erro ao enviar avaliação');
      }
    } catch (e) {
      console.error('Erro ao enviar avaliação:', e);
      alert('Erro ao enviar avaliação');
    }
  };

  const formatData = (d) => new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

  const Badge = ({ status }) => {
    const map = { agendada: 'agendada', confirmada: 'confirmada', concluida: 'concluida', cancelada: 'cancelada', ausente: 'ausente' };
    return <span className={`badge badge-${map[status] || 'default'}`}>{status}</span>;
  };

  const filtrados = filtroStatus === 'todos' ? agendamentos : agendamentos.filter(a => a.status === filtroStatus);

  if (loading) return <div className="dashboard-aluno"><div className="loading">Carregando...</div></div>;

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
              <div key={a.id} className="aula-card">
                <div>
                  <h3>{a.aula?.titulo || 'Aula'}</h3>
                  <p className="prof">Prof. {a.professor?.nome}</p>
                  <p className="date">{formatData(a.data_hora)}</p>
                </div>
                <button className="btn-avaliar" onClick={() => abrirModal(a)}>
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
              {filtrados.map(a => (
                <tr key={a.id}>
                  <td>
                    <strong>{a.aula?.titulo || '-'}</strong>
                  </td>
                  <td>{a.professor?.nome || '-'}</td>
                  <td>{formatData(a.data_hora)}</td>
                  <td>
                    <Badge status={a.status} />
                  </td>
                  <td>{a.aula?.preco_decimal ? `R$ ${a.aula.preco_decimal.toFixed(2)}` : '-'}</td>
                </tr>
              ))}
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
            {avaliacoes.map(av => (
              <div key={av.id} className="aval-card">
                <div className="aval-header">
                  <div>
                    <h3>{av.aula?.titulo || 'Aula'}</h3>
                    <p className="prof">Prof. {av.professor?.nome}</p>
                  </div>
                  <div className="nota-badge">
                    <span className="nota-val">{av.nota.toFixed(1)}</span>/10
                  </div>
                </div>
                {av.texto && <p className="aval-texto">{av.texto}</p>}
                <p className="date">{formatData(av.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {modalAberto && (
        <div className="modal-overlay" onClick={() => setModalAberto(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Avaliar Aula</h2>
              <button onClick={() => setModalAberto(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="aula-info">
                <h3>{aulaAtual?.aula?.titulo}</h3>
                <p>Prof. {aulaAtual?.professor?.nome}</p>
              </div>

              <div className="form-group">
                <label>Nota (0 a 10)</label>
                <div className="nota-container">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    value={nota}
                    onChange={e => setNota(e.target.value)}
                  />
                  <span className="nota-display">{nota}</span>
                </div>
              </div>

              <div className="form-group">
                <label>Comentário (opcional)</label>
                <textarea
                  value={texto}
                  onChange={e => setTexto(e.target.value)}
                  placeholder="Sua experiência..."
                  rows="4"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-sec" onClick={() => setModalAberto(false)}>
                Cancelar
              </button>
              <button className="btn-pri" onClick={enviarAvaliacao}>
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    <Footer />
  </>
);

};

export default DashboardAluno;