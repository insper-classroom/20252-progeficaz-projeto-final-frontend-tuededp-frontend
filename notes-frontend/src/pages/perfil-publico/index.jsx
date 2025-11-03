import React from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import HeaderLogado from "../../components/header-logado";
import Footer from "../../components/footer";
import { getToken } from "../../services/authService";
import AgendarAula from "../../components/agendar-aula";
import { getUser, getTipo } from "../../services/authService";
import { getEstatisticasProfessor, listarAvaliacoes } from "../../services/avaliacoesService";

import "./index.css";

const API_BASE_URL = 'http://localhost:5000';

/* ===== helpers ===== */
function isAluno() {
  const tipoAuth = getTipo();
  if (tipoAuth && tipoAuth.toLowerCase() === "aluno") return true;

  const me = getUser() || {};
  if (me.tipo && me.tipo.toLowerCase() === "aluno") return true;

  const tipoStorage = localStorage.getItem("tipo");
  if (tipoStorage && tipoStorage.toLowerCase() === "aluno") return true;

  return false;
}
function normalizeId(any) {
  if (!any) return null;
  if (typeof any === "string") return any;
  if (typeof any === "object") {
    if (any.$oid) return any.$oid;
    if (any._id?.$oid) return any._id.$oid;
    if (typeof any._id === "string") return any._id;
  }
  try { return String(any); } catch { return null; }
}

