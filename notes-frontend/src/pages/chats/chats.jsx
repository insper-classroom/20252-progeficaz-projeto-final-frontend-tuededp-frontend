import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  searchUsers,
  getConversations,
  getMessages,
  sendMessage,
  ensureConversationWith, // <<< IMPORTANTE
} from "../../services/chatService";
import HeaderLogado from "../../components/header-logado";
import "./chats.css";

export default function ChatsPage(){
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const activeConv = useMemo(
    () => conversations.find(c => c.id === activeId) || null,
    [conversations, activeId]
  );

  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const endRef = useRef(null);

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

  // Carrega mensagens da conversa ativa
  useEffect(() => {
    (async () => {
      if (!activeId) return;
      try {
        const msgs = await getMessages(activeId);
        setMessages(msgs);
        setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      } catch (err) {
        console.error("[chat] erro ao carregar mensagens:", err);
      }
    })();
  }, [activeId]);

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

  // >>> CORRIGIDO: cria/obtém conversa REAL no backend
  async function openChatWith(user) {
    try {
      const conv = await ensureConversationWith(user.id); // POST /api/chats
      setConversations(prev => {
        const exists = prev.some(c => c.id === conv.id);
        return exists ? prev : [conv, ...prev];
      });
      setActiveId(conv.id);
      setResults([]); setQuery("");
    } catch (err) {
      console.error("[chat] erro ao abrir chat:", err);
      alert(err.message || "Falha ao criar/obter conversa");
    }
  }

  // Enviar mensagem
  async function handleSend(e) {
    e?.preventDefault?.();
    if (sending) return;

    const text = draft.trim();
    if (!text) return;
    if (!activeId) { alert("Selecione um chat."); return; }
    if (String(activeId).startsWith("tmp-")) {
      alert("Conversa ainda não foi criada no servidor. Selecione pela busca para abrir a conversa real.");
      return;
    }

    setSending(true);
    try {
      const msg = await sendMessage(activeId, text); // POST /api/chats/:id/messages
      setMessages(prev => [...prev, msg]);
      setDraft("");
      setConversations(prev =>
        prev.map(c => (c.id !== activeId ? c : { ...c, lastMessage: { text, at: msg.at } }))
      );
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 20);
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
                {results.map(u => (
                  <button key={u.id} className="result-item" onClick={() => openChatWith(u)}>
                    <span className="avatar" aria-hidden>{u.nome?.[0]}</span>
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
              {!loading && conversations.map(c => (
                <button
                  key={c.id}
                  className={`conv-item ${c.id === activeId ? "active" : ""}`}
                  onClick={() => setActiveId(c.id)}
                >
                  <span className="avatar" aria-hidden>{c.other?.nome?.[0] || c.title?.[0]}</span>
                  <div className="conv-main">
                    <div className="title-row">
                      <strong>{c.title}</strong>
                      <time>
                        {new Date(c.lastMessage?.at || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
                    <span className="avatar lg" aria-hidden>{activeConv.other?.nome?.[0]}</span>
                    <div>
                      <strong>{activeConv.title}</strong>
                      <div className="status muted">online • responde rápido</div>
                    </div>
                  </div>
                </header>

                <div className="chat-scroll">
                  {messages.map(m => (
                    <div key={m.id} className={`bubble-row ${m.fromMe ? "me" : "peer"}`}>
                      {!m.fromMe && (
                        <span className="avatar" aria-hidden>
                          {activeConv.other?.nome?.[0]}
                        </span>
                      )}
                      <div className="bubble">
                        <p>{m.text}</p>
                        <time>
                          {new Date(m.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </time>
                      </div>
                    </div>
                  ))}
                  <div ref={endRef} />
                </div>

                <form className="composer" onSubmit={handleSend}>
                  <input
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
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
                    disabled={sending || !draft.trim() || !activeId || String(activeId).startsWith("tmp-")}
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
