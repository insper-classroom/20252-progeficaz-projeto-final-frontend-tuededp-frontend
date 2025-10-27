// src/services/chatService.js
import * as Auth from "./authService";

// Vite proxy: mantém API vazia
const API = "";

/* ========= helpers ========= */
function normalizeTs(ts) {
  if (!ts) return null;

  try {
    let s = String(ts).trim();

    // "YYYY-MM-DD HH:MM:SS" -> "YYYY-MM-DDTHH:MM:SS"
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(s)) {
      s = s.replace(" ", "T");
    }

    // Remove frações de segundo antes de Z ou offset
    // ex: "2025-10-27T20:38:46.845000+00:00Z" -> "2025-10-27T20:38:46+00:00Z"
    s = s.replace(/\.\d+(?=(?:Z|[+-]\d{2}:\d{2})?$)/, "");

    // Se tiver offset e também 'Z' ao final (tipo "+00:00Z"), remove o 'Z'
    s = s.replace(/([+-]\d{2}:\d{2})Z$/, "$1");

    // Garante timezone se não houver
    if (!/(Z|[+-]\d{2}:\d{2})$/.test(s)) {
      s = s + "Z";
    }

    const d = new Date(s);
    if (isNaN(d.getTime())) {
      console.warn("[normalizeTs] Invalid server timestamp:", ts, "-> normalized:", s);
      return null;
    }
    return s;
  } catch (err) {
    console.warn("[normalizeTs] Error parsing server timestamp:", ts, err);
    return null;
  }
}

/** Fetch com Bearer + JSON + erros detalhados */
async function authFetchJSON(path, opts = {}) {
  // Não alterar a barra final para evitar redirects que dropam Authorization
  const finalPath = String(path);

  const token = Auth.getToken?.() || localStorage.getItem("token");
  if (!token) console.warn("[auth] token ausente no localStorage!");
  console.debug("[authFetchJSON] token present:", !!token);

  let callerHeaders = {};
  if (opts.headers instanceof Headers) {
    opts.headers.forEach((v, k) => {
      callerHeaders[k] = v;
    });
  } else if (opts.headers && typeof opts.headers === "object") {
    callerHeaders = { ...opts.headers };
  }

  const authKey = Object.keys(callerHeaders).find((k) => k.toLowerCase() === "authorization");
  if (token && (!authKey || !callerHeaders[authKey])) {
    callerHeaders["Authorization"] = `Bearer ${token}`;
  }

  const hasContentType = Object.keys(callerHeaders).some(
    (k) => k.toLowerCase() === "content-type"
  );
  if (opts.body && !(opts.body instanceof FormData) && !hasContentType) {
    callerHeaders["Content-Type"] = "application/json";
  }

  try {
    console.debug("[authFetchJSON] fetch", `${API}${finalPath}`, {
      method: opts.method || "GET",
      headers: Object.keys(callerHeaders).reduce((acc, k) => {
        acc[k] = k.toLowerCase() === "authorization" ? "[REDACTED]" : callerHeaders[k];
        return acc;
      }, {}),
    });
  } catch (e) {
    // ignore
  }

  let res;
  try {
    res = await fetch(`${API}${finalPath}`, {
      method: opts.method || "GET",
      ...opts,
      headers: callerHeaders,
    });
  } catch (err) {
    throw new Error(`[authFetchJSON] network error ${path}: ${err.message}`);
  }

  const raw = await res.text();
  let data;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = raw;
  }

  if (!res.ok) {
    if (res.status === 401) {
      try {
        console.warn("[authFetchJSON] 401 — token present:", !!token, "path:", finalPath);
      } catch (e) {}
    }
    const detail =
      typeof data === "string" ? data : data?.msg || data?.error || JSON.stringify(data);
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
    const list = Array.isArray(alunosRes.value)
      ? alunosRes.value
      : alunosRes.value.data || [];
    arr.push(...list.map((u) => normalizeUser(u, "aluno")));
  }
  if (profsRes.status === "fulfilled") {
    const list = Array.isArray(profsRes.value)
      ? profsRes.value
      : profsRes.value.data || [];
    arr.push(...list.map((u) => normalizeUser(u, "prof")));
  }

  const seen = new Set();
  const out = [];
  for (const u of arr) if (!seen.has(u.id)) { seen.add(u.id); out.push(u); }
  return out.slice(0, 12);
}

/* ============ Conversas ============ */
export async function getConversations() {
  const list = await authFetchJSON("/api/chats/");
  return list.map((c) => {
    const lmRaw = c.last_message || c.lastMessage || null;
    const at = normalizeTs(
      (lmRaw && (lmRaw.at || lmRaw.created_at || lmRaw.createdAt)) ||
        c.updated_at ||
        c.updatedAt ||
        c.created_at ||
        c.createdAt ||
        null
    );
    return {
      id: c.id || c._id,
      title: c.other?.nome || c.title || "Conversa",
      other: c.other ? normalizeUser(c.other, c.other?.tipo) : null,
      lastMessage: lmRaw ? { text: lmRaw.text ?? "", at } : at ? { text: "", at } : null,
    };
  });
}

export async function ensureConversationWith(userId) {
  const raw = userId && typeof userId === "object" && userId.$oid ? userId.$oid : userId;
  const idStr = String(raw);
  const c = await authFetchJSON("/api/chats", {
    method: "POST",
    body: JSON.stringify({ user_id: idStr }),
  });
  return {
    id: c.id || c._id,
    title: c.other?.nome || "Conversa",
    other: c.other ? normalizeUser(c.other, c.other?.tipo) : null,
    lastMessage: c.last_message
      ? { text: c.last_message.text ?? "", at: normalizeTs(c.last_message.at) }
      : null,
  };
}

/* ============ Mensagens ============ */
export async function getMessages(conversationId, opts = {}) {
  const since = opts.since ? `?since=${encodeURIComponent(opts.since)}` : "";
  const list = await authFetchJSON(`/api/chats/${conversationId}/messages${since}`);
  return list.map((m) => {
    // Sempre preferir timestamps do servidor
    const serverTime = m.at || m.created_at || m.createdAt;
    const at = serverTime ? normalizeTs(serverTime) : null;

    return {
      id: m.id || m._id,
      fromMe:
        typeof m.fromMe === "boolean"
          ? m.fromMe
          : m.from === "me" || m.from_is_me === true || false,
      text: m.text,
      at, // normalized server time
      created_at: at, // manter os dois campos consistentes
    };
  });
}

export async function sendMessage(conversationId, text) {
  const m = await authFetchJSON(`/api/chats/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });

  try {
    console.debug("[sendMessage] server response:", {
      id: m.id || m._id,
      hasAt: !!(m.at || m.created_at || m.createdAt),
      textLen: typeof m.text === "string" ? m.text.length : 0,
    });
  } catch (e) {}

  // Sempre usar o horário do servidor
  const serverTime = m.at || m.created_at || m.createdAt;
  if (!serverTime) {
    console.warn(
      "[sendMessage] Server did not provide timestamp for message; using client time as fallback:",
      m
    );
  }
  let at = normalizeTs(serverTime);
  if (!at) {
    at = new Date().toISOString();
  }

  if (!m.id && !m._id) {
    console.warn(
      "[sendMessage] Server did not return a persistent id for the message; it may not be saved on the server yet.",
      m
    );
  }

  return {
    id: m.id || m._id || null,
    fromMe: true,
    text: m.text,
    at, // normalized server time (or client fallback)
    created_at: at,
  };
}
