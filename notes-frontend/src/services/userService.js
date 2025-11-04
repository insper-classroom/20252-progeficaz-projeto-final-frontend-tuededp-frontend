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

/** Detecta o tipo de usuário (aluno ou professor).
 *  Retorna: "professor" | "aluno" | null (quando não detectado)
 *  Preferência: Auth.getTipo -> Auth.getUser().tipo -> localStorage.tipo
 */
function getUserType() {
  try {
    // 1) authService (mais confiável)
    if (Auth.getTipo) {
      const t = Auth.getTipo();
      if (t) return String(t).toLowerCase();
    }

    // 2) objeto user salvo
    const me = Auth.getUser?.() || {};
    if (me?.tipo) return String(me.tipo).toLowerCase();

    // 3) localStorage (fallback)
    const ls = localStorage.getItem("tipo");
    if (ls) return String(ls).toLowerCase();

  } catch (e) {
    console.debug("[getUserType] erro ao detectar tipo:", e);
  }

  // retorna null se não for possível determinar
  return null;
}

/** Normaliza string/array -> array de strings */
function toArray(v) {
  if (v === undefined || v === null) return [];
  if (Array.isArray(v)) return v.map(String).map(s => s.trim()).filter(Boolean);
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return [];
    // tenta JSON parse se for string JSON
    if (s.startsWith("[") || s.startsWith("{")) {
      try {
        const parsed = JSON.parse(s);
        return Array.isArray(parsed) ? parsed.map(String).map(x => x.trim()).filter(Boolean) : [];
      } catch (e) {
        // se não for JSON válido, cai para split por vírgula
      }
    }
    return s.split(",").map(x => x.trim()).filter(Boolean);
  }
  return [];
}

/** Tenta interpretar valor como array de objetos ou undefined */
function toArrayOfObjectsOrUndefined(v) {
  if (v === undefined || v === null) return undefined;
  if (Array.isArray(v)) return v;
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return undefined;
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return parsed;
      return undefined;
    } catch (e) {
      // não é JSON -> não sobrescrever
      return undefined;
    }
  }
  return undefined;
}

/** Tenta interpretar disponibilidade (objeto) */
function toObjectOrUndefined(v) {
  if (v === undefined || v === null) return undefined;
  if (typeof v === "object") return v;
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return undefined;
    try {
      const parsed = JSON.parse(s);
      if (parsed && typeof parsed === "object") return parsed;
      return undefined;
    } catch (e) {
      return undefined;
    }
  }
  return undefined;
}

/** Perfil atual (tenta /professores/me e /alunos/me).
 *  Tenta ambos; se um responder OK, retorna; se 403 com mensagem "apenas para" tenta o outro.
 *  Se 404 tenta com ID salvo localmente.
 */
export async function getProfile() {
  // ordem: tentamos professores primeiro (porque perfil professor costuma ter mais campos),
  // mas se houver indicação no localStorage/Auth, preferimos essa ordem.
  const preferido = getUserType(); // "professor" | "aluno" | null
  const order = preferido === "professor" ? ["/professores", "/alunos"] : preferido === "aluno" ? ["/alunos", "/professores"] : ["/professores", "/alunos"];

  let lastErr = null;
  for (const endpoint of order) {
    try {
      let r = await fetchAcrossBases(`${endpoint}/me`, { headers: authHeaders() });
      if (r.ok) {
        const user = await r.json();
        const tipo = endpoint === "/professores" ? "professor" : "aluno";
        localStorage.setItem("tipo", tipo);
        if (Auth.setUser && user) Auth.setUser({ ...user, tipo });
        return user;
      }

      // 403 pode ser "tipo errado" -> tentar próximo
      if (r.status === 403) {
        lastErr = r;
        try {
          const body = await r.json().catch(() => ({}));
          if (body.msg && body.msg.includes("apenas para")) {
            console.debug(`[getProfile] ${endpoint}/me retornou 403 tipo errado, tentando próximo endpoint`);
            continue;
          } else {
            // outro tipo de 403 -> lançar
            throw new Error(body.msg || "Acesso negado");
          }
        } catch (e) {
          // se parse falhar, continua para próximo endpoint
          continue;
        }
      }

      // 404: tentar com ID local
      if (r.status === 404) {
        const id = getLocalUserId();
        if (id && typeof id === "string" && id.length === 24 && /^[0-9a-fA-F]+$/.test(id)) {
          r = await fetchAcrossBases(`${endpoint}/${id}`, { headers: authHeaders() });
          if (r.ok) {
            const user = await r.json();
            const tipo = endpoint === "/professores" ? "professor" : "aluno";
            localStorage.setItem("tipo", tipo);
            if (Auth.setUser && user) Auth.setUser({ ...user, tipo });
            return user;
          }
        }
      }

      lastErr = r;
    } catch (e) {
      lastErr = e;
    }
  }

  if (lastErr instanceof Response) {
    try {
      const body = await lastErr.json().catch(() => null);
      const msg = (body && (body.error || body.msg)) || `HTTP ${lastErr.status}`;
      throw new Error(msg);
    } catch (e) {
      throw new Error("Não foi possível carregar o perfil (resposta inválida).");
    }
  }
  throw lastErr || new Error("Não foi possível carregar o perfil. Verifique se você está logado.");
}

