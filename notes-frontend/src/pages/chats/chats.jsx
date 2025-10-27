import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  searchUsers,
  getConversations,
  getMessages,
  sendMessage,
  ensureConversationWith,
} from "../../services/chatService";
import HeaderLogado from "../../components/header-logado";
import "./chats.css";

/* --- util: normaliza qualquer timestamp para algo que o Date parseia bem --- */
function normalizeTs(ts) {
  if (!ts) return null;
  let s = String(ts).trim();
  // troca espaço por 'T' (caso venha "YYYY-MM-DD HH:MM:SS")
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(s)) s = s.replace(" ", "T");
  // remove microssegundos: "....123456Z" -> "...Z"
  s = s.replace(/\.\d+Z$/, "Z");
  return s;
}
function safeTime(...candidates) {
  const raw = candidates.find(Boolean);
  const s = normalizeTs(raw);
  if (!s) return "";
  const d = new Date(s);
  if (isNaN(d)) return "";

  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const isThisYear = d.getFullYear() === now.getFullYear();
  
  // Se for hoje, mostra só a hora
  if (isToday) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  // Se for este ano, mostra dia/mês e hora
  if (isThisYear) {
    return (
      d.toLocaleDateString([], { day: "2-digit", month: "2-digit" }) +
      " " +
      d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  }
  // Se for outro ano, mostra data completa
  return (
    d.toLocaleDateString([], { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " " +
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
}

export default function ChatsPage() {
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const activeConv = useMemo(
    () => conversations.find((c) => c.id === activeId) || null,
    [conversations, activeId]
  );

  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const endRef = useRef(null);

  // ---- Controles para polling incremental ----
  const lastAtRef = useRef(null);     // cursor ISO da última mensagem carregada
  const msgTimerRef = useRef(null);   // intervalo do feed de mensagens
  const convTimerRef = useRef(null);  // intervalo para atualizar preview da sidebar
  const isFetchingRef = useRef(false);// trava reentrância

  // Carrega conversas reais
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const convs = await getConversations();
        setConversations(convs);
        if (convs?.length) setActiveId(convs[0].id);
      } catch (err) {
        console.error("[chat] erro ao carregar conversas:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Carrega mensagens da conversa ativa (primeira carga)
  useEffect(() => {
    (async () => {
      if (!activeId) return;
      try {
        const msgs = await getMessages(activeId);
        setMessages(msgs);
        // define cursor incremental
        const last = msgs[msgs.length - 1];
        lastAtRef.current = last?.created_at || last?.at || null;
        setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      } catch (err) {
        console.error("[chat] erro ao carregar mensagens:", err);
      }
    })();
  }, [activeId]);

  // Função que puxa incrementos com since e faz merge estável
  const pullIncrements = async () => {
    if (!activeId || isFetchingRef.current) return;
    if (typeof document !== "undefined" && document.hidden) return; // economiza quando a aba não está visível
    try {
      isFetchingRef.current = true;
      const since = lastAtRef.current || null;
      const inc = await getMessages(activeId, { since });
      if (inc && inc.length) {
        setMessages((prev) => {
          const ids = new Set(prev.map((m) => m.id));
          const merged = [...prev];
          for (const m of inc) if (!ids.has(m.id)) merged.push(m);
          merged.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
          return merged;
        });
        // avança cursor
        lastAtRef.current =
          inc[inc.length - 1].created_at || inc[inc.length - 1].at || lastAtRef.current;
        // auto-scroll
        setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 30);
      }
    } catch (e) {
      // silencioso; próxima iteração tenta de novo
    } finally {
      isFetchingRef.current = false;
    }
  };

  // Inicia/para polling de mensagens quando trocar activeId
  useEffect(() => {
    if (msgTimerRef.current) clearInterval(msgTimerRef.current);
    if (!activeId) return;
    // puxa já e agenda
    pullIncrements();
    msgTimerRef.current = setInterval(pullIncrements, 2000);
    return () => {
      if (msgTimerRef.current) clearInterval(msgTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  // Polling leve da lista de conversas (atualiza preview e ordem)
  useEffect(() => {
    if (convTimerRef.current) clearInterval(convTimerRef.current);
    const pullConvs = async () => {
      if (typeof document !== "undefined" && document.hidden) return;
      try {
        const convs = await getConversations();
        setConversations(convs);
      } catch {}
    };
    pullConvs();
    convTimerRef.current = setInterval(pullConvs, 10000);
    return () => {
      if (convTimerRef.current) clearInterval(convTimerRef.current);
    };
  }, []);

  // Pausar polling quando aba fica oculta (economiza rede) e puxar ao voltar
  useEffect(() => {
    const onVis = () => {
      if (!document.hidden) pullIncrements();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Busca usuários
  async function onSearch(e) {
    const q = e.target.value;
    setQuery(q);
    try {
      const r = await searchUsers(q);
      setResults(r);
    } catch (err) {
      console.error("[chat] erro ao buscar usuários:", err);
    }
  }

  // Cria/obtém conversa REAL no backend
  async function openChatWith(user) {
    try {
      const conv = await ensureConversationWith(user.id); // POST /api/chats
      setConversations((prev) => {
        const exists = prev.some((c) => c.id === conv.id);
        return exists ? prev : [conv, ...prev];
      });
      setActiveId(conv.id);
      setResults([]);
      setQuery("");
    } catch (err) {
      console.error("[chat] erro ao abrir chat:", err);
      alert(err.message || "Falha ao criar/obter conversa");
    }
  }

  // Enviar mensagem (optimistic -> substitui pela resposta do servidor)
  async function handleSend(e) {
    e?.preventDefault?.();
    if (sending) return;

    const text = draft.trim();
    if (!text) return;
    if (!activeId) {
      alert("Selecione um chat.");
      return;
    }
    if (String(activeId).startsWith("tmp-")) {
      alert("Conversa ainda não foi criada no servidor. Selecione pela busca para abrir a conversa real.");
      return;
    }

    setSending(true);
    try {
      // Optimistic UI com id temporário
      const tempId = `tmp-${Date.now()}`;
      const optimistic = {
        id: tempId,
        fromMe: true,
        text,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 10);

      // POST real
      const msg = await sendMessage(activeId, text); // { id, text, fromMe, created_at/at }
      setDraft("");

      // Atualiza preview na lista de conversas
      setConversations((prev) =>
        prev.map((c) =>
          c.id !== activeId ? c : { ...c, lastMessage: { text, at: msg.at || msg.created_at } }
        )
      );

      // 🔁 RECONCILIA: substitui a bolha temporária pela mensagem oficial
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? {
                id: msg.id || msg._id,
                fromMe: true,
                text: msg.text,
                created_at: msg.created_at || msg.at,
                at: msg.at || msg.created_at,
              }
            : m
        )
      );

      // Avança cursor (sem necessidade de puxar incrementos aqui)
      lastAtRef.current = msg.created_at || msg.at || lastAtRef.current;

      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 10);
    } catch (err) {
      console.error("[chat] falha ao enviar:", err);
      alert(err?.message || "Não foi possível enviar a mensagem.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="page-chats">
      <HeaderLogado />
      <div className="chats-wrap">
        <div className="chats-shell">
          {/* Sidebar */}
          <aside className="chats-aside">
            <div className="aside-header">
              <h2>Mensagens</h2>
            </div>

            <div className="search-box">
              <input
                value={query}
                onChange={onSearch}
                placeholder="Buscar professores ou alunos"
              />
            </div>

            {results?.length > 0 && (
              <div className="search-results">
                {results.map((u) => (
                  <button key={u.id} className="result-item" onClick={() => openChatWith(u)}>
                    <span className="avatar" aria-hidden>
                      {u.nome?.[0]}
                    </span>
                    <div>
                      <div className="title-row">
                        <strong>{u.nome}</strong>
                        <span className="role">{u.tipo === "prof" ? "Professor" : "Aluno"}</span>
                      </div>
                      <small className="muted">{u.bio || u.email}</small>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="conversations">
              {loading && <div className="muted pad">Carregando…</div>}
              {!loading &&
                conversations.map((c) => (
                  <button
                    key={c.id}
                    className={`conv-item ${c.id === activeId ? "active" : ""}`}
                    onClick={() => setActiveId(c.id)}
                  >
                    <span className="avatar" aria-hidden>
                      {c.other?.nome?.[0] || c.title?.[0]}
                    </span>
                    <div className="conv-main">
                      <div className="title-row">
                        <strong>{c.title}</strong>
                        <time>
                          {safeTime(
                            c.lastMessage?.at,
                            c.lastMessage?.created_at || c.updated_at || c.created_at
                          )}
                        </time>
                      </div>
                      <small className="muted ellipsis">{c.lastMessage?.text || ""}</small>
                    </div>
                  </button>
                ))}
            </div>
          </aside>

          {/* Painel do chat */}
          <section className="chat-panel">
            {activeConv ? (
              <>
                <header className="chat-header">
                  <div className="peer">
                    <span className="avatar lg" aria-hidden>
                      {activeConv.other?.nome?.[0]}
                    </span>
                    <div>
                      <strong>{activeConv.title}</strong>
                      <div className="status muted">online • responde rápido</div>
                    </div>
                  </div>
                </header>

                <div className="chat-scroll">
                  {messages.map((m) => (
                    <div key={m.id} className={`bubble-row ${m.fromMe ? "me" : "peer"}`}>
                      {!m.fromMe && (
                        <span className="avatar" aria-hidden>
                          {activeConv.other?.nome?.[0]}
                        </span>
                      )}
                      <div className="bubble">
                        <p>{m.text}</p>
                        {safeTime(m.at, m.created_at) && (
                          <time>{safeTime(m.at, m.created_at)}</time>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={endRef} />
                </div>

                <form className="composer" onSubmit={handleSend}>
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Escreva uma mensagem…"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(e);
                      }
                    }}
                  />
                  <button
                    type="submit"
                    className="send-btn"
                    disabled={
                      sending || !draft.trim() || !activeId || String(activeId).startsWith("tmp-")
                    }
                    title={!activeId ? "Selecione um chat" : undefined}
                  >
                    {sending ? "Enviando..." : "Enviar"}
                  </button>
                </form>
              </>
            ) : (
              <div className="empty-state">
                <h3>Selecione um chat</h3>
                <p className="muted">Busque por professores ou alunos e comece uma conversa.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
