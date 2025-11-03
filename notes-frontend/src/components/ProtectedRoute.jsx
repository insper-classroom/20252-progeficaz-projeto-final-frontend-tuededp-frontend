import React from 'react';
import { Navigate } from 'react-router-dom';
import { isLoggedIn, getTipo } from '../services/authService';

/**
 * Componente que protege rotas baseado em autenticação e tipo de usuário
 * @param {Object} props
 * @param {React.ReactElement} props.children - Componente a ser renderizado se autorizado
 * @param {string} props.requiredTipo - Tipo de usuário requerido ('aluno' ou 'prof' ou 'professor')
 * @param {string} props.redirectTo - Rota para redirecionar se não autorizado (padrão: '/login')
 */
const ProtectedRoute = ({ children, requiredTipo, redirectTo = '/login' }) => {
  // Se não está logado, redireciona para login
  if (!isLoggedIn()) {
    return <Navigate to={redirectTo} replace />;
  }

  // Verificar tipo de usuário
  const userTipo = getTipo();
  const tipoNormalizado = userTipo?.toLowerCase();
  const requiredTipoNormalizado = requiredTipo?.toLowerCase();

  // Mapear possíveis valores de tipo
  const tipoMap = {
    'prof': 'prof',
    'professor': 'prof',
    'aluno': 'aluno',
    'student': 'aluno'
  };

  const tipoAtual = tipoMap[tipoNormalizado] || tipoNormalizado;
  const tipoRequerido = tipoMap[requiredTipoNormalizado] || requiredTipoNormalizado;

  // Se o tipo não corresponde, redirecionar para o dashboard correto
  if (tipoAtual !== tipoRequerido) {
    if (tipoAtual === 'prof') {
      return <Navigate to="/dashboard-professor" replace />;
    } else if (tipoAtual === 'aluno') {
      return <Navigate to="/dashboard-aluno" replace />;
    } else {
      // Tipo desconhecido ou não definido, redireciona para login
      return <Navigate to={redirectTo} replace />;
    }
  }

  // Se passou todas as verificações, renderizar o componente filho
  return children;
};

export default ProtectedRoute;

