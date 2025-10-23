import React, { useState } from 'react';
import HeaderDeslogado from '../../components/header-deslogado';
import Footer from '../../components/footer';
import { login } from '../../services/authService';
import './login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login(email, password);
    } catch (error) {
      console.error('Erro no login:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignupClick = () => {
    window.location.href = '/cadastro';
  };

  return (
    <div className="login-container">
      {/* Header */}
      <HeaderDeslogado />

      {/* Main Content */}
      <main className="main-content">
        <div className="login-card">
          <h1 className="login-title">Login</h1>
          <p className="login-subtitle">Acesse sua conta para continuar</p>
          
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email" className="form-label">E-mail:</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Digite seu email"
                className="form-input"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password" className="form-label">Senha:</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                className="form-input"
                required
              />
            </div>
            
            <div className="forgot-password">
              <a href="#" className="forgot-link">Esqueceu sua senha?</a>
            </div>
            
            <button 
              type="submit" 
              className="login-button"
              disabled={loading}
            >
              {loading ? 'ENTRANDO...' : 'ENTRAR'}
            </button>
            
            <div className="signup-section">
              <p className="signup-text">Não tem uma conta?</p>
              <button 
                type="button" 
                className="signup-button"
                onClick={handleSignupClick}
              >
                CRIAR CONTA
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Login;
