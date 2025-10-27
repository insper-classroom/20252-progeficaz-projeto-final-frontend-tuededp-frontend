// src/services/chatService.js
import * as Auth from "./authService";   // <— evita sombreamento

// Use empty API for Vite proxy (it will proxy /api/* to the backend)
const API = "";

/** Fetch com Bearer + JSON + erros detalhados */
async function authFetchJSON(path, opts = {}) {
  // Add trailing slash only to the path part, preserving query parameters
  const [basePath, query] = path.split('?');
  const normalizedPath = basePath.endsWith('/') ? basePath : `${basePath}/`;
  const finalPath = query ? `${normalizedPath}?${query}` : normalizedPath;
  
  // try Auth.getToken, but fallback to localStorage directly if something odd is happening
  const token = Auth.getToken?.() || localStorage.getItem("token");
  if (!token) console.warn("[auth] token ausente no localStorage!");

  // Build headers carefully: support Headers instances, start from caller headers,
  // ensure Authorization is set unless the caller explicitly provided a non-empty one.
  let callerHeaders = {};
  if (opts.headers instanceof Headers) {
    // Convert Headers to plain object
    opts.headers.forEach((v, k) => { callerHeaders[k] = v; });
  } else if (opts.headers && typeof opts.headers === "object") {
    callerHeaders = { ...opts.headers };
  }

  const headerKeys = Object.keys(callerHeaders);
  const authKeyName = headerKeys.find(k => k.toLowerCase() === "authorization");
  // If caller didn't provide Authorization or provided it empty, attach our token
  if (token && (!authKeyName || !callerHeaders[authKeyName])) {
    callerHeaders["Authorization"] = `Bearer ${token}`;
  }

  // Set Content-Type only when sending a plain JSON body (not FormData) and when not provided
  const headerKeysLower = Object.keys(callerHeaders).map(k => k.toLowerCase());
  if (
    opts.body &&
    !(opts.body instanceof FormData) &&
    !headerKeysLower.includes("content-type")
  ) {
    callerHeaders["Content-Type"] = "application/json";
  }

  // Enhanced debug logging
  const tokenLen = token ? String(token).length : 0;
  const tokenFirst10 = token ? `${token.slice(0, 10)}...` : 'null';
  const authVal = callerHeaders[authKeyName || "Authorization"];
  const authInfo = authVal ? `present (len=${String(authVal).length})` : "absent";
  
  console.debug(
    "[authFetchJSON] FULL request details:",
    "\n- path:", path,
    "\n- token in storage:", tokenLen ? `present (len=${tokenLen})` : "absent",
    "\n- token preview:", tokenFirst10,
    "\n- headers:", Object.fromEntries(
      Object.entries(callerHeaders).map(([k, v]) => 
        [k, k.toLowerCase() === "authorization" ? `<masked-len-${String(v).length}>` : v]
      )
    ),
    "\n- raw token from Auth.getToken():", Auth.getToken()?.slice(0, 10) + "...",
    "\n- raw token from localStorage:", localStorage.getItem("token")?.slice(0, 10) + "..."
  );

  let res;
  try {
    res = await fetch(`${API}${finalPath}`, {
      method: "GET",
      ...opts,
      headers: callerHeaders,
    });
  } catch (err) {
    // Network / CORS failures
    throw new Error(`[authFetchJSON] network error ${path}: ${err.message}`);
  }

  const raw = await res.text();
  let data;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error("[authFetchJSON] JSON parse error:", err, "Raw response:", raw);
    data = raw;
  }

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
  const list = await authFetchJSON("/api/chats/");  // Add trailing slash
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
