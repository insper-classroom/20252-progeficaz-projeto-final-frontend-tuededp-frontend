// Serviço de Autenticação
const API_BASE_URL = ''; // Usar proxy do Vite

// Função de Login
export async function login(email, password) {
  try {
    console.log('Tentando fazer login com:', { email, password });
    console.log('URL da API:', `${API_BASE_URL}/api/auth/login`);
    
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    console.log('Status da resposta:', response.status);
    console.log('Headers da resposta:', response.headers);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ msg: 'Erro desconhecido' }));
      console.error('Erro na resposta:', errorData);
      alert(errorData.msg || 'Erro no servidor');
      return { success: false, error: errorData.msg || 'Erro no servidor' };
    }

    const data = await response.json();
    console.log('Dados recebidos:', data);

    // Salvar dados no localStorage
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('tipo', data.tipo);

    // Redirecionar baseado no tipo
    if (data.tipo === 'aluno') {
      window.location.href = '/dashboard-aluno';
    } else if (data.tipo === 'professor') {
      window.location.href = '/dashboard-professor';
    } else {
      window.location.href = '/dashboard';
    }

    return { success: true, data };
  } catch (error) {
    console.error('Erro no login: ', error);
    console.error('Tipo do erro:', error.name);
    console.error('Mensagem do erro:', error.message);
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      alert('Erro de conexão: Verifique se o backend está rodando em http://localhost:5000');
    } else {
      alert('Erro de conexão: ' + error.message);
    }
    
    return { success: false, error: 'Erro de conexão' };
  }
}

// Função de Verificação de Token
export async function verificarToken() {
  const token = localStorage.getItem('token');
  if (!token) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/verificar`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Função de Logout
export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('tipo');
  window.location.href = '/login';
}

// Proteção de Rotas
export function requireAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login';
    return false;
  }
  return true;
}

// Obter dados do usuário
export function getUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

// Obter token
export function getToken() {
  return localStorage.getItem('token');
}

// Verificar se está logado
export function isLoggedIn() {
  return !!localStorage.getItem('token');
}
