// src/services/chatService.js
import * as Auth from "./authService";

const API = "";

/* ========= helpers ========= */
function isFilled(v) {
  return v !== undefined && v !== null && !(typeof v === "string" && v.trim() === "");
}
function preferFilled(...vals) {
  for (const v of vals) if (isFilled(v)) return v;
  return ""; // padrão seguro para strings
}

function normalizeTs(ts) {
  if (!ts) return null;
  try {
    let s = String(ts).trim();
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(s)) s = s.replace(" ", "T");
    s = s.replace(/\.\d+(?=(?:Z|[+-]\d{2}:\d{2})?$)/, "");
    s = s.replace(/([+-]\d{2}:\d{2})Z$/, "$1");
    if (!/(Z|[+-]\d{2}:\d{2})$/.test(s)) s = s + "Z";
    const d = new Date(s);
    if (isNaN(d.getTime())) return null;
    return s;
  } catch {
    return null;
  }
}

/** Fetch com Bearer + JSON + erros detalhados */
async function authFetchJSON(path, opts = {}) {
  const finalPath = String(path);
  const token = Auth.getToken?.() || localStorage.getItem("token");

  let callerHeaders = {};
  if (opts.headers instanceof Headers) {
    opts.headers.forEach((v, k) => (callerHeaders[k] = v));
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
    const detail =
      typeof data === "string" ? data : data?.msg || data?.error || JSON.stringify(data);
    throw new Error(`HTTP ${res.status} ${path} → ${detail}`);
  }
  return data;
}

/* ============ Normalizadores ============ */
function normalizeId(any) {
  if (!any) return null;
  if (typeof any === "string") return any;
  if (typeof any === "object") {
    if (any.$oid) return any.$oid;
    if (any._id?.$oid) return any._id.$oid;
    if (any._id && typeof any._id === "string") return any._id;
  }
  try { return String(any); } catch { return null; }
}

function normalizeUser(u, tipoGuess) {
  const id =
    u?.id ??
    u?._id?.$oid ??
    u?._id ??
    null;

  return {
    id: normalizeId(id),
    nome: u?.nome || u?.name || u?.fullname || "Sem nome",
    email: u?.email || "",
    bio: u?.bio || u?.headline || "",
    avatarUrl: u?.avatarUrl || u?.avatar_url || "",
    tipo: u?.tipo || tipoGuess || "", // "prof" | "aluno"
  };
}

/** Tenta descobrir o ID do "outro" participante com várias formas possíveis do backend */
function extractOtherId(c, meId) {
  const meStr = String(meId || "");
  // 1) participants: pode ser array de strings OU objetos
  if (Array.isArray(c?.participants)) {
    const ids = c.participants
      .map((p) => (typeof p === "string" ? p : p?._id?.$oid || p?._id || p?.id))
      .map(normalizeId)
      .filter(Boolean);
    const other = ids.find((id) => String(id) !== meStr);
    if (other) return other;
  }
  // 2) tentativas diretas comuns
  const candidates = [
    c?.other_id, c?.peer_id, c?.to_id, c?.with_id,
    c?.otherId, c?.peerId, c?.toId, c?.withId,
    c?.to, c?.with, c?.user_to, c?.user_b, c?.userB, c?.userTwo,
  ].map(normalizeId).filter(Boolean);

  if (c?.other && (c.other._id || c.other.id)) {
    candidates.unshift(normalizeId(c.other._id || c.other.id));
  }

  return candidates.find((id) => String(id) !== meStr) || null;
}

/* Carrega dados mínimos do peer (aluno/prof) quando a conversa não trouxe */
async function fetchPeerBrief(id) {
  const peerId = normalizeId(id);
  if (!peerId) return { id: peerId };
  try {
    const a = await authFetchJSON(`/api/alunos/${peerId}`);
    return normalizeUser(a, "aluno");
  } catch {
    try {
      const p = await authFetchJSON(`/api/professores/${peerId}`);
      return normalizeUser(p, "prof");
    } catch {
      return { id: peerId };
    }
  }
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
    const list = Array.isArray(alunosRes.value) ? alunosRes.value : alunosRes.value.data || [];
    arr.push(...list.map((u) => normalizeUser(u, "aluno")));
  }
  if (profsRes.status === "fulfilled") {
    const list = Array.isArray(profsRes.value) ? profsRes.value : profsRes.value.data || [];
    arr.push(...list.map((u) => normalizeUser(u, "prof")));
  }

  const seen = new Set();
  const out = [];
  for (const u of arr) if (!seen.has(u.id)) { seen.add(u.id); out.push(u); }
  return out.slice(0, 12);
}

