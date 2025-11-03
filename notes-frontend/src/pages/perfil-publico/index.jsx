import React from "react";
import { useParams, useLocation } from "react-router-dom";
import HeaderLogado from "../../components/header-logado";
import Footer from "../../components/footer";
import { getToken } from "../../services/authService";
import AgendarAula from "../../components/agendar-aula";
import { getUser, getTipo } from "../../services/authService";
import "./index.css";

const API_BASE_URL = 'http://localhost:5000';

// Função auxiliar para detectar se o usuário é aluno
function isAluno() {
  // Tenta obter do authService primeiro
  const tipoAuth = getTipo();
  if (tipoAuth && tipoAuth.toLowerCase() === "aluno") {
    return true;
  }
  
  // Tenta do objeto user
  const me = getUser() || {};
  if (me.tipo && me.tipo.toLowerCase() === "aluno") {
    return true;
  }
  
  // Tenta do localStorage
  const tipoStorage = localStorage.getItem("tipo");
  if (tipoStorage && tipoStorage.toLowerCase() === "aluno") {
    return true;
  }
  
  // Se não encontrou nenhum tipo, assume que não é aluno (por segurança)
  return false;
}

export default function PerfilPublico(){
  const { slug } = useParams();
  const location = useLocation();
  const [usuario, setUsuario] = React.useState(null);
  const [err, setErr] = React.useState("");
  const [mostrarAgendar, setMostrarAgendar] = React.useState(false);
  const isProfessor = location.pathname.startsWith("/professor/");

  React.useEffect(()=>{
    (async ()=>{
      try{
        let r;
        let data;
        // Seleciona a entidade (aluno/professor)
        if (isProfessor) {
          r = await fetch(`${API_BASE_URL}/api/professores/slug/${slug}`);
          if (!r.ok) {
            const tk = getToken();
            const headers = tk ? { Authorization: `Bearer ${tk}` } : {};
            r = await fetch(`${API_BASE_URL}/api/professores/${slug}`, { headers });
          }
        } else {
          // tenta primeiro por slug; se falhar, tenta por id com Authorization
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
    
    // Usa a função auxiliar para verificar se é aluno
    if (!isAluno()) {
      alert("Apenas alunos podem agendar aulas.");
      return;
    }
    
    setMostrarAgendar(true);
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
                <button className="btn btn--primary" onClick={handleAgendarClick}>Agendar Aula</button>
              ) : (
                <>
                  <a className="btn btn--primary" href={`/chat?to=${usuario._id}`}>Pedir aula</a>
                  <a className="btn btn--outline" href={`/chat?to=${usuario._id}&tipo=study`}>Convidar para estudar</a>
                </>
              )}
            </div>
          </div>
        </section>

        <div className="pp-grid">
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
