// services/userService.js
import * as Auth from "./authService";

/**
 * Base(s) de API:
 * - Usa VITE_API_BASE se definida (ex.: http://localhost:5000/api)
 * - Caso contrário usa "/api" (proxy do Vite)
 * - E inclui fallback "http://localhost:5000/api" para o dev
 */
const ENV_BASE = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE) || "";
const NORM = (s) => String(s || "").replace(/\/+$/, "");
const BASES = [NORM(ENV_BASE) || "/api"];

// fallback útil quando o proxy /api não está configurado/ativo
if (!BASES.includes("http://localhost:5000/api")) {
  BASES.push("http://localhost:5000/api");
}

function authHeaders() {
  const token = Auth.getToken?.() || localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/** helper: id do usuário salvo localmente */
function getLocalUserId() {
  const me = Auth.getUser?.() || {};
  return me?._id || me?.id || null;
}

/** Faz fetch tentando múltiplas bases ("/api", depois "http://localhost:5000/api", etc.) */
async function fetchAcrossBases(path, init = {}) {
  let lastErr = null;
  for (const base of BASES) {
    const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
    try {
      const r = await fetch(url, init);
      // 404 pode ser do host errado; tenta próxima base
      if (r.status === 404) {
        lastErr = r;
        console.debug(`[userService] 404 em ${url}, tentando próxima base...`);
        continue;
      }
      return r; // qualquer outro status retorna (para o caller decidir)
    } catch (e) {
      lastErr = e;
      console.debug(`[userService] falha em ${url}:`, e);
      // tenta próxima base
    }
  }
  // se todas falharem, propaga o último erro/resposta
  if (lastErr instanceof Response) return lastErr;
  throw lastErr || new Error("Falha de rede");
}

/** Perfil atual (tenta /me; fallback para /<id>; tenta todas as bases) */
export async function getProfile() {
  // 1) tenta /me atravessando as bases
  let r = await fetchAcrossBases("/alunos/me", { headers: authHeaders() });
  if (r.ok) return r.json();

  // 2) se /me deu 404, tenta /<id>
  if (r.status === 404) {
    const id = getLocalUserId();
    if (!id) throw new Error("Usuário local sem ID. Faça login novamente.");
    r = await fetchAcrossBases(`/alunos/${id}`, { headers: authHeaders() });
    if (r.ok) return r.json();
  }

  // 3) erro: tenta extrair texto útil
  const txt = await (r.text?.() ?? Promise.resolve(""));
  throw new Error(txt || "Não foi possível carregar o perfil");
}

/** Atualiza perfil atual (usa /me; fallback para /<id>; tenta todas as bases) */
export async function updateProfile(patch) {
  const toArray = (v) =>
    Array.isArray(v) ? v :
    typeof v === "string" ? v.split(",").map((s) => s.trim()).filter(Boolean) :
    (v ?? []);

  const body = {
    ...patch,
    especializacoes: toArray(patch.especializacoes),
    quer_ensinar:    toArray(patch.quer_ensinar),
    quer_aprender:   toArray(patch.quer_aprender),
    idiomas:         toArray(patch.idiomas),
    modalidades:     toArray(patch.modalidades),
  };
  delete body.email; // email não é alterado aqui

  let r = await fetchAcrossBases("/alunos/me", {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });

  // fallback PUT /<id> se /me não existir
  if (r.status === 404) {
    const id = getLocalUserId();
    if (!id) throw new Error("Usuário local sem ID. Faça login novamente.");
    r = await fetchAcrossBases(`/alunos/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
  }

  if (!r.ok) {
    let msg = "Falha ao salvar perfil";
    try {
      const j = await r.json();
      msg = j?.error || msg;
    } catch {
      try { msg = await r.text(); } catch {}
    }
    throw new Error(msg);
  }

  const user = await r.json();
  Auth.setUser?.(user);
  return user;
}

/** Perfil público por slug (sem JWT) */
export async function getAlunoBySlug(slug) {
  const r = await fetchAcrossBases(`/alunos/slug/${slug}`);
  if (!r.ok) throw new Error("Perfil não encontrado");
  return r.json();
}

/** Upload de avatar (mantém endpoint existente) */
export async function uploadAvatar(file) {
  const me = Auth.getUser?.() || {};
  const id = me?._id || me?.id;
  if (!id) throw new Error("Usuário local sem ID. Faça login novamente.");

  // Validações básicas de UX (opcional)
  if (!(file instanceof File)) throw new Error("Arquivo inválido.");
  if (file.size > 2 * 1024 * 1024) throw new Error("Arquivo acima de 2MB.");
  if (!/^image\/(png|jpe?g|webp|gif)$/i.test(file.type)) {
    throw new Error("Formato não suportado. Use PNG/JPG/WEBP.");
  }

  // Monta o FormData — enviamos duas chaves para cobrir variações de backends
  const makeForm = () => {
    const form = new FormData();
    form.append("file", file);
    form.append("avatar", file);
    return form;
  };

  // headers: NUNCA setar Content-Type manualmente em multipart
  const headers = {};
  const token = Auth.getToken?.() || localStorage.getItem("token");
  if (token) headers["Authorization"] = `Bearer ${token}`;

  // Tentamos múltiplos caminhos em todas as bases
  const paths = [
    `/files/avatar/alunos/${id}`, // caminho 1 (que você já tinha)
    `/alunos/${id}/avatar`,       // caminho 2 (muitos backends usam este)
  ];

  let lastErr = null;
  for (const base of BASES) {
    for (const p of paths) {
      const url = `${base}${p}`;
      try {
        const r = await fetch(url, { method: "POST", headers, body: makeForm() });
        if (r.ok) {
          const j = await r.json();
          // Normaliza possíveis formatos de retorno
          const avatarUrl = j?.avatarUrl || j?.user?.avatarUrl || j?.url || j?.avatar_url;
          if (avatarUrl) {
            Auth.setUser?.({ ...(Auth.getUser?.() || {}), avatarUrl });
          } else if (j?.user) {
            Auth.setUser?.(j.user);
          }
          return j;
        }
        // se não for ok, guarda a mensagem e tenta próximo path/base
        lastErr = await r.text().catch(() => `HTTP ${r.status}`);
      } catch (e) {
        lastErr = e?.message || "Falha de rede";
        // segue tentando as próximas combinações
      }
    }
  }

  throw new Error(
    typeof lastErr === "string" ? lastErr :
    lastErr?.message || "Falha no upload (verifique proxy/CORS e endpoint)."
  );
}
/** Troca de senha (se o seu back expõe esse endpoint) */
export async function changePassword({ senhaAtual, novaSenha }) {
  const r = await fetchAcrossBases(`/auth/change-password`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ senhaAtual, novaSenha }),
  });
  if (!r.ok) throw new Error("Falha ao alterar senha");
  return r.json();
}
