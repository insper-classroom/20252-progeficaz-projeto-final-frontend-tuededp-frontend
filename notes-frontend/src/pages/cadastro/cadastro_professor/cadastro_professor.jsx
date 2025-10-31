import React, { useState } from 'react';
import HeaderDeslogado from '../../../components/header-deslogado';
import Footer from '../../../components/footer';
import { useNavigate} from "react-router-dom";
import { cadastrarProfessor, formatarCPF, formatarTelefone } from '../../../services/apiService';
import './cadastro_professor.css';

const CadastroProfessor = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    area: '',  
    data_nascimento: '',
    historico_academico_profissional: '',
    endereco: '',
    senha: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpar erro do campo quando usuário começar a digitar
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    // Preparar dados para envio
    const dadosParaEnvio = {
      nome: formData.nome,
      email: formData.email,
      senha: formData.senha,
      telefone: formData.telefone || null,
      cpf: formData.cpf || null,
      area: formData.area || null,  
      data_nascimento: formData.data_nascimento || null,
      bio: formData.historico_academico_profissional || null,
      endereco: formData.endereco || null
    };

    console.log('🔍 Dados sendo enviados:', dadosParaEnvio);
    console.log('🔍 Area selecionada:', formData.area);

    const result = await cadastrarProfessor(dadosParaEnvio);

    if (result.success) {
      alert('Cadastro realizado com sucesso!');
      // Redirecionar para login ou dashboard
      window.location.href = '/login';
    } else {
      if (result.errors) {
        setErrors(result.errors);
      } else {
        alert(result.message);
      }
    }

    setLoading(false);
  };

  return (
    <div className="cadastro-professor-container">
      <HeaderDeslogado />

        <div className="voltar-seta" onClick={() => navigate('/cadastro-escolha')} title="Voltar">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.2"  
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </div>

      <main className="main-content">
        <div className="cadastro-card">
          <h1 className="cadastro-title">Cadastro de Professor</h1>
          <p className="cadastro-subtitle">Preencha os dados para criar sua conta de professor</p>
          
          <form className="cadastro-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="nome" className="form-label">Nome completo:</label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  placeholder="Digite seu nome completo"
                  className={`form-input ${errors.nome ? 'error' : ''}`}
                  required
                />
                {errors.nome && <span className="error-message">{errors.nome}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="email" className="form-label">E-mail:</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Digite seu email"
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  required
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="telefone" className="form-label">Telefone:</label>
                <input
                  type="tel"
                  id="telefone"
                  name="telefone"
                  value={formData.telefone}
                  onChange={(e) => {
                    const formatted = formatarTelefone(e.target.value);
                    setFormData(prev => ({ ...prev, telefone: formatted }));
                  }}
                  placeholder="(11) 99999-9999"
                  className={`form-input ${errors.telefone ? 'error' : ''}`}
                />
                {errors.telefone && <span className="error-message">{errors.telefone}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="cpf" className="form-label">CPF:</label>
                <input
                  type="text"
                  id="cpf"
                  name="cpf"
                  value={formData.cpf}
                  onChange={(e) => {
                    const formatted = formatarCPF(e.target.value);
                    setFormData(prev => ({ ...prev, cpf: formatted }));
                  }}
                  placeholder="000.000.000-00"
                  className={`form-input ${errors.cpf ? 'error' : ''}`}
                />
                {errors.cpf && <span className="error-message">{errors.cpf}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="area" className="form-label">Área de especialização:</label>
                <select 
                  id="area" 
                  name="area"
                  value={formData.area}
                  onChange={handleInputChange}
                  className={`form-input ${errors.area ? 'error' : ''}`}
                >
                  <option value="">Selecione uma área</option>
                  <option value="Programação">Programação</option>
                  <option value="Matemática">Matemática</option>
                  <option value="Física">Física</option>
                  <option value="Química">Química</option>
                  <option value="Biologia">Biologia</option>
                  <option value="História">História</option>
                  <option value="Geografia">Geografia</option>
                  <option value="Português">Português</option>
                  <option value="Inglês">Inglês</option>
                  <option value="Filosofia">Filosofia</option>
                  <option value="Sociologia">Sociologia</option>
                  <option value="Educação Física">Educação Física</option>
                  <option value="Artes">Artes</option>
                  <option value="Outros">Outros</option>
                </select>
                {errors.area && <span className="error-message">{errors.area}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="dataNascimento" className="form-label">Data de nascimento:</label>
                <input
                  type="date"
                  id="dataNascimento"
                  name="data_nascimento"
                  value={formData.data_nascimento}
                  onChange={handleInputChange}
                  className={`form-input ${errors.data_nascimento ? 'error' : ''}`}
                />
                {errors.data_nascimento && <span className="error-message">{errors.data_nascimento}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="historicoAcademico" className="form-label">Histórico Acadêmico e Profissional:</label>
              <textarea
                id="historicoAcademico"
                name="historico_academico_profissional"
                value={formData.historico_academico_profissional}
                onChange={handleInputChange}
                placeholder="Descreva sua formação acadêmica, experiência profissional, certificações, etc."
                className={`form-input form-textarea ${errors.bio ? 'error' : ''}`}
                rows="4"
              ></textarea>
              {errors.bio && <span className="error-message">{errors.bio}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="endereco" className="form-label">Endereço completo:</label>
              <input
                type="text"
                id="endereco"
                name="endereco"
                value={formData.endereco}
                onChange={handleInputChange}
                placeholder="Rua, número, bairro, cidade, estado"
                className={`form-input ${errors.endereco ? 'error' : ''}`}
              />
              {errors.endereco && <span className="error-message">{errors.endereco}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="senha" className="form-label">Senha:</label>
              <input
                type="password"
                id="senha"
                name="senha"
                value={formData.senha}
                onChange={handleInputChange}
                placeholder="Digite sua senha"
                className={`form-input ${errors.senha ? 'error' : ''}`}
                required
              />
              {errors.senha && <span className="error-message">{errors.senha}</span>}
            </div>
            
            <button 
              type="submit" 
              className="cadastro-button"
              disabled={loading}
            >
              {loading ? 'CRIANDO CONTA...' : 'CRIAR CONTA DE PROFESSOR'}
            </button>
           {/* 🔹 Botão Voltar adicionado */}
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                type="button"
                className="btn--outline"
                onClick={() => navigate('/cadastro-escolha')}
              >
                Voltar
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CadastroProfessor;