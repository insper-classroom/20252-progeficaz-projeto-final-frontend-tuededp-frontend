// src/services/authService.js
// Serviço de Autenticação (SPA-friendly)

const API_BASE_URL = ""; // usando proxy do Vite

/* ========== Storage Helpers ========== */
export function getToken() {
  return localStorage.getItem("token");
}

export function getUser() {
  const raw = localStorage.getItem("user");
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}

export function isLoggedIn() {
  return !!getToken();
}

export function setUser(nextUser) {
  if (nextUser) {
    localStorage.setItem("user", JSON.stringify(nextUser));
  } else {
    localStorage.removeItem("user");
  }
  try { window.dispatchEvent(new Event("storage")); } catch {}
}

function saveSession({ access_token, token, user, tipo }) {
  // support backends that return either `access_token` or `token`
  const tk = access_token || token;
  if (tk) localStorage.setItem("token", tk);
  if (user) localStorage.setItem("user", JSON.stringify(user));
  if (tipo) localStorage.setItem("tipo", tipo);
  try { window.dispatchEvent(new Event("storage")); } catch {}
}

/* ========== Auth API ========== */

// LOGIN — não redireciona; a tela decide pra onde ir
export async function login(email, password) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ msg: "Erro no servidor" }));
      return { success: false, error: err.msg || "Erro no servidor" };
    }

    const data = await res.json();
    saveSession({
      access_token: data.access_token,
      token: data.token,
      user: data.user,
      tipo: data.tipo,
    });

    return { success: true, data };
  } catch {
    return { success: false, error: "Erro de conexão" };
  }
}

// REGISTER — salva sessão e devolve controle à tela
export async function register(payload) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ msg: "Erro no cadastro" }));
      return { success: false, error: err.msg || "Erro no cadastro" };
    }

    const data = await res.json();
    if (data?.access_token || data?.token) {
      saveSession({
        access_token: data.access_token,
        token: data.token,
        user: data.user,
        tipo: data.tipo,
      });
    }
    return { success: true, data };
  } catch {
    return { success: false, error: "Erro de conexão" };
  }
}

// ✅ NOVO: puxa do backend e atualiza o user local (útil após edições)
export async function refreshUser() {
  const token = getToken();
  if (!token) return null;
  const res = await fetch(`${API_BASE_URL}/api/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const me = await res.json();
  setUser(me);
  return me;
}

// Verificar token
export async function verificarToken() {
  const token = getToken();
  if (!token) return false;
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/verificar`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

// LOGOUT
export function logout(opts = { redirect: true }) {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("tipo");
  try { window.dispatchEvent(new Event("storage")); } catch {}
  if (opts.redirect) window.location.href = "/login";
}

// Guard simples
export function requireAuth(opts = { redirect: true }) {
  const ok = isLoggedIn();
  if (!ok && opts.redirect) {
    window.location.href = "/login";
    return false;
  }
  return ok;
}
