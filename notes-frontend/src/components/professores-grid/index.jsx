// professores-grid/index.jsx
import React, { useEffect, useState } from "react";
import { getToken } from "../../services/authService";
import "./index.css";
import { useNavigate } from "react-router-dom";

export default function ProfessoresGrid(){
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const navigate = useNavigate();

  useEffect(()=>{
    (async ()=>{
      setLoading(true);
      setError("");
      try{
        const token = getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        // buscar professores (pegar um conjunto razoável e paginar no cliente)
        const res = await fetch(`/api/professores?limit=100`, { headers });
        if(!res.ok) throw new Error("Erro ao buscar professores");
        const data = await res.json();
        // suportar resposta direta [] ou { data: [] }
        const list = Array.isArray(data) ? data : data?.data || [];
        setItems(list || []);
      }catch(e){
        console.error(e);
        setError(e.message || "Erro ao carregar");
      }finally{
        setLoading(false);
      }
    })();
  },[]);

  if(loading) return <div className="professores-grid"><p className="pp-small muted">Carregando…</p></div>;
  if(error) return <div className="professores-grid"><p className="pp-small muted">{error}</p></div>;

  const perPage = 4;
  const total = items ? items.length : 0;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const start = page * perPage;
  const pageItems = items ? items.slice(start, start + perPage) : [];

  return (
    <div className="professores-grid">
      <div className="grid">
        {(!pageItems || !pageItems.length) && <p className="pp-small muted">Nenhum professor encontrado.</p>}
        {pageItems && pageItems.map((p,i)=>{
          const id = p.slug || p._id || p.id || String(start + i);
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
      {totalPages > 1 && (
        <div style={{textAlign:'center'}}>
          {page < totalPages - 1 ? (
            <button className="see-more" onClick={()=>setPage((p)=>p+1)}>Veja mais</button>
          ) : (
            <button className="see-more" onClick={()=>setPage(0)}>Voltar ao início</button>
          )}
        </div>
      )}
    </div>
  );
}
