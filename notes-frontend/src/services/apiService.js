// Serviço de API para integração com backend
const API_BASE_URL = 'http://localhost:5000';

// Buscar estatísticas gerais da plataforma
export const buscarEstatisticas = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/stats`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[buscarEstatisticas] Erro na resposta:', errorData);
      return { error: errorData.error || 'Erro ao buscar estatísticas' };
    }
    
    const data = await response.json();
    console.log('[buscarEstatisticas] Dados recebidos:', data);
    
    return { 
      totalAlunos: data.total_alunos || 0,
      totalProfessores: data.total_professores || 0,
      totalAulas: data.total_aulas || 0
    };
  } catch (error) {
    console.error('[buscarEstatisticas] Erro ao buscar estatísticas:', error);
    return { error: 'Não foi possível conectar ao servidor' };
  }
};

// Função para validar CEP
export const validarCEP = async (cep) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/checa_cep/${cep}`);
    const data = await response.json();
    
    if (response.ok) {
      return {
        success: true,
        data: {
          rua: data.logradouro,
          cidade: data.localidade,
          estado: data.uf
        }
      };
    } else {
      return {
        success: false,
        error: data.msg || 'CEP inválido'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: 'Erro ao validar CEP'
    };
  }
};

// Função para cadastrar aluno
export const cadastrarAluno = async (dados) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/alunos/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dados)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return {
        success: true,
        data: data
      };
    } else {
      return {
        success: false,
        errors: data.errors || {},
        message: data.msg || 'Erro no cadastro'
      };
    }
  } catch (error) {
    return {
      success: false,
      message: 'Erro de conexão'
    };
  }
};

// Função para cadastrar professor
export const cadastrarProfessor = async (dados) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/professores/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dados)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return {
        success: true,
        data: data
      };
    } else {
      return {
        success: false,
        errors: data.errors || {},
        message: data.msg || 'Erro no cadastro'
      };
    }
  } catch (error) {
    return {
      success: false,
      message: 'Erro de conexão'
    };
  }
};

// Função para formatar CPF
export const formatarCPF = (cpf) => {
  return cpf.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

// Função para formatar telefone
export const formatarTelefone = (telefone) => {
  return telefone.replace(/\D/g, '').replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
};

// Função para formatar CEP
export const formatarCEP = (cep) => {
  return cep.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2');
};

// Função para buscar agendamentos de um professor
export const buscarAgendamentosProfessor = async (professorId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/agenda?professor=${professorId}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `Erro ${response.status}: ${response.statusText}`
      };
    }
    
    const data = await response.json();
    return {
      success: true,
      data: data.data || []
    };
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    return {
      success: false,
      error: error.message || 'Erro de conexão'
    };
  }
};

// Função para buscar avaliações de um professor
export const buscarAvaliacoesProfessor = async (professorId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/avaliacoes?professor=${professorId}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `Erro ${response.status}: ${response.statusText}`
      };
    }
    
    const data = await response.json();
    return {
      success: true,
      data: data.data || []
    };
  } catch (error) {
    console.error('Erro ao buscar avaliações:', error);
    return {
      success: false,
      error: error.message || 'Erro de conexão'
    };
  }
};

// Função para buscar estatísticas de avaliações do professor
export const buscarStatsProfessor = async (professorId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/avaliacoes/professor/${professorId}/stats`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `Erro ${response.status}: ${response.statusText}`
      };
    }
    
    const data = await response.json();
    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return {
      success: false,
      error: error.message || 'Erro de conexão'
    };
  }
};

// Função para buscar professores
// Buscar professores em alta (melhores avaliações)
export const buscarProfessoresEmAlta = async (limit = 6) => {
  try {
    const url = `${API_BASE_URL}/api/professores/destaque?limit=${limit}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { error: errorData.error || 'Erro ao buscar professores em alta' };
    }
    
    const data = await response.json();
    return { data: data.data || [], total: data.total || 0 };
  } catch (error) {
    console.error('Erro ao buscar professores em alta:', error);
    return { error: 'Não foi possível conectar ao servidor' };
  }
};

