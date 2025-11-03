import React from "react";
import { useParams } from "react-router-dom";
import HeaderLogado from "../../components/header-logado";
import Footer from "../../components/footer";
import { getToken } from "../../services/authService";
import "./index.css";

export default function PerfilPublico(){
  const { slug } = useParams();
  const [aluno, setAluno] = React.useState(null);
  const [err, setErr] = React.useState("");

  React.useEffect(()=>{
    (async ()=>{
      try{
        // 1) tenta via slug (rota pública)
        let r = await fetch(`/api/alunos/slug/${slug}`);
        if(!r.ok){
          // 2) tenta via ID (precisa de Authorization)
          const tk = getToken();
          const headers = tk ? { Authorization: `Bearer ${tk}` } : {};
          r = await fetch(`/api/alunos/${slug}` , { headers });
          if(!r.ok) throw new Error("Perfil não encontrado");
        }
        const data = await r.json();
        setAluno(data);
      }catch(e){ setErr(e.message || "Perfil não encontrado"); }
    })();
  },[slug]);

  if(err) return <div className="container">{err}</div>;
  if(!aluno) return <div className="container">Carregando…</div>;

  return (
    <div className="perfil-publico">
      <HeaderLogado />
      <main className="pp-main">
        {/* banner */}
        {aluno.banner_url && (
          <div className="pp-banner" style={{backgroundImage:`url(${aluno.banner_url})`}} />
        )}
        <section className="pp-card pp-header">
          <img className="pp-avatar" src={aluno.avatar_url || "/avatar-placeholder.png"} alt={aluno.nome}/>
          <div className="pp-id">
            <h1>{aluno.nome}</h1>
            {aluno.headline && <p className="pp-headline">{aluno.headline}</p>}
            {aluno.endereco?.cidade && <p className="pp-local">{aluno.endereco.cidade} • {aluno.endereco.estado}</p>}
            <div className="pp-actions">
              <a className="btn btn--primary" href={`/chat?to=${aluno._id}`}>Pedir aula</a>
              <a className="btn btn--outline" href={`/chat?to=${aluno._id}&tipo=study`}>Convidar para estudar</a>
            </div>
          </div>
        </section>

        <div className="pp-grid">
          <section className="pp-card">
            <h3>Sobre</h3>
            <p className="pp-bio">{aluno.bio || "Sem biografia."}</p>
          </section>

          <section className="pp-card">
            <h3>Especializações</h3>
            <Chips items={aluno.especializacoes} />
          </section>

          <section className="pp-card">
            <h3>Quero ensinar</h3>
            <Chips items={aluno.quer_ensinar} />
          </section>

          <section className="pp-card">
            <h3>Quero aprender</h3>
            <Chips items={aluno.quer_aprender} />
          </section>

          <section className="pp-card">
            <h3>Disponibilidade</h3>
            <p className="pp-small">
              Fuso: {aluno.disponibilidade?.timezone || "America/Sao_Paulo"}<br/>
              {aluno.disponibilidade?.dias?.length ? `Dias: ${aluno.disponibilidade.dias.join(", ")}` : ""}
              {aluno.disponibilidade?.horarios?.length ? ` | Horários: ${aluno.disponibilidade.horarios.join(", ")}` : ""}
            </p>
            {typeof aluno.valor_hora === "number" && <p className="pp-small">Valor/hora: <b>R$ {aluno.valor_hora}</b></p>}
            {aluno.modalidades?.length ? <p className="pp-small">Modalidades: {aluno.modalidades.join(", ")}</p> : null}
          </section>

          {(aluno.projetos?.length) ? (
            <section className="pp-card">
              <h3>Projetos</h3>
              <ul className="pp-list">
                {aluno.projetos.map((p,i)=>(
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
              {aluno.links?.linkedin && <li><a href={aluno.links.linkedin} target="_blank" rel="noreferrer">LinkedIn</a></li>}
              {aluno.links?.github && <li><a href={aluno.links.github} target="_blank" rel="noreferrer">GitHub</a></li>}
              {aluno.links?.site && <li><a href={aluno.links.site} target="_blank" rel="noreferrer">Site/Portfólio</a></li>}
            </ul>
          </section>
        </div>
      </main>
      <Footer />
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
