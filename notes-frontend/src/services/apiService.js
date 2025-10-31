// Serviço de API para integração com backend
const API_BASE_URL = 'http://localhost:5000';

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