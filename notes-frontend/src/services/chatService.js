// src/services/chatService.js
import * as Auth from "./authService";   // <— evita sombreamento
const API = ""; // proxy do Vite

/** Fetch com Bearer + JSON + erros detalhados */
async function authFetchJSON(path, opts = {}) {
  const token = Auth.getToken?.();                    // <— chama pelo namespace
  if (!token) console.warn("[auth] token ausente no localStorage!");

  const res = await fetch(`${API}${path}`, {
    method: "GET",
    ...opts,
    headers: {
      Authorization: token ? `Bearer ${token}` : "",  // <— se vazio, backend 401
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });

  const raw = await res.text();
  let data; try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }

  if (!res.ok) {
    const detail = typeof data === "string" ? data : (data?.msg || data?.error || JSON.stringify(data));
    throw new Error(`HTTP ${res.status} ${path} → ${detail}`);
  }
  return data;
}

/* ============ Normalizadores ============ */
function normalizeUser(u, tipoGuess) {
  return {
    id: u.id || u._id || String(u._id),
    nome: u.nome || u.name || u.fullname || "Sem nome",
    email: u.email || "",
    bio: u.bio || "",
    tipo: u.tipo || tipoGuess || "", // "prof" | "aluno"
  };
}

/* ============ Busca de usuários ============ */
export async function searchUsers(q) {
  if (!q?.trim()) return [];
  const qs = encodeURIComponent(q.trim());

  const [alunosRes, profsRes] = await Promise.allSettled([
    authFetchJSON(`/api/alunos?q=${qs}&limit=8`),
    authFetchJSON(`/api/professores?q=${qs}&limit=8`),
  ]);

  const arr = [];
  if (alunosRes.status === "fulfilled") {
    const list = Array.isArray(alunosRes.value) ? alunosRes.value : (alunosRes.value.data || []);
    arr.push(...list.map(u => normalizeUser(u, "aluno")));
  }
  if (profsRes.status === "fulfilled") {
    const list = Array.isArray(profsRes.value) ? profsRes.value : (profsRes.value.data || []);
    arr.push(...list.map(u => normalizeUser(u, "prof")));
  }

  const seen = new Set(); const out = [];
  for (const u of arr) if (!seen.has(u.id)) { seen.add(u.id); out.push(u); }
  return out.slice(0, 12);
}

/* ============ Conversas ============ */
export async function getConversations() {
  const list = await authFetchJSON("/api/chats");
  return list.map(c => ({
    id: c.id || c._id,
    title: c.other?.nome || c.title || "Conversa",
    other: c.other ? normalizeUser(c.other, c.other?.tipo) : null,
    lastMessage: c.last_message || c.lastMessage || null,
  }));
}

export async function ensureConversationWith(userId) {
  const raw = (userId && typeof userId === "object" && userId.$oid) ? userId.$oid : userId;
  const idStr = String(raw);
  const c = await authFetchJSON("/api/chats", {
    method: "POST",
    body: JSON.stringify({ user_id: idStr }),
  });
  return {
    id: c.id || c._id,
    title: c.other?.nome || "Conversa",
    other: c.other ? normalizeUser(c.other, c.other?.tipo) : null,
    lastMessage: c.last_message || null,
  };
}

/* ============ Mensagens ============ */
export async function getMessages(conversationId) {
  const list = await authFetchJSON(`/api/chats/${conversationId}/messages`);
  return list.map(m => ({
    id: m.id || m._id,
    fromMe: typeof m.fromMe === "boolean" ? m.fromMe
           : (m.from === "me" || m.from_is_me === true) || false,
    text: m.text,
    at: m.created_at || m.at,
  }));
}

export async function sendMessage(conversationId, text) {
  const m = await authFetchJSON(`/api/chats/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
  return {
    id: m.id || m._id,
    fromMe: true,
    text: m.text,
    at: m.created_at || m.at,
  };
}
