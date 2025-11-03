// src/pages/chats/chats.jsx
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

/* ============ Avatar com fallback na inicial do nome ============ */
function Avatar({ src, name, className = "" }) {
  const [broken, setBroken] = React.useState(false);
  const letter = (name || "?").trim().charAt(0).toUpperCase();

  if (src && !broken) {
    return (
      <img
        className={`avatar-img ${className}`}
        src={src}
        alt={name || "Avatar"}
        onError={() => setBroken(true)}
      />
    );
  }
  return (
    <span className={`avatar ${className}`} aria-hidden>
      {letter}
    </span>
  );
}

/* ============ Datas legíveis ============ */
function normalizeTs(ts) {
  if (!ts) return null;
  let s = String(ts).trim();
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(s)) s = s.replace(" ", "T");
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

  if (isToday) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (isThisYear) {
    return (
      d.toLocaleDateString([], { day: "2-digit", month: "2-digit" }) +
      " " +
      d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  }
  return (
    d.toLocaleDateString([], { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " " +
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
}

/* =================================================================== */

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
  const lastAtRef = useRef(null);
  const msgTimerRef = useRef(null);
  const convTimerRef = useRef(null);
  const isFetchingRef = useRef(false);

  /* ============ Primeira carga das conversas ============ */
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

  /* ============ Carrega mensagens da conversa ativa ============ */
  useEffect(() => {
    (async () => {
      if (!activeId) return;
      try {
        const msgs = await getMessages(activeId);
        setMessages(msgs);
        const last = msgs[msgs.length - 1];
        lastAtRef.current = last?.created_at || last?.at || null;
        setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      } catch (err) {
        console.error("[chat] erro ao carregar mensagens:", err);
      }
    })();
  }, [activeId]);

  /* ============ Incrementos de mensagens (since=cursor) ============ */
  const pullIncrements = async () => {
    if (!activeId || isFetchingRef.current) return;
    if (typeof document !== "undefined" && document.hidden) return;
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
        lastAtRef.current =
          inc[inc.length - 1].created_at || inc[inc.length - 1].at || lastAtRef.current;
        setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 30);
      }
    } catch {
      // silencioso
    } finally {
      isFetchingRef.current = false;
    }
  };

  /* ============ Inicia/para polling de mensagens ============ */
  useEffect(() => {
    if (msgTimerRef.current) clearInterval(msgTimerRef.current);
    if (!activeId) return;
    pullIncrements();
    msgTimerRef.current = setInterval(pullIncrements, 2000);
    return () => {
      if (msgTimerRef.current) clearInterval(msgTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  /* ============ Polling leve das conversas ============ */
  useEffect(() => {
    if (convTimerRef.current) clearInterval(convTimerRef.current);

    const pullConvs = async () => {
      if (typeof document !== "undefined" && document.hidden) return;
      try {
        const fresh = await getConversations();
        setConversations((prev) => {
          const prevMap = new Map(prev.map((p) => [p.id, p]));
          return fresh.map((n) => {
            const old = prevMap.get(n.id);
            if (!old) return n;
            return {
              ...n,
              title: old.title || n.title,
              other: { ...(n.other || {}), ...(old.other || {}) },
              lastMessage: n.lastMessage || old.lastMessage || null,
            };
          });
        });
      } catch {
        // silencioso
      }
    };

    pullConvs();
    convTimerRef.current = setInterval(pullConvs, 10000);
    return () => {
      if (convTimerRef.current) clearInterval(convTimerRef.current);
    };
  }, []);

  /* ============ Puxa incrementos ao voltar a aba ============ */
  useEffect(() => {
    const onVis = () => {
      if (!document.hidden) pullIncrements();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ============ Busca de usuários ============ */
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

  /* ============ Abrir chat via busca ============ */
  async function openChatWith(user) {
    try {
      const conv = await ensureConversationWith(user.id);

      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === conv.id);
        if (idx === -1) return [conv, ...prev];

        const old = prev[idx];
        const merged = {
          ...old,
          title: conv.title || old.title,
          other: { ...(old.other || {}), ...(conv.other || {}) },
          lastMessage: old.lastMessage || conv.lastMessage || null,
          created_at: old.created_at || conv.created_at,
          updated_at: conv.updated_at || old.updated_at,
        };
        const next = [...prev];
        next[idx] = merged;
        return next;
      });

      setActiveId(conv.id);
      setResults([]);
      setQuery("");
    } catch (err) {
      console.error("[chat] erro ao abrir chat:", err);
      alert(err.message || "Falha ao abrir a conversa");
    }
  }

  /* ============ Selecionar conversa existente ============ */
  async function selectConversation(conv) {
    setActiveId(conv.id);

    const needs =
      !conv?.other ||
      !conv.other.id ||
      !conv.other.avatarUrl ||
      !conv.other.nome ||
      conv.other.bio == null ||
      String(conv.other.bio).trim() === "";

    if (!needs) return;

    try {
      const enriched = await ensureConversationWith(conv.other.id);
      setConversations((prev) =>
        prev.map((c) =>
          c.id !== conv.id
            ? c
            : {
                ...c,
                title: enriched.title || c.title,
                other: { ...(c.other || {}), ...(enriched.other || {}) },
                lastMessage: c.lastMessage || enriched.lastMessage || null,
              }
        )
      );
    } catch (e) {
      console.warn("[chat] enrich on select failed:", e);
    }
  }

  /* ============ Enviar mensagem ============ */
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
      const tempId = `tmp-${Date.now()}`;
      const optimistic = {
        id: tempId,
        fromMe: true,
        text,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 10);

      const msg = await sendMessage(activeId, text);
      setDraft("");

      setConversations((prev) =>
        prev.map((c) =>
          c.id !== activeId ? c : { ...c, lastMessage: { text, at: msg.at || msg.created_at } }
        )
      );

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

      lastAtRef.current = msg.created_at || msg.at || lastAtRef.current;
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 10);
    } catch (err) {
      console.error("[chat] falha ao enviar:", err);
      alert(err?.message || "Não foi possível enviar a mensagem.");
    } finally {
      setSending(false);
    }
  }

  /* ============================ RENDER ============================ */
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
                {results.map((u) => {
                  const badge = u?.tipo ? (u.tipo === "prof" ? "Professor" : "Aluno") : null;
                  const bio = (u?.bio && u.bio.trim()) || u?.headline || u?.email || "Sem descrição";
                  return (
                    <button key={u.id} className="result-item" onClick={() => openChatWith(u)}>
                      <Avatar src={u?.avatarUrl || u?.avatar_url} name={u?.nome} className="sm" />
                      <div>
                        <div className="title-row">
                          <strong>{(u?.nome ?? "").trim() || u?.email || "Usuário"}</strong>
                          {badge && <span className="role">{badge}</span>}
                        </div>
                        <small className="muted ellipsis">{bio}</small>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="conversations">
              {loading && <div className="muted pad">Carregando…</div>}
              {!loading &&
                conversations.map((c) => {
                  const other = c?.other || {};
                  const name = other?.nome || c?.title || "Conversa";
                  const avatarSrc = other?.avatarUrl || other?.avatar_url;
                  const badge = other?.tipo ? (other.tipo === "prof" ? "Professor" : "Aluno") : null;
                  // ✅ preview da última mensagem (corrige tela branca)
                  const previewText =
                    (c?.lastMessage?.text || "").trim() || "(sem mensagens)";

                  return (
                    <button
                      key={c.id}
                      className={`conv-item ${c.id === activeId ? "active" : ""}`}
                      onClick={() => selectConversation(c)}
                    >
                      <Avatar src={avatarSrc} name={name} className="sm" />
                      <div className="conv-main">
                        <div className="title-row">
                          <strong>{name}</strong>
                          {badge && <span className="role">{badge}</span>}
                          <time>
                            {safeTime(
                              c?.lastMessage?.at,
                              c?.lastMessage?.created_at || c?.updated_at || c?.created_at
                            )}
                          </time>
                        </div>
                        <small className="preview">{previewText}</small>
                      </div>
                    </button>
                  );
                })}
            </div>
          </aside>

          {/* Painel do chat */}
          <section className="chat-panel">
            {activeConv ? (
              <>
                <header className="chat-header">
                  {(() => {
                    const other = activeConv?.other || {};
                    const name = other?.nome || activeConv?.title || "Conversa";
                    const avatarSrc = other?.avatarUrl || other?.avatar_url;
                    const badge = other?.tipo ? (other.tipo === "prof" ? "Professor" : "Aluno") : null;
                    const status =
                      (other?.bio && String(other.bio).trim()) ||
                      other?.headline ||
                      "online • responde rápido";
                    return (
                      <div className="peer">
                        <Avatar src={avatarSrc} name={name} className="lg" />
                        <div>
                          <div className="title-row">
                            <strong>{name}</strong>
                            {badge && <span className="role">{badge}</span>}
                          </div>
                          <div className="status muted ellipsis">{status}</div>
                        </div>
                      </div>
                    );
                  })()}
                </header>

                <div className="chat-scroll">
                  {messages.map((m) => (
                    <div key={m.id} className={`bubble-row ${m.fromMe ? "me" : "peer"}`}>
                      {!m.fromMe && (
                        <Avatar
                          src={activeConv?.other?.avatarUrl || activeConv?.other?.avatar_url}
                          name={activeConv?.other?.nome || activeConv?.title}
                          className="sm"
                        />
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