export default function PerfilPublico(){
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [usuario, setUsuario] = React.useState(null);
  const [err, setErr] = React.useState("");
  const [mostrarAgendar, setMostrarAgendar] = React.useState(false);
  const [statsAvaliacoes, setStatsAvaliacoes] = React.useState(null);
  const [avaliacoes, setAvaliacoes] = React.useState([]);

  const isProfessor = location.pathname.startsWith("/professor/");
  const me = getUser();

  React.useEffect(()=>{
    (async ()=>{
      try{
        let r;
        let data;
        if (isProfessor) {
          // professor por slug → fallback por id com bearer
          r = await fetch(`${API_BASE_URL}/api/professores/slug/${slug}`);
          if (!r.ok) {
            const tk = getToken();
            const headers = tk ? { Authorization: `Bearer ${tk}` } : {};
            r = await fetch(`${API_BASE_URL}/api/professores/${slug}`, { headers });
          }
        } else {
          // aluno por slug → fallback por id com bearer (usa proxy do Vite)
          r = await fetch(`/api/alunos/slug/${slug}`);
          if (!r.ok) {
            const tk = getToken();
            const headers = tk ? { Authorization: `Bearer ${tk}` } : {};
            r = await fetch(`/api/alunos/${slug}`, { headers });
          }
        }

        if (!r || !r.ok) throw new Error("Perfil não encontrado");
        data = await r.json();
        setUsuario(data);

        // Se for professor, busca estatísticas e lista de avaliações
        if (isProfessor && data._id) {
          try {
            // Busca estatísticas
            const stats = await getEstatisticasProfessor(data._id);
            setStatsAvaliacoes(stats);
            
            // Busca lista de avaliações
            const avaliacoesList = await listarAvaliacoes({ id_prof: data._id });
            setAvaliacoes(Array.isArray(avaliacoesList) ? avaliacoesList : []);
          } catch (e) {
            console.error("[perfil-publico] Erro ao buscar avaliações:", e);
            setAvaliacoes([]);
          }
        }
      } catch (e) {
        setErr(e.message || "Perfil não encontrado");
      }
    })();
  },[slug, isProfessor]);

  const handleAgendarClick = () => {
    const user = getUser();
    if (!user) {
      alert("Você precisa estar logado como aluno para agendar uma aula.");
      return;
    }
    if (!isAluno()) {
      alert("Apenas alunos podem agendar aulas.");
      return;
    }
    setMostrarAgendar(true);
  };

  const iniciarConversa = () => {
    const targetId = normalizeId(usuario?._id);
    if (!targetId) {
      return alert("Não foi possível identificar o usuário para iniciar a conversa.");
    }
    if (!me) {
      alert("Você precisa estar logado para iniciar uma conversa.");
      const next = `/chats?to=${targetId}`;
      return navigate(`/login?next=${encodeURIComponent(next)}`);
    }
    if (normalizeId(me?._id) === targetId) {
      return alert("Você já está no seu próprio perfil 😉");
    }
    // Rota correta é /chats
    navigate(`/chats?to=${targetId}`);
  };

  if(err) return <div className="container">{err}</div>;
  if(!usuario) return <div className="container">Carregando…</div>;

  return (
    <div className="perfil-publico">
      <HeaderLogado />
      <main className="pp-main">
        {/* banner */}
        {usuario.banner_url && (
          <div className="pp-banner" style={{backgroundImage:`url(${usuario.banner_url})`}} />
        )}
        <section className="pp-card pp-header">
          <img className="pp-avatar" src={usuario.avatar_url || "/avatar-placeholder.png"} alt={usuario.nome}/>
          <div className="pp-id">
            <h1>{usuario.nome}</h1>
            {usuario.headline && <p className="pp-headline">{usuario.headline}</p>}
            {usuario.endereco?.cidade && <p className="pp-local">{usuario.endereco.cidade} • {usuario.endereco.estado}</p>}
            <div className="pp-actions">
              {isProfessor ? (
                <>
                  <button className="btn btn--primary" onClick={handleAgendarClick}>
                    Agendar Aula
                  </button>
                  <button
                    className="btn btn--outline"
                    onClick={iniciarConversa}
                    disabled={!usuario?._id}
                  >
                    Iniciar conversa
                  </button>
                </>
              ) : (
                <button
                  className="btn btn--primary"
                  onClick={iniciarConversa}
                  disabled={!usuario?._id}
                >
                  Iniciar conversa
                </button>
              )}
            </div>
          </div>
        </section>

        <div className="pp-grid">
          {/* Média de Avaliações (apenas para professores) */}
          {isProfessor && (
            <section className="pp-card">
              <h3>Avaliações</h3>
              {statsAvaliacoes ? (
                <div className="pp-avaliacoes">
                  <div className="pp-avaliacao-media">
                    <span className="pp-avaliacao-numero">
                      {statsAvaliacoes.media ? statsAvaliacoes.media.toFixed(1) : "N/A"}
                    </span>
                    <span className="pp-avaliacao-max">/ 10</span>
                  </div>
                  {statsAvaliacoes.total && (
                    <p className="pp-avaliacao-total">
                      {statsAvaliacoes.total} avaliação{statsAvaliacoes.total !== 1 ? "ões" : ""}
                    </p>
                  )}
                </div>
              ) : (
                <p className="pp-small muted">Nenhuma avaliação ainda</p>
              )}
              
              {/* Lista de avaliações individuais */}
              {avaliacoes.length > 0 && (
                <div className="pp-avaliacoes-list" style={{ marginTop: "1.5rem" }}>
                  <h4 style={{ marginBottom: "1rem", fontSize: "1rem" }}>Avaliações Recebidas</h4>
                  {avaliacoes.map((avaliacao) => (
                    <div key={avaliacao._id || avaliacao.id} className="pp-avaliacao-item" style={{
                      padding: "1rem",
                      marginBottom: "0.75rem",
                      backgroundColor: "#f8f9fa",
                      borderRadius: "8px",
                      borderLeft: "3px solid #0A66C2"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                        <div>
                          <strong style={{ display: "block" }}>
                            {avaliacao.aluno?.nome || avaliacao.id_aluno?.nome || "Aluno"}
                          </strong>
                          {avaliacao.aula?.titulo || avaliacao.id_aula?.titulo ? (
                            <span style={{ fontSize: "0.875rem", color: "#666" }}>
                              {avaliacao.aula?.titulo || avaliacao.id_aula?.titulo}
                            </span>
                          ) : null}
                        </div>
                        <span style={{
                          fontSize: "1.25rem",
                          fontWeight: "bold",
                          color: "#0A66C2"
                        }}>
                          {avaliacao.nota}/10
                        </span>
                      </div>
                      {avaliacao.texto && (
                        <p style={{ margin: 0, fontSize: "0.9rem", color: "#333" }}>
                          "{avaliacao.texto}"
                        </p>
                      )}
                      {avaliacao.created_at && (
                        <p style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "#999" }}>
                          {new Date(avaliacao.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          <section className="pp-card">
            <h3>Sobre</h3>
            <p className="pp-bio">{usuario.bio || usuario.historico_academico_profissional || "Sem biografia."}</p>
          </section>

          {!isProfessor && (
            <>
              <section className="pp-card">
                <h3>Especializações</h3>
                <Chips items={usuario.especializacoes} />
              </section>

              <section className="pp-card">
                <h3>Quero ensinar</h3>
                <Chips items={usuario.quer_ensinar} />
              </section>

              <section className="pp-card">
                <h3>Quero aprender</h3>
                <Chips items={usuario.quer_aprender} />
              </section>
            </>
          )}

          {isProfessor && (
            <section className="pp-card">
              <h3>Histórico Acadêmico e Profissional</h3>
              <p className="pp-bio">{usuario.historico_academico_profissional || "Sem informações."}</p>
            </section>
          )}

          <section className="pp-card">
            <h3>Disponibilidade</h3>
            <p className="pp-small">
              {usuario.disponibilidade?.timezone ? (
                <>Fuso: {usuario.disponibilidade.timezone}<br/></>
              ) : (
                <>Fuso: America/Sao_Paulo<br/></>
              )}
              {usuario.disponibilidade?.dias?.length ? `Dias: ${usuario.disponibilidade.dias.join(", ")}` : ""}
              {usuario.disponibilidade?.horarios?.length ? ` | Horários: ${usuario.disponibilidade.horarios.join(", ")}` : ""}
            </p>
            {typeof usuario.valor_hora === "number" && <p className="pp-small">Valor/hora: <b>R$ {usuario.valor_hora}</b></p>}
            {usuario.modalidades?.length ? <p className="pp-small">Modalidades: {usuario.modalidades.join(", ")}</p> : null}
          </section>

          {!isProfessor && (usuario.projetos?.length) ? (
            <section className="pp-card">
              <h3>Projetos</h3>
              <ul className="pp-list">
                {usuario.projetos.map((p,i)=>(
                  <li key={i}>
                    <div className="pp-list-title">{p.titulo}</div>
                    {p.resumo && <div className="pp-list-desc">{p.resumo}</div>}
                    {p.link && <a className="pp-link" href={p.link} target="_blank" rel="noreferrer">ver</a>}
                  </li>
                ))}
              </ul>
            </section>
          ):null}

          <section className="pp-card">
            <h3>Links</h3>
            <ul className="pp-links">
              {usuario.links?.linkedin && <li><a href={usuario.links.linkedin} target="_blank" rel="noreferrer">LinkedIn</a></li>}
              {usuario.links?.github && <li><a href={usuario.links.github} target="_blank" rel="noreferrer">GitHub</a></li>}
              {usuario.links?.site && <li><a href={usuario.links.site} target="_blank" rel="noreferrer">Site/Portfólio</a></li>}
            </ul>
          </section>
        </div>
      </main>
      <Footer />
      {mostrarAgendar && usuario._id && (
        <AgendarAula
          professor={usuario}
          onClose={() => setMostrarAgendar(false)}
          onSuccess={() => {
            setMostrarAgendar(false);
            alert("Aula agendada com sucesso!");
          }}
        />
      )}
    </div>
  );
}

function Chips({items}){
  if(!items || !items.length) return <p className="pp-small muted">Sem itens.</p>;
  return (
    <div className="pp-chips">
      {items.map((t,i)=><span key={i} className="pp-chip">{t}</span>)}
    </div>
  );
}