export const buscarProfessores = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.q) queryParams.append('q', params.q);
    if (params.cidade) queryParams.append('cidade', params.cidade);
    if (params.estado) queryParams.append('estado', params.estado);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    
    const response = await fetch(`${API_BASE_URL}/api/professores?${queryParams}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `Erro ${response.status}: ${response.statusText}`
      };
    }
    
    const data = await response.json();
    return {
      success: true,
      data: data.data || [],
      total: data.total || 0
    };
  } catch (error) {
    console.error('Erro ao buscar professores:', error);
    return {
      success: false,
      error: error.message || 'Erro de conexão'
    };
  }
};

// Função para buscar aulas de um professor
export const buscarAulasProfessor = async (professorId) => {
  try {
    // Busca todas as aulas do professor (sem filtrar por status no backend)
    // O backend retornará todas as aulas que pertencem ao professor
    const url = `${API_BASE_URL}/api/aulas?professor=${professorId}`;
    console.log('[buscarAulasProfessor] Buscando aulas em:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[buscarAulasProfessor] Erro na resposta:', errorData);
      return {
        success: false,
        error: errorData.error || `Erro ${response.status}: ${response.statusText}`
      };
    }
    
    const data = await response.json();
    console.log('[buscarAulasProfessor] Resposta do backend:', data);
    console.log('[buscarAulasProfessor] Total de aulas retornadas:', data.total || 0);
    console.log('[buscarAulasProfessor] Array de aulas:', data.data);
    
    // Filtra apenas aulas com status que permitem agendamento
    // Exclui apenas aulas canceladas ou concluídas
    const todasAulas = data.data || [];
    const aulasValidas = todasAulas.filter(aula => {
      const status = aula.status?.toLowerCase();
      const valida = status && !['cancelada', 'concluida'].includes(status);
      if (!valida) {
        console.log('[buscarAulasProfessor] Aula filtrada (status inválido):', aula.titulo, 'status:', status);
      }
      return valida;
    });
    
    console.log('[buscarAulasProfessor] Aulas válidas após filtro:', aulasValidas.length);
    
    return {
      success: true,
      data: aulasValidas
    };
  } catch (error) {
    console.error('Erro ao buscar aulas do professor:', error);
    return {
      success: false,
      error: error.message || 'Erro de conexão'
    };
  }
};

// Função para criar agendamento
export const criarAgendamento = async (agendamentoData) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return {
        success: false,
        error: 'Você precisa estar logado para agendar uma aula'
      };
    }

    console.log('[criarAgendamento] Enviando dados:', agendamentoData);
    
    const response = await fetch(`${API_BASE_URL}/api/agenda`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(agendamentoData)
    });
    
    console.log('[criarAgendamento] Status da resposta:', response.status);
    
    if (!response.ok) {
      let errorData = {};
      try {
        const text = await response.text();
        console.error('[criarAgendamento] Resposta de erro:', text);
        errorData = JSON.parse(text);
      } catch (parseError) {
        errorData = { error: `Erro ${response.status}: ${response.statusText}` };
      }
      
      return {
        success: false,
        error: errorData.error || errorData.msg || `Erro ${response.status}: ${response.statusText}`
      };
    }
    
    const data = await response.json();
    console.log('[criarAgendamento] Agendamento criado com sucesso:', data);
    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    if (error.message === 'Failed to fetch') {
      return {
        success: false,
        error: 'Erro de conexão. Verifique se o backend está rodando e se não há erros de CORS no console.'
      };
    }
    return {
      success: false,
      error: error.message || 'Erro de conexão'
    };
  }
};

// Função para buscar usuários (alunos e professores) para busca
export const buscarUsuarios = async (query, limit = 10) => {
  try {
    if (!query || query.length < 2) {
      return {
        success: true,
        data: []
      };
    }

    // Buscar alunos e professores em paralelo
    const [alunosRes, professoresRes] = await Promise.all([
      fetch(`${API_BASE_URL}/api/alunos?q=${encodeURIComponent(query)}&limit=${limit}`),
      fetch(`${API_BASE_URL}/api/professores?q=${encodeURIComponent(query)}&limit=${limit}`)
    ]);

    const alunos = alunosRes.ok ? (await alunosRes.json()).data || [] : [];
    const professores = professoresRes.ok ? (await professoresRes.json()).data || [] : [];

    // Combinar resultados
    const resultados = [
      ...alunos.map(aluno => ({
        ...aluno,
        tipo: 'aluno',
        slug: aluno.slug || criarSlug(aluno.nome),
        url: `/aluno/${aluno.slug || criarSlug(aluno.nome)}`
      })),
      ...professores.map(prof => ({
        ...prof,
        tipo: 'professor',
        slug: prof.slug || criarSlug(prof.nome),
        url: `/professor/${prof.slug || criarSlug(prof.nome)}`
      }))
    ];

    return {
      success: true,
      data: resultados
    };
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return {
      success: false,
      error: error.message || 'Erro de conexão',
      data: []
    };
  }
};

// Função auxiliar para criar slug a partir do nome
function criarSlug(nome) {
  if (!nome) return '';
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Função para buscar todas as categorias
export const buscarCategorias = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/categorias`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `Erro ${response.status}: ${response.statusText}`
      };
    }
    
    const data = await response.json();
    return {
      success: true,
      data: data.data || []
    };
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    if (error.message === 'Failed to fetch') {
      return {
        success: false,
        error: 'Não foi possível conectar ao servidor. Verifique se o backend está rodando.',
        data: []
      };
    }
    return {
      success: false,
      error: error.message || 'Erro de conexão',
      data: []
    };
  }
};