/** Atualiza perfil atual (usa /me; fallback para /<id>; tenta ambas as bases).
 *  Normaliza campos que podem vir como string (vírgula-separated) ou JSON.
 */
export async function updateProfile(patch) {
  // Prepara
  const tipoDetectado = getUserType();
  const idLocal = getLocalUserId();

  // Campos comuns: fazemos shallow copy do patch
  const common = { ...patch };

  // ---- Monta bodyAluno ----
  const bodyAluno = { ...common };
  if (patch.quer_aprender !== undefined) bodyAluno.quer_aprender = toArray(patch.quer_aprender);
  if (patch.idiomas !== undefined) bodyAluno.idiomas = toArray(patch.idiomas);
  if (patch.modalidades !== undefined) bodyAluno.modalidades = toArray(patch.modalidades);
  if (patch.valor_hora !== undefined) bodyAluno.valor_hora = (patch.valor_hora === null ? null : Number(patch.valor_hora));
  // Remover campos que são típicos de professor para evitar sobrescrita indevida
  delete bodyAluno.quer_ensinar;
  delete bodyAluno.especializacoes;
  delete bodyAluno.experiencias;
  delete bodyAluno.formacao;
  delete bodyAluno.certificacoes;
  delete bodyAluno.projetos;
  delete bodyAluno.disponibilidade;

  // ---- Monta bodyProfessor ----
  const bodyProfessor = { ...common };
  if (patch.especializacoes !== undefined) bodyProfessor.especializacoes = toArray(patch.especializacoes);
  if (patch.quer_ensinar !== undefined) bodyProfessor.quer_ensinar = toArray(patch.quer_ensinar);
  if (patch.modalidades !== undefined) bodyProfessor.modalidades = toArray(patch.modalidades);
  if (patch.valor_hora !== undefined) bodyProfessor.valor_hora = (patch.valor_hora === null ? null : Number(patch.valor_hora));
  const experienciasArr = toArrayOfObjectsOrUndefined(patch.experiencias);
  if (experienciasArr !== undefined) bodyProfessor.experiencias = experienciasArr;
  const formacaoArr = toArrayOfObjectsOrUndefined(patch.formacao);
  if (formacaoArr !== undefined) bodyProfessor.formacao = formacaoArr;
  const certsArr = toArrayOfObjectsOrUndefined(patch.certificacoes);
  if (certsArr !== undefined) bodyProfessor.certificacoes = certsArr;
  const projetosArr = toArrayOfObjectsOrUndefined(patch.projetos);
  if (projetosArr !== undefined) bodyProfessor.projetos = projetosArr;
  const dispObj = toObjectOrUndefined(patch.disponibilidade);
  if (dispObj !== undefined) bodyProfessor.disponibilidade = dispObj;
  // Remover campos de aluno
  delete bodyProfessor.quer_aprender;

  // Nunca envie email no patch
  delete bodyAluno.email;
  delete bodyProfessor.email;

  // Ordem de tentativa baseada no tipo detectado (se detectar professor, tenta professores primeiro)
  let endpoints = [
    { path: "/professores", body: bodyProfessor, tipo: "professor" },
    { path: "/alunos", body: bodyAluno, tipo: "aluno" }
  ];
  if (tipoDetectado && (tipoDetectado.toLowerCase() === "professor" || tipoDetectado.toLowerCase() === "prof")) {
    // já está professor primeiro — se quiser inverter quando tipoDetectado === 'aluno' você pode
    // aqui mantemos professores primeiro quando detectado professor
  } else if (tipoDetectado && tipoDetectado.toLowerCase() === "aluno") {
    endpoints = endpoints.reverse();
  }

  let lastResponse = null;

  for (const { path, body: bodyToSend, tipo } of endpoints) {
    try {
      let r = await fetchAcrossBases(`${path}/me`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(bodyToSend),
      });

      lastResponse = r;

      if (r.ok) {
        const user = await r.json();
        localStorage.setItem("tipo", tipo);
        if (Auth.setUser && user) Auth.setUser({ ...user, tipo });
        return user;
      }

      // Se deu 403 com mensagem de tipo errado, tenta próximo endpoint
      if (r.status === 403) {
        const errorData = await r.json().catch(() => ({}));
        if (errorData.msg && errorData.msg.includes("apenas para")) {
          // Tipo errado, continua
          continue;
        }
        // outro 403: lançar
        throw new Error(errorData.msg || "Acesso negado.");
      }

      // Se deu 404, tenta com ID como fallback
      if (r.status === 404 && idLocal && typeof idLocal === "string" && idLocal.length === 24 && /^[0-9a-fA-F]+$/.test(idLocal)) {
        r = await fetchAcrossBases(`${path}/${idLocal}`, {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify(bodyToSend),
        });
        lastResponse = r;
        if (r.ok) {
          const user = await r.json();
          localStorage.setItem("tipo", tipo);
          if (Auth.setUser && user) Auth.setUser({ ...user, tipo });
          return user;
        }
      }

      // Se não foi 403 nem 404, sai do loop e trata erro
      if (r.status !== 403 && r.status !== 404) {
        break;
      }
    } catch (e) {
      lastResponse = e;
      // tenta próximo endpoint
    }
  }

  // Se chegou aqui, nenhum endpoint funcionou
  let msg = "Falha ao salvar perfil";
  try {
    if (lastResponse && typeof lastResponse.json === "function") {
      const errBody = await lastResponse.json().catch(() => null);
      if (errBody) msg = errBody.error || errBody.msg || JSON.stringify(errBody);
    } else if (lastResponse) {
      msg = String(lastResponse);
    }
  } catch (e) { /* ignore */ }

  throw new Error(msg);
}

