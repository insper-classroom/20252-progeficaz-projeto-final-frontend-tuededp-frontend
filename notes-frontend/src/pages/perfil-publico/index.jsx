// components/perfil-publico/index.jsx
import React from "react";
import { useParams, useLocation } from "react-router-dom";
import HeaderLogado from "../../components/header-logado";
import Footer from "../../components/footer";
import AgendarAula from "../../components/agendar-aula";
import { getUser, getTipo } from "../../services/authService";
import "./index.css";

const API_BASE_URL = (import.meta && import.meta.env && import.meta.env.VITE_API_BASE) || "http://localhost:5000";

/** Helpers de normalização */
function toArray(v) {
  if (v === undefined || v === null) return [];
  if (Array.isArray(v)) return v.map(String).map(s => s.trim()).filter(Boolean);
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return [];
    // tenta JSON first
    if ((s.startsWith("[") || s.startsWith("{"))) {
      try {
        const parsed = JSON.parse(s);
        return Array.isArray(parsed) ? parsed.map(String).map(x=>x.trim()).filter(Boolean) : [];
      } catch (e) {
        // não é JSON -> split
      }
    }
    return s.split(",").map(x => x.trim()).filter(Boolean);
  }
  return [];
}

function toArrayOfObjects(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return [];
    try {
      const parsed = JSON.parse(s);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  return [];
}

function toObject(v) {
  if (!v) return null;
  if (typeof v === "object") return v;
  if (typeof v === "string") {
    try {
      return JSON.parse(v);
    } catch (e) {
      return null;
    }
  }
  return null;
}

/** Detecta se o usuário atual (logado) é aluno */
function isAlunoLocal() {
  const tipo = getTipo?.();
  if (tipo && tipo.toLowerCase() === "aluno") return true;
  const me = getUser?.() || {};
  if (me?.tipo && me.tipo.toLowerCase() === "aluno") return true;
  const stored = localStorage.getItem("tipo");
  if (stored && stored.toLowerCase() === "aluno") return true;
  return false;
}

export default function PerfilPublico() {
  const { slug } = useParams();
  const location = useLocation();
  const [usuario, setUsuario] = React.useState(null);
  const [err, setErr] = React.useState("");
  const [mostrarAgendar, setMostrarAgendar] = React.useState(false);
  const isProfessor = location.pathname.startsWith("/professor/");

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const endpoint = isProfessor
          ? `${API_BASE_URL}/api/professores/slug/${encodeURIComponent(slug)}`
          : `${API_BASE_URL}/api/alunos/slug/${encodeURIComponent(slug)}`;
        const r = await fetch(endpoint);
        if (!r.ok) {
          // devolve erro do backend se houver
          let text = "Perfil não encontrado";
          try { const j = await r.json(); text = j?.error || j?.msg || text; } catch(e){}
          throw new Error(text);
        }
        const j = await r.json();
        if (!alive) return;
        setUsuario(j);
      } catch (e) {
        if (!alive) return;
        setErr(e.message || "Erro ao carregar perfil");
      }
    })();
    return () => { alive = false; };
  }, [slug, isProfessor]);

  const handleAgendarClick = () => {
    const user = getUser();
    if (!user) {
      alert("Você precisa estar logado como aluno para agendar uma aula.");
      return;
    }
    if (!isAlunoLocal()) {
      alert("Apenas alunos podem agendar aulas.");
      return;
    }
    setMostrarAgendar(true);
  };

  if (err) return <div className="container">{err}</div>;
  if (!usuario) return <div className="container">Carregando…</div>;

  // Normalizações pra exibição (aceita tanto string quanto array)
  const idiomas = toArray(usuario.idiomas);
  const quer_aprender = toArray(usuario.quer_aprender);
  const quer_ensinar = toArray(usuario.quer_ensinar);
  const especializacoes = toArray(usuario.especializacoes);
  const modalidades = toArray(usuario.modalidades);
  const projetos = toArrayOfObjects(usuario.projetos);
  const experiencias = toArrayOfObjects(usuario.experiencias);
  const formacao = toArrayOfObjects(usuario.formacao);
  const certificacoes = toArrayOfObjects(usuario.certificacoes);
  const disponibilidade = toObject(usuario.disponibilidade) || usuario.disponibilidade || null;
  const links = usuario.links || {};

  const valorHora = typeof usuario.valor_hora === "number"
    ? usuario.valor_hora
    : (usuario.valor_hora ? Number(usuario.valor_hora) : null);

  return (
    <div className="perfil-publico">
      <HeaderLogado />
      <main className="pp-main">
        {/* banner */}
        {usuario.banner_url && (
          <div className="pp-banner" style={{ backgroundImage: `url(${usuario.banner_url})` }} />
        )}

        <section className="pp-card pp-header">
          <img className="pp-avatar" src={usuario.avatar_url || "/avatar-placeholder.png"} alt={usuario.nome} />
          <div className="pp-id">
            <h1>{usuario.nome}</h1>
            {usuario.headline && <p className="pp-headline">{usuario.headline}</p>}
            {usuario.endereco?.cidade && (
              <p className="pp-local">{usuario.endereco.cidade} • {usuario.endereco.estado}</p>
            )}
            <div className="pp-actions">
              {isProfessor ? (
                <button className="btn btn--primary" onClick={handleAgendarClick}>Agendar Aula</button>
              ) : (
                <>
                  <a className="btn btn--primary" href={`/chat?to=${usuario._id}`}>Enviar Mensagem</a>
                  <a className="btn btn--outline" href={`/chat?to=${usuario._id}&tipo=study`}>Convidar para estudar</a>
                </>
              )}
            </div>
          </div>
        </section>

        <div className="pp-grid">
          {/* SOBRE / HISTÓRICO */}
          <section className="pp-card">
            <h3>Sobre</h3>
            <p className="pp-bio">
              {isProfessor
                ? (usuario.historico_academico_profissional || usuario.bio || "Sem informações.")
                : (usuario.bio || "Sem biografia.")}
            </p>
          </section>

          {/* Campos para ALUNO */}
          {!isProfessor && (
            <>
              <section className="pp-card">
                <h3>Idiomas</h3>
                <Chips items={idiomas} noneText="Sem idiomas." />
              </section>

              <section className="pp-card">
                <h3>Quero aprender</h3>
                <Chips items={quer_aprender} noneText="Sem itens." />
              </section>

              <section className="pp-card">
                <h3>Modalidades</h3>
                <Chips items={modalidades} noneText="Sem modalidades." />
              </section>

              <section className="pp-card">
                <h3>Valor / Hora (disposto a pagar)</h3>
                {typeof valorHora === "number" ? (
                  <p className="pp-small"><b>R$ {valorHora}</b></p>
                ) : (
                  <p className="pp-small muted">Não informado.</p>
                )}
              </section>

              <section className="pp-card">
                <h3>Links</h3>
                <LinksList links={links} />
              </section>
            </>
          )}

          {/* Campos para PROFESSOR */}
          {isProfessor && (
            <>
              <section className="pp-card">
                <h3>Especializações</h3>
                <Chips items={especializacoes} noneText="Sem especializações." />
              </section>

              <section className="pp-card">
                <h3>Quero ensinar</h3>
                <Chips items={quer_ensinar} noneText="Sem itens." />
              </section>

              <section className="pp-card">
                <h3>Disponibilidade</h3>
                <p className="pp-small">
                  {disponibilidade?.timezone ? `Fuso: ${disponibilidade.timezone}` : "Fuso: America/Sao_Paulo"}
                  {disponibilidade?.dias?.length ? <><br/>Dias: {disponibilidade.dias.join(", ")}</> : null}
                  {disponibilidade?.horarios?.length ? <> | Horários: {disponibilidade.horarios.join(", ")}</> : null}
                </p>
              </section>

              <section className="pp-card">
                <h3>Valor / Hora (cobrado)</h3>
                {typeof valorHora === "number" ? (
                  <p className="pp-small"><b>R$ {valorHora}</b></p>
                ) : (
                  <p className="pp-small muted">Não informado.</p>
                )}
              </section>

              <section className="pp-card">
                <h3>Modalidades</h3>
                <Chips items={modalidades} noneText="Sem modalidades." />
              </section>

              <section className="pp-card">
                <h3>Experiências</h3>
                {experiencias.length ? (
                  <ul className="pp-list">
                    {experiencias.map((e,i)=>(
                      <li key={i}>
                        <div className="pp-list-title">{e.cargo || e.titulo || "—"} {e.empresa ? `— ${e.empresa}` : ""}</div>
                        {e.inicio && <div className="pp-list-desc">{e.inicio}{e.fim ? ` — ${e.fim}` : ""}</div>}
                        {e.descricao && <div className="pp-list-desc">{e.descricao}</div>}
                        {e.link && <a className="pp-link" href={e.link} target="_blank" rel="noreferrer">ver</a>}
                      </li>
                    ))}
                  </ul>
                ) : <p className="pp-small muted">Sem experiências.</p>}
              </section>

              <section className="pp-card">
                <h3>Formação</h3>
                {formacao.length ? (
                  <ul className="pp-list">
                    {formacao.map((f,i)=>(
                      <li key={i}>
                        <div className="pp-list-title">{f.instituicao} — {f.curso}</div>
                        {f.inicio && <div className="pp-list-desc">{f.inicio}{f.fim ? ` — ${f.fim}` : ""}</div>}
                        {f.descricao && <div className="pp-list-desc">{f.descricao}</div>}
                      </li>
                    ))}
                  </ul>
                ) : <p className="pp-small muted">Sem formação cadastrada.</p>}
              </section>

              <section className="pp-card">
                <h3>Certificações</h3>
                {certificacoes.length ? (
                  <ul className="pp-list">
                    {certificacoes.map((c,i)=>(
                      <li key={i}>
                        <div className="pp-list-title">{c.titulo} — {c.org} ({c.ano || "—"})</div>
                        {c.link && <a className="pp-link" href={c.link} target="_blank" rel="noreferrer">ver</a>}
                      </li>
                    ))}
                  </ul>
                ) : <p className="pp-small muted">Sem certificações.</p>}
              </section>

              <section className="pp-card">
                <h3>Projetos</h3>
                {projetos.length ? (
                  <ul className="pp-list">
                    {projetos.map((p,i)=>(
                      <li key={i}>
                        <div className="pp-list-title">{p.titulo}</div>
                        {p.resumo && <div className="pp-list-desc">{p.resumo}</div>}
                        {p.link && <a className="pp-link" href={p.link} target="_blank" rel="noreferrer">ver</a>}
                      </li>
                    ))}
                  </ul>
                ) : <p className="pp-small muted">Sem projetos listados.</p>}
              </section>

              <section className="pp-card">
                <h3>Links</h3>
                <LinksList links={links} />
              </section>
            </>
          )}
        </div>
      </main>

      <Footer />

      {mostrarAgendar && usuario._id && isProfessor && (
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

/* Util componentes */
function Chips({ items = [], noneText = "Sem itens." }) {
  const arr = Array.isArray(items) ? items : (typeof items === "string" ? items.split(",").map(s=>s.trim()).filter(Boolean) : []);
  if (!arr.length) return <p className="pp-small muted">{noneText}</p>;
  return (
    <div className="pp-chips">
      {arr.map((t,i) => <span key={i} className="pp-chip">{t}</span>)}
    </div>
  );
}

function LinksList({ links = {} }) {
  if (!links || Object.keys(links).length === 0) return <p className="pp-small muted">Sem links.</p>;
  return (
    <ul className="pp-links">
      {links.linkedin && <li><a href={links.linkedin} target="_blank" rel="noreferrer">LinkedIn</a></li>}
      {links.github && <li><a href={links.github} target="_blank" rel="noreferrer">GitHub</a></li>}
      {links.site && <li><a href={links.site} target="_blank" rel="noreferrer">Site/Portfólio</a></li>}
    </ul>
  );
}