/* ============ Conversas ============ */
export async function getConversations() {
  const payload = await authFetchJSON("/api/chats/");
  const listRaw = Array.isArray(payload?.data) ? payload.data : payload;

  const me = Auth.getUser?.() || {};
  const meId = me._id || me.id;

  const base = (listRaw || []).map((c) => {
    const lm = c.last_message || c.lastMessage || null;
    const at = normalizeTs(
      (lm && (lm.at || lm.created_at || lm.createdAt)) ||
      c.updated_at || c.updatedAt || c.created_at || c.createdAt || null
    );

    let other = c.other ? normalizeUser(c.other, c.other?.tipo) : null;
    if (!other || !other.id) {
      const otherId = extractOtherId(c, meId);
      other = otherId ? { id: otherId } : null;
    }

    return {
      id: c.id || c._id,
      title: c.other?.nome || c.title || "Conversa",
      other,
      lastMessage: lm ? { text: lm.text ?? "", at } : at ? { text: "", at } : null,
      created_at: c.created_at || c.createdAt,
      updated_at: c.updated_at || c.updatedAt,
      participants: c.participants || [],
    };
  });

  // >>> ENRICH com preferFilled (não deixa "" sobrescrever campo bom)
  const enriched = await Promise.all(
    base.map(async (c) => {
      if (!c.other || !c.other.id) return c;

      const brief = await fetchPeerBrief(c.other.id);
      const mergedOther = {
        id: c.other.id,
        nome:     preferFilled(c.other.nome, brief.nome),
        email:    preferFilled(c.other.email, brief.email),
        bio:      preferFilled(c.other.bio, brief.bio),
        avatarUrl:preferFilled(c.other.avatarUrl, brief.avatarUrl),
        tipo:     preferFilled(c.other.tipo, brief.tipo),
      };

      return {
        ...c,
        title: preferFilled(c.title, mergedOther.nome, "Conversa"),
        other: mergedOther,
      };
    })
  );

  return enriched;
}


/* ============ Criar/garantir conversa ============ */
export async function ensureConversationWith(userId) {
  const raw = userId && typeof userId === "object" && userId.$oid ? userId.$oid : userId;
  const idStr = normalizeId(raw);
  const c = await authFetchJSON("/api/chats", {
    method: "POST",
    body: JSON.stringify({ user_id: idStr }),
  });

  const brief = await fetchPeerBrief(idStr);
  const fromServer = c.other ? normalizeUser(c.other, c.other?.tipo) : {};
  const other = {
    id: idStr,
    nome:      preferFilled(fromServer.nome, brief.nome),
    email:     preferFilled(fromServer.email, brief.email),
    bio:       preferFilled(fromServer.bio, brief.bio),
    avatarUrl: preferFilled(fromServer.avatarUrl, brief.avatarUrl),
    tipo:      preferFilled(fromServer.tipo, brief.tipo),
  };

  return {
    id: c.id || c._id,
    title: preferFilled(c.other?.nome, other.nome, "Conversa"),
    other,
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
    const serverTime = m.at || m.created_at || m.createdAt;
    const at = serverTime ? normalizeTs(serverTime) : null;
    return {
      id: m.id || m._id,
      fromMe:
        typeof m.fromMe === "boolean"
          ? m.fromMe
          : m.from === "me" || m.from_is_me === true || false,
      text: m.text,
      at,
      created_at: at,
    };
  });
}

export async function sendMessage(conversationId, text) {
  const m = await authFetchJSON(`/api/chats/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
  const serverTime = m.at || m.created_at || m.createdAt;
  let at = normalizeTs(serverTime);
  if (!at) at = new Date().toISOString();
  return {
    id: m.id || m._id || null,
    fromMe: true,
    text: m.text,
    at,
    created_at: at,
  };
}
