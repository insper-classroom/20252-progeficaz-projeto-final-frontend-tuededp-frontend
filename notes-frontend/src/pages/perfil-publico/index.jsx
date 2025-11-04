import React from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import HeaderLogado from "../../components/header-logado";
import Footer from "../../components/footer";
import { getToken, getUser, getTipo } from "../../services/authService";
import AgendarAula from "../../components/agendar-aula";
import { getEstatisticasProfessor, listarAvaliacoes } from "../../services/avaliacoesService";
import "./index.css";

const API_BASE_URL = "http://localhost:5000";

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
  try {
    return String(any);
  } catch {
    return null;
  }
}

export default function PerfilPublico() {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [usuario, setUsuario] = React.useState(null);
  const [err, setErr] = React.useState("");
  const [mostrarAgendar, setMostrarAgendar] = React.useState(false);
  const [statsAvaliacoes, setStatsAvaliacoes] = React.useState(null);
  const [avaliacoes, setAvaliacoes] = React.useState([]);

  const isProfessor = location.pathname.startsWith("/professor/");
  const roleLabel = isProfessor ? "Professor" : "Aluno";
  const me = getUser();

  React.useEffect(() => {
    (async () => {
      try {
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

        // extras para professor: estatísticas e avaliações
        if (isProfessor && data._id) {
          try {
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

            // Normalizar o ID do professor do perfil para comparação
            const professorIdNormalizado = normalizarId(data._id);

            // Buscar avaliações e estatísticas em paralelo
            const [stats, avaliacoesList] = await Promise.all([
              getEstatisticasProfessor(data._id).catch(() => null),
              listarAvaliacoes({ id_prof: data._id }).catch(() => [])
            ]);
            
            const avaliacoesArray = Array.isArray(avaliacoesList) ? avaliacoesList : [];
            
            // Filtrar avaliações para garantir que sejam apenas do professor do perfil
            const avaliacoesFiltradas = avaliacoesArray.filter(av => {
              // Tentar diferentes formatos do campo id_prof da avaliação
              const avProfId = av.id_prof?._id || av.id_prof?.id || av.id_prof || 
                              av.professor?._id || av.professor?.id || av.professor ||
                              av.id_professor?._id || av.id_professor?.id || av.id_professor;
              const avProfIdNormalizado = normalizarId(avProfId);
              
              // Só incluir se o ID do professor da avaliação corresponder ao professor do perfil
              const pertenceAoProfessor = avProfIdNormalizado !== null && 
                                          professorIdNormalizado !== null && 
                                          avProfIdNormalizado === professorIdNormalizado;
              
              if (!pertenceAoProfessor && avProfId) {
                console.warn('[perfil-publico] Avaliação filtrada - não pertence ao professor:', {
                  avaliacaoId: av._id || av.id,
                  profIdAvaliacao: avProfIdNormalizado,
                  profIdPerfil: professorIdNormalizado
                });
              }
              
              return pertenceAoProfessor;
            });
            
            console.log('[perfil-publico] Total de avaliações recebidas do backend:', avaliacoesArray.length);
            console.log('[perfil-publico] Total de avaliações filtradas:', avaliacoesFiltradas.length);
            
            setAvaliacoes(avaliacoesFiltradas);
            
            // Se as estatísticas vierem do backend, usar; senão calcular manualmente
            const mediaFromStats = stats?.media || stats?.nota_media || stats?.media_notas || null;
            if (stats && mediaFromStats !== undefined && mediaFromStats !== null) {
              setStatsAvaliacoes({
                media: Number(mediaFromStats) || 0,
                total: stats.total || stats.total_avaliacoes || avaliacoesFiltradas.length || 0,
                nota_min: stats.nota_min || stats.min || null,
                nota_max: stats.nota_max || stats.max || null
              });

            } else if (avaliacoesFiltradas.length > 0) {
              // Calcular média manualmente usando apenas as avaliações filtradas (do professor correto)
              const somaNotas = avaliacoesFiltradas.reduce((acc, av) => {

                const nota = Number(av.nota) || 0;
                return acc + nota;
              }, 0);
              const media = somaNotas / avaliacoesFiltradas.length;
              
              setStatsAvaliacoes({
                media: media,
                total: avaliacoesFiltradas.length,
                nota_min: Math.min(...avaliacoesFiltradas.map(av => Number(av.nota) || 0)),
                nota_max: Math.max(...avaliacoesFiltradas.map(av => Number(av.nota) || 0))
              });
            } else {
              setStatsAvaliacoes({
                media: 0,
                total: 0
              });
            }
          } catch (e) {
            console.error("[perfil-publico] Erro ao buscar avaliações:", e);
            setAvaliacoes([]);
            setStatsAvaliacoes({
              media: 0,
              total: 0
            });
          }
        }
      } catch (e) {
        setErr(e.message || "Perfil não encontrado");
      }
    })();
  }, [slug, isProfessor]);

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
    navigate(`/chats?to=${targetId}`);
  };

  const renderStars = (nota) => {
    const notaValida = Math.max(0, Math.min(5, Number(nota) / 2 || 0)); // Converte de 0-10 para 0-5
    const fullStars = Math.floor(notaValida);
    const hasHalfStar = notaValida % 1 >= 0.5;
    const emptyStars = Math.max(0, Math.min(5, 5 - fullStars - (hasHalfStar ? 1 : 0)));

    return (
      <div className="pp-stars">
        {fullStars > 0 && [...Array(fullStars)].map((_, i) => (
          <svg key={i} width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
        {hasHalfStar && (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fillOpacity="0.5" />
          </svg>
        )}
        {emptyStars > 0 && [...Array(emptyStars)].map((_, i) => (
          <svg key={i} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
      </div>
    );
  };

  if (err) return <div className="container">{err}</div>;
  if (!usuario) return <div className="container">Carregando…</div>;

  const hasDisponibilidade =
    isProfessor &&
    (usuario?.disponibilidade?.timezone ||
      (usuario?.disponibilidade?.dias?.length ?? 0) > 0 ||
      (usuario?.disponibilidade?.horarios?.length ?? 0) > 0 ||
      typeof usuario?.valor_hora === "number" ||
      (usuario?.modalidades?.length ?? 0) > 0);

  const avatarUrl = usuario.avatar_url || usuario.avatar || usuario.avatarUrl || '';
  const displayAvatar = avatarUrl && avatarUrl.startsWith('http') 
    ? avatarUrl 
    : avatarUrl 
      ? `http://localhost:5000${avatarUrl}` 
      : null;

  return (
    <div className="perfil-publico">
      <HeaderLogado />

      <main className="pp-main">
        {/* Banner Hero Section */}
        <div className="pp-hero-section">
          {usuario.banner_url ? (
            <div className="pp-banner" style={{ backgroundImage: `url(${usuario.banner_url})` }} />
          ) : (
            <div className="pp-banner pp-banner-default" />
          )}
          
          <div className="pp-hero-content">
            <div className="pp-avatar-container">
              {displayAvatar ? (
                <img className="pp-avatar" src={displayAvatar} alt={usuario.nome} />
              ) : (
                <div className="pp-avatar-placeholder">
                  {usuario.nome?.charAt(0).toUpperCase() || 'P'}
                </div>
              )}
            </div>
            
            <div className="pp-profile-info">
              <div className="pp-name-section">
                <h1 className="pp-name">{usuario.nome}</h1>
                <span className={`role-pill ${isProfessor ? "prof" : "aluno"}`}>
                  {roleLabel}
                </span>
              </div>
              
              {usuario.headline && (
                <p className="pp-headline">{usuario.headline}</p>
              )}
              
              {usuario.endereco?.cidade && (
                <p className="pp-local">
                  📍 {usuario.endereco.cidade}, {usuario.endereco.estado}
                </p>
              )}

              {/* Stats para professor */}
              {isProfessor && statsAvaliacoes && statsAvaliacoes.total > 0 && (
                <div className="pp-stats-row">
                  <div className="pp-stat-item">
                    <div className="pp-stat-value">{statsAvaliacoes.media.toFixed(1)}</div>
                    <div className="pp-stat-label">Avaliação Média</div>
                  </div>
                  <div className="pp-stat-divider" />
                  <div className="pp-stat-item">
                    <div className="pp-stat-value">{statsAvaliacoes.total}</div>
                    <div className="pp-stat-label">{statsAvaliacoes.total === 1 ? 'Avaliação' : 'Avaliações'}</div>
                  </div>
                  {renderStars(statsAvaliacoes.media)}
                </div>
              )}

              <div className="pp-actions">
                {isProfessor ? (
                  <>
                    <button className="btn btn--primary" onClick={handleAgendarClick}>
                      Agendar Aula
                    </button>
                    <button className="btn btn--outline" onClick={iniciarConversa} disabled={!usuario?._id}>
                      Iniciar conversa
                    </button>
                  </>
                ) : (
                  <button className="btn btn--primary" onClick={iniciarConversa} disabled={!usuario?._id}>
                    Iniciar conversa
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="pp-content-grid">
          {/* Coluna Esquerda - Conteúdo Principal */}
          <div className="pp-content-left">
            {/* Sobre */}
            <section className="pp-card">
              <h3>Sobre</h3>
              <p className="pp-bio">
                {isProfessor
                  ? usuario.historico_academico_profissional || usuario.bio || "Este professor ainda não adicionou uma descrição."
                  : usuario.bio || "Este aluno ainda não adicionou uma biografia."}
              </p>
            </section>

            {/* Especializações e Quero Ensinar - Professor */}
            {isProfessor && (
              <>
                {Array.isArray(usuario.especializacoes) && usuario.especializacoes.length > 0 && (
                  <section className="pp-card">
                    <h3>Especializações</h3>
                    <Chips items={usuario.especializacoes} />
                  </section>
                )}

                {Array.isArray(usuario.quer_ensinar) && usuario.quer_ensinar.length > 0 && (
                  <section className="pp-card">
                    <h3>Disciplinas que Ensino</h3>
                    <Chips items={usuario.quer_ensinar} />
                  </section>
                )}
              </>
            )}

            {/* Quero Aprender - Aluno */}
            {!isProfessor && Array.isArray(usuario.quer_aprender) && usuario.quer_aprender.length > 0 && (
              <section className="pp-card">
                <h3>Quero Aprender</h3>
                <Chips items={usuario.quer_aprender} />
              </section>
            )}

            {/* Formação Acadêmica */}
            {Array.isArray(usuario.formacao) && usuario.formacao.length > 0 && (
              <section className="pp-card">
                <h3>Formação Acadêmica</h3>
                <ul className="pp-list">
                  {usuario.formacao.map((f, i) => (
                    <li key={i}>
                      <div className="pp-list-title">
                        {f.curso || "Curso"} — {f.instituicao || "Instituição"}
                      </div>
                      {(f.inicio || f.fim) && (
                        <div className="pp-list-desc">
                          {f.inicio || "?"} — {f.fim || "Atual"}
                        </div>
                      )}
                      {f.descricao && <div className="pp-list-desc">{f.descricao}</div>}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Experiências */}
            {Array.isArray(usuario.experiencias) && usuario.experiencias.length > 0 && (
              <section className="pp-card">
                <h3>Experiências Profissionais</h3>
                <ul className="pp-list">
                  {usuario.experiencias.map((ex, i) => (
                    <li key={i}>
                      <div className="pp-list-title">{ex.cargo || ex.titulo || "Cargo"}</div>
                      {ex.empresa && <div className="pp-list-company">{ex.empresa}</div>}
                      {(ex.inicio || ex.fim) && (
                        <div className="pp-list-desc">
                          {ex.inicio || "?"} — {ex.fim || "Atual"}
                        </div>
                      )}
                      {ex.descricao && <div className="pp-list-desc">{ex.descricao}</div>}
                      {ex.link && (
                        <a className="pp-link" href={ex.link} target="_blank" rel="noreferrer">
                          Ver detalhes →
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Certificações */}
            {Array.isArray(usuario.certificacoes) && usuario.certificacoes.length > 0 && (
              <section className="pp-card">
                <h3>Certificações</h3>
                <ul className="pp-list">
                  {usuario.certificacoes.map((c, i) => (
                    <li key={i}>
                      <div className="pp-list-title">
                        {c.titulo} {c.org ? `• ${c.org}` : ""}
                      </div>
                      {(c.ano || c.link) && (
                        <div className="pp-list-desc">
                          {c.ano ? `Ano: ${c.ano}` : ""}
                          {c.ano && c.link ? " • " : ""}
                          {c.link ? (
                            <a className="pp-link" href={c.link} target="_blank" rel="noreferrer">
                              Ver certificado →
                            </a>
                          ) : null}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Links */}
            {(usuario.links?.linkedin || usuario.links?.github || usuario.links?.site) && (
              <section className="pp-card">
                <h3>Links</h3>
                <ul className="pp-links">
                  {usuario.links?.linkedin && (
                    <li>
                      <a href={usuario.links.linkedin} target="_blank" rel="noreferrer">
                        🔗 LinkedIn
                      </a>
                    </li>
                  )}
                  {usuario.links?.github && (
                    <li>
                      <a href={usuario.links.github} target="_blank" rel="noreferrer">
                        🔗 GitHub
                      </a>
                    </li>
                  )}
                  {usuario.links?.site && (
                    <li>
                      <a href={usuario.links.site} target="_blank" rel="noreferrer">
                        🔗 Site/Portfólio
                      </a>
                    </li>
                  )}
                </ul>
              </section>
            )}

            {/* Projetos */}
            {Array.isArray(usuario.projetos) && usuario.projetos.length > 0 && (
              <section className="pp-card">
                <h3>Projetos</h3>
                <ul className="pp-list">
                  {usuario.projetos.map((p, i) => (
                    <li key={i}>
                      <div className="pp-list-title">{p.titulo}</div>
                      {p.resumo && <div className="pp-list-desc">{p.resumo}</div>}
                      {p.link && (
                        <a className="pp-link" href={p.link} target="_blank" rel="noreferrer">
                          Ver projeto →
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* Coluna Direita - Sidebar */}
          <div className="pp-content-right">
            {/* Avaliações - Professor */}
            {isProfessor && (
              <section className="pp-card pp-card-avaliacoes">
                <h3>Avaliações</h3>
                {statsAvaliacoes && statsAvaliacoes.total > 0 ? (
                  <>
                    <div className="pp-avaliacao-destaque">
                      <div className="pp-avaliacao-numero-grande">
                        {statsAvaliacoes.media.toFixed(1)}
                      </div>
                      <div className="pp-avaliacao-max">/ 10</div>
                      {renderStars(statsAvaliacoes.media)}
                    </div>
                    <p className="pp-avaliacao-total">
                      {statsAvaliacoes.total} {statsAvaliacoes.total === 1 ? 'avaliação' : 'avaliações'}
                    </p>

                    {avaliacoes.length > 0 && (
                      <div className="pp-avaliacoes-list">
                        <h4>Avaliações Recebidas</h4>
                        {avaliacoes.slice(0, 5).map((avaliacao) => (
                          <div key={avaliacao._id || avaliacao.id} className="pp-avaliacao-item">
                            <div className="pp-avaliacao-header">
                              <div>
                                <strong>{avaliacao.aluno?.nome || avaliacao.id_aluno?.nome || "Aluno"}</strong>
                                {avaliacao.aula?.titulo || avaliacao.id_aula?.titulo ? (
                                  <span className="pp-avaliacao-aula">
                                    {avaliacao.aula?.titulo || avaliacao.id_aula?.titulo}
                                  </span>
                                ) : null}
                              </div>
                              <span className="pp-avaliacao-nota">{avaliacao.nota}/10</span>
                            </div>
                            {avaliacao.texto && (
                              <p className="pp-avaliacao-texto">"{avaliacao.texto}"</p>
                            )}
                            {avaliacao.created_at && (
                              <p className="pp-avaliacao-data">
                                {new Date(avaliacao.created_at).toLocaleDateString("pt-BR")}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="pp-small muted">Nenhuma avaliação ainda</p>
                )}
              </section>
            )}

            {/* Idiomas */}
            {Array.isArray(usuario.idiomas) && usuario.idiomas.length > 0 && (
              <section className="pp-card">
                <h3>Idiomas</h3>
                <Chips items={usuario.idiomas} />
              </section>
            )}

            {/* Disponibilidade */}
            {hasDisponibilidade && (
              <section className="pp-card">
                <h3>Disponibilidade</h3>
                {usuario.disponibilidade?.timezone && (
                  <div className="pp-info-item">
                    <span className="pp-info-label">Fuso horário:</span>
                    <span className="pp-info-value">{usuario.disponibilidade.timezone}</span>
                  </div>
                )}
                {usuario.disponibilidade?.dias?.length > 0 && (
                  <div className="pp-info-item">
                    <span className="pp-info-label">Dias:</span>
                    <span className="pp-info-value">{usuario.disponibilidade.dias.join(", ")}</span>
                  </div>
                )}
                {usuario.disponibilidade?.horarios?.length > 0 && (
                  <div className="pp-info-item">
                    <span className="pp-info-label">Horários:</span>
                    <span className="pp-info-value">{usuario.disponibilidade.horarios.join(", ")}</span>
                  </div>
                )}
                {typeof usuario.valor_hora === "number" && (
                  <div className="pp-info-item pp-info-item-highlight">
                    <span className="pp-info-label">Valor/hora:</span>
                    <span className="pp-info-value">R$ {usuario.valor_hora.toFixed(2)}</span>
                  </div>
                )}
                {usuario.modalidades?.length > 0 && (
                  <div className="pp-info-item">
                    <span className="pp-info-label">Modalidades:</span>
                    <div className="pp-chips pp-chips-small">
                      {usuario.modalidades.map((m, i) => (
                        <span key={i} className="pp-chip">{m}</span>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>
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

function Chips({ items }) {
  if (!items || !items.length) return <p className="pp-small muted">Sem itens.</p>;
  return (
    <div className="pp-chips">
      {items.map((t, i) => (
        <span key={i} className="pp-chip">
          {t}
        </span>
      ))}
    </div>
  );
}
