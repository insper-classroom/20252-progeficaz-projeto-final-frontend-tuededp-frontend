// src/services/avaliacoesService.js
import { getToken } from './authService';

const API_BASE_URL = ""; // usando proxy do Vite

function authHeaders() {
  const token = getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

/**
 * Criar uma nova avaliação
 * @param {Object} avaliacao - { id_aluno, id_aula, id_prof, nota (0-10), texto }
 */
export async function criarAvaliacao(avaliacao) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/avaliacoes`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(avaliacao),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ msg: "Erro ao criar avaliação" }));
      throw new Error(error.msg || error.message || "Erro ao criar avaliação");
    }

    return await response.json();
  } catch (err) {
    throw err;
  }
}

/**
 * Listar avaliações com filtros opcionais
 * @param {Object} filtros - { id_aluno, id_aula, id_prof }
 */
export async function listarAvaliacoes(filtros = {}) {
  try {
    const params = new URLSearchParams();
    Object.entries(filtros).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    const query = params.toString();
    const url = `${API_BASE_URL}/api/avaliacoes${query ? `?${query}` : ""}`;
    
    const response = await fetch(url, {
      headers: authHeaders(),
    });

    if (!response.ok) {
      throw new Error("Erro ao buscar avaliações");
    }

    const data = await response.json();
    return Array.isArray(data) ? data : (data.data || []);
  } catch (err) {
    throw err;
  }
}

/**
 * Editar uma avaliação existente
 * @param {string} id - ID da avaliação
 * @param {Object} atualizacao - { nota, texto }
 */
export async function editarAvaliacao(id, atualizacao) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/avaliacoes/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(atualizacao),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ msg: "Erro ao editar avaliação" }));
      throw new Error(error.msg || error.message || "Erro ao editar avaliação");
    }

    return await response.json();
  } catch (err) {
    throw err;
  }
}

/**
 * Remover uma avaliação
 * @param {string} id - ID da avaliação
 */
export async function removerAvaliacao(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/avaliacoes/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });

    if (!response.ok) {
      throw new Error("Erro ao remover avaliação");
    }

    return true;
  } catch (err) {
    throw err;
  }
}

/**
 * Buscar estatísticas de avaliações de um professor
 * @param {string} professorId - ID do professor
 */
export async function getEstatisticasProfessor(professorId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/avaliacoes/professor/${professorId}/stats`, {
      headers: authHeaders(),
    });

    if (!response.ok) {
      // Se não encontrar, retorna null (pode não ter avaliações ainda)
      if (response.status === 404) return null;
      throw new Error("Erro ao buscar estatísticas");
    }

    return await response.json();
  } catch (err) {
    console.error("[avaliacoes] Erro ao buscar stats do professor:", err);
    return null;
  }
}

/**
 * Buscar estatísticas de avaliações de uma aula
 * @param {string} aulaId - ID da aula
 */
export async function getEstatisticasAula(aulaId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/avaliacoes/aula/${aulaId}/stats`, {
      headers: authHeaders(),
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error("Erro ao buscar estatísticas da aula");
    }

    return await response.json();
  } catch (err) {
    console.error("[avaliacoes] Erro ao buscar stats da aula:", err);
    return null;
  }
}

