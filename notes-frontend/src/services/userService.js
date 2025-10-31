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

/** Detecta o tipo de usuário (aluno ou professor) */
function getUserType() {
  // Tenta obter do authService primeiro
  if (Auth.getTipo) {
    const tipoAuth = Auth.getTipo();
    if (tipoAuth) {
      console.log("[getUserType] Tipo do authService:", tipoAuth);
      return tipoAuth;
    }
  }
  
  // Tenta do objeto user
  const me = Auth.getUser?.() || {};
  if (me?.tipo) {
    console.log("[getUserType] Tipo do user object:", me.tipo);
    return me.tipo;
  }
  
  // Tenta do localStorage (chave padrão)
  const tipoStorage = localStorage.getItem("tipo");
  if (tipoStorage) {
    console.log("[getUserType] Tipo do localStorage:", tipoStorage);
    return tipoStorage;
  }
  
  // Fallback: tenta detectar pelo erro de API ou assume aluno
  console.log("[getUserType] Nenhum tipo encontrado, usando default: aluno");
  return "aluno";
}

/** Perfil atual (tenta /me; fallback para /<id>; tenta todas as bases) */
export async function getProfile() {
  // Tenta ambos os endpoints em paralelo ou sequencialmente para detectar o tipo correto
  const endpoints = ["/professores", "/alunos"];
  
  for (const endpoint of endpoints) {
    let r = await fetchAcrossBases(`${endpoint}/me`, { headers: authHeaders() });
    if (r.ok) {
      const user = await r.json();
      // Atualiza o tipo baseado no endpoint que funcionou
      const newTipo = endpoint === "/professores" ? "professor" : "aluno";
      localStorage.setItem("tipo", newTipo);
      if (Auth.setUser && user) Auth.setUser({ ...user, tipo: newTipo });
      return user;
    }
    
    // Se deu 403 mas não é o erro de tipo errado, continua
    if (r.status === 403) {
      const errorData = await r.json().catch(() => ({}));
      if (errorData.msg && errorData.msg.includes("apenas para")) {
        // Tipo errado, tenta próximo endpoint
        continue;
      }
    }
    
    // Se deu 404, tenta com ID
    if (r.status === 404) {
      const id = getLocalUserId();
      if (id && typeof id === 'string' && id.length === 24 && /^[0-9a-fA-F]+$/.test(id)) {
        r = await fetchAcrossBases(`${endpoint}/${id}`, { headers: authHeaders() });
        if (r.ok) {
          const user = await r.json();
          const newTipo = endpoint === "/professores" ? "professor" : "aluno";
          localStorage.setItem("tipo", newTipo);
          if (Auth.setUser && user) Auth.setUser({ ...user, tipo: newTipo });
          return user;
        }
      }
    }
  }

  // Se chegou aqui, nenhum endpoint funcionou
  throw new Error("Não foi possível carregar o perfil. Verifique se você está logado.");
}

/** Atualiza perfil atual (usa /me; fallback para /<id>; tenta todas as bases) */
export async function updateProfile(patch) {
  const toArray = (v) =>
    Array.isArray(v) ? v :
    typeof v === "string" ? v.split(",").map((s) => s.trim()).filter(Boolean) :
    (v ?? []);

  // Prepara o body baseado no tipo detectado, mas vamos tentar ambos se necessário
  let tipoDetectado = getUserType();
  const body = {
    ...patch,
  };
  
  // Campos específicos de alunos (professores não têm esses campos)
  // Mas vamos preparar ambos os casos
  const bodyAluno = {
    ...body,
    especializacoes: toArray(patch.especializacoes),
    quer_ensinar: toArray(patch.quer_ensinar),
    quer_aprender: toArray(patch.quer_aprender),
    idiomas: toArray(patch.idiomas),
    modalidades: toArray(patch.modalidades),
  };
  
  const bodyProfessor = {
    ...body,
    modalidades: toArray(patch.modalidades),
    // Remove campos que não existem para professores
  };
  delete bodyProfessor.especializacoes;
  delete bodyProfessor.quer_ensinar;
  delete bodyProfessor.quer_aprender;
  delete bodyProfessor.idiomas;
  
  delete bodyAluno.email;
  delete bodyProfessor.email;
  
  // Tenta ambos os endpoints
  const endpoints = [
    { path: "/professores", body: bodyProfessor, tipo: "professor" },
    { path: "/alunos", body: bodyAluno, tipo: "aluno" }
  ];
  
  // Se o tipo foi detectado, tenta esse primeiro
  if (tipoDetectado === "professor" || tipoDetectado === "prof") {
    endpoints.reverse(); // Professores primeiro
  }

  for (const { path, body: bodyToSend, tipo } of endpoints) {
    let r = await fetchAcrossBases(`${path}/me`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(bodyToSend),
    });

    if (r.ok) {
      const user = await r.json();
      // Atualiza o tipo baseado no endpoint que funcionou
      localStorage.setItem("tipo", tipo);
      if (Auth.setUser && user) Auth.setUser({ ...user, tipo });
      return user;
    }

    // Se deu 403 com mensagem de tipo errado, tenta próximo
    if (r.status === 403) {
      const errorData = await r.json().catch(() => ({}));
      if (errorData.msg && errorData.msg.includes("apenas para")) {
        // Tipo errado, continua para próximo endpoint
        continue;
      }
      // Outro tipo de 403, lança erro
      throw new Error(errorData.msg || "Acesso negado.");
    }

    // Se deu 404, tenta com ID como fallback
    if (r.status === 404) {
      const id = getLocalUserId();
      if (id && typeof id === 'string' && id.length === 24 && /^[0-9a-fA-F]+$/.test(id)) {
        r = await fetchAcrossBases(`${path}/${id}`, {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify(bodyToSend),
        });
        if (r.ok) {
          const user = await r.json();
          localStorage.setItem("tipo", tipo);
          if (Auth.setUser && user) Auth.setUser({ ...user, tipo });
          return user;
        }
      }
    }

    // Se não foi 403 nem 404, para aqui e lança erro
    if (r.status !== 403 && r.status !== 404) {
      break;
    }
  }

  // Se chegou aqui, nenhum endpoint funcionou
  let msg = "Falha ao salvar perfil";
  try {
    const errorData = await r.json();
    msg = errorData.error || errorData.msg || msg;
  } catch {
    try { 
      msg = await r.text(); 
    } catch {}
  }
  throw new Error(msg);
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

  const tipo = getUserType();
  const tipoPath = tipo === "professor" || tipo === "prof" ? "professores" : "alunos";

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
    `/files/avatar/${tipoPath}/${id}`, // caminho 1 (genérico)
    `/${tipoPath}/${id}/avatar`,       // caminho 2 (muitos backends usam este)
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
