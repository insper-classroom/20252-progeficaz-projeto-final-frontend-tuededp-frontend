// src/services/userService.js
// Serviços do usuário (perfil)

import { getToken, setUser, getUser } from "./authService";

const API = ""; // proxy Vite

function authFetch(url, options = {}) {
  const token = getToken();
  return fetch(`${API}${url}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
}

// GET perfil
export async function getProfile() {
  const res = await authFetch("/api/me", { method: "GET" });
  if (!res.ok) throw new Error((await res.json().catch(()=>({msg:"Erro"}))).msg || "Erro ao carregar perfil");
  return res.json();
}

// UPDATE perfil — ✅ atualiza o localStorage para refletir no header
export async function updateProfile(payload) {
  const res = await authFetch("/api/me", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error((await res.json().catch(()=>({msg:"Erro"}))).msg || "Erro ao atualizar perfil");
  const updated = await res.json();

  // Algumas APIs retornam o objeto user, outras retornam só campos.
  // Estratégia: merge do user atual com o retorno.
  const current = getUser() || {};
  const nextUser = updated?.user
    ? updated.user
    : { ...current, ...payload, ...(updated || {}) };

  setUser(nextUser); // 🔄 atualiza header instantaneamente
  return updated;
}

// Trocar senha
export async function changePassword(payload) {
  const res = await authFetch("/api/me/password", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error((await res.json().catch(()=>({msg:"Erro"}))).msg || "Erro ao alterar senha");
  return res.json();
}

// Upload de avatar — ✅ persiste avatarUrl no user local
export async function uploadAvatar(file) {
  const form = new FormData();
  form.append("avatar", file);

  const res = await authFetch("/api/me/avatar", { method: "POST", body: form });
  if (!res.ok) throw new Error((await res.json().catch(()=>({msg:"Erro"}))).msg || "Erro ao enviar avatar");
  const data = await res.json(); // ideal { avatarUrl } ou { user }

  const current = getUser() || {};
  const nextUser = data?.user ? data.user : { ...current, avatarUrl: data?.avatarUrl };
  if (nextUser) setUser(nextUser);

  return data;
}
