import React, { useEffect, useRef, useState } from "react";
import { getToken } from "../../services/authService";
import { useNavigate } from "react-router-dom";
import "./index.css";

export default function GridAluno(){
  const scroller = useRef(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(()=>{
    (async ()=>{
      try{
        const token = getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`/api/professores?limit=40`, { headers });
        if(!res.ok) throw new Error("Erro ao buscar professores");
        const data = await res.json();
        const list = Array.isArray(data) ? data : data?.data || [];
        setItems(list);
      }catch(e){
        console.error(e);
        setError(e.message || "Erro ao carregar professores");
      }finally{
        setLoading(false);
      }
    })();
  },[]);

  const scrollBy = (offset) => scroller.current?.scrollBy({ left: offset, behavior: 'smooth' });

  const scrollPrev = () => {
    if(!scroller.current) return;
    scrollBy(-scroller.current.clientWidth);
  };
  const scrollNext = () => {
    if(!scroller.current) return;
    scrollBy(scroller.current.clientWidth);
  };

  if(loading) return <div className="grid-aluno"><p className="pp-small muted">Carregando…</p></div>;
  if(error) return <div className="grid-aluno"><p className="pp-small muted">{error}</p></div>;

  return (
    <div className="grid-aluno">
      <div className="scroller" ref={scroller}>
        {items.map((p,i)=>{
          const id = p.slug || p._id || p.id || String(i);
          return (
            <article key={id} className="prof-card" onClick={()=>navigate(`/aluno/${id}`)}>
              <img className="prof-avatar" src={p.avatar_url || "/avatar-placeholder.png"} alt={p.nome} />
              <div className="prof-info">
                <strong className="prof-name">{p.nome || "Sem nome"}</strong>
                {p.headline && <div className="prof-headline">{p.headline}</div>}
                {p.especializacoes && p.especializacoes.length>0 && (
                  <div className="prof-tags">{p.especializacoes.slice(0,3).map((t,idx)=>(<span key={idx} className="prof-tag">{t}</span>))}</div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <div className="arrows">
        <button aria-label="Anterior" onClick={scrollPrev}>←</button>
        <button aria-label="Próximo" onClick={scrollNext}>→</button>
      </div>
    </div>
  );
}