// Função para criar uma nova aula
export const criarAula = async (aulaData) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return {
        success: false,
        error: 'Você precisa estar logado para criar uma aula'
      };
    }

    console.log('[criarAula] Enviando dados:', aulaData);
    console.log('[criarAula] URL:', `${API_BASE_URL}/api/aulas`);
    console.log('[criarAula] Token presente:', !!token);
    
    const response = await fetch(`${API_BASE_URL}/api/aulas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(aulaData)
    }).catch((fetchError) => {
      console.error('[criarAula] Erro na requisição fetch:', fetchError);
      throw fetchError;
    });
    
    console.log('[criarAula] Status da resposta:', response.status);
    console.log('[criarAula] Headers da resposta:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      let errorData = {};
      try {
        const text = await response.text();
        console.error('[criarAula] Resposta de erro (texto):', text);
        errorData = JSON.parse(text);
      } catch (parseError) {
        console.error('[criarAula] Erro ao fazer parse da resposta:', parseError);
        errorData = { error: `Erro ${response.status}: ${response.statusText}` };
      }
      
      console.error('[criarAula] Erro na resposta:', errorData);
      return {
        success: false,
        error: errorData.error || errorData.msg || `Erro ${response.status}: ${response.statusText}`
      };
    }
    
    const data = await response.json().catch((jsonError) => {
      console.error('[criarAula] Erro ao fazer parse do JSON de sucesso:', jsonError);
      throw new Error('Resposta do servidor inválida');
    });
    
    console.log('[criarAula] Aula criada com sucesso:', data);
    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('Erro ao criar aula:', error);
    console.error('Tipo do erro:', error.constructor.name);
    console.error('Mensagem do erro:', error.message);
    console.error('Stack:', error.stack);
    
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      return {
        success: false,
        error: 'Erro de conexão. Verifique se o backend está rodando em http://localhost:5000 e se não há erros de CORS no console.'
      };
    }
    return {
      success: false,
      error: error.message || 'Erro desconhecido ao criar aula'
    };
  }
};

// Função para buscar aulas do professor logado
export const buscarMinhasAulas = async (professorId, params = {}) => {
  try {
    if (!professorId) {
      return {
        success: false,
        error: 'ID do professor não fornecido',
        data: []
      };
    }

    const queryParams = new URLSearchParams();
    queryParams.append('professor', professorId);
    if (params.status) queryParams.append('status', params.status);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    
    const url = `${API_BASE_URL}/api/aulas?${queryParams.toString()}`;
    console.log('[buscarMinhasAulas] URL:', url);
    
    const token = localStorage.getItem('token');
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[buscarMinhasAulas] Erro na resposta:', response.status, errorData);
      return {
        success: false,
        error: errorData.error || `Erro ${response.status}: ${response.statusText}`
      };
    }
    
    const data = await response.json();
    console.log('[buscarMinhasAulas] Dados recebidos:', data);
    console.log('[buscarMinhasAulas] Total de aulas:', data.total || 0);
    console.log('[buscarMinhasAulas] Array de aulas:', data.data || []);
    
    // Log detalhado de cada aula encontrada
    if (data.data && data.data.length > 0) {
      data.data.forEach((aula, index) => {
        console.log(`[buscarMinhasAulas] Aula ${index + 1}:`, {
          _id: aula._id,
          titulo: aula.titulo,
          id_professor: aula.id_professor,
          professor_obj: aula.professor
        });
      });
    }
    
    return {
      success: true,
      data: data.data || [],
      total: data.total || 0
    };
  } catch (error) {
    console.error('Erro ao buscar minhas aulas:', error);
    if (error.message === 'Failed to fetch') {
      return {
        success: false,
        error: 'Não foi possível conectar ao servidor. Verifique se o backend está rodando.',
        data: []
      };
    }
    return {
      success: false,
      error: error.message || 'Erro de conexão',
      data: []
    };
  }
};