/** Perfil público por slug (sem JWT) */
export async function getAlunoBySlug(slug) {
  const r = await fetchAcrossBases(`/alunos/slug/${slug}`);
  if (!r.ok) throw new Error("Perfil não encontrado");
  return r.json();
}

export async function uploadAvatar(file) {
  const me = Auth.getUser?.() || {};
  const id = me?._id || me?.id;
  if (!id) throw new Error("Usuário local sem ID. Faça login novamente.");

  if (!(file instanceof File)) throw new Error("Arquivo inválido.");
  if (file.size > 2 * 1024 * 1024) throw new Error("Arquivo acima de 2MB.");
  if (!/^image\/(png|jpe?g|webp|gif)$/i.test(file.type)) {
    throw new Error("Formato não suportado. Use PNG/JPG/WEBP.");
  }

  const tipo = (Auth.getTipo?.() || me?.tipo || "").toLowerCase();
  const tipoPath = (tipo === "professor" || tipo === "prof") ? "professores" : "alunos";

  const form = new FormData();
  form.append("avatar", file);
  form.append("file", file);

  const token = Auth.getToken?.() || localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  // **ÚNICA** rota esperada pelo back:
  const url = `/api/files/avatar/${tipoPath}/${id}`;

  const r = await fetch(url, { method: "POST", headers, body: form });
  if (!r.ok) {
    const txt = await r.text().catch(() => `HTTP ${r.status}`);
    throw new Error(`Falha no upload: ${txt}`);
  }

  const j = await r.json().catch(() => ({}));
  const avatarUrl = j?.avatarUrl || j?.avatar_url || j?.url || j?.user?.avatarUrl || j?.user?.avatar_url;
  if (avatarUrl) {
    const cur = Auth.getUser?.() || {};
    Auth.setUser?.({ ...cur, avatarUrl });
  } else if (j?.user) {
    Auth.setUser?.(j.user);
  }
  return j;
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
