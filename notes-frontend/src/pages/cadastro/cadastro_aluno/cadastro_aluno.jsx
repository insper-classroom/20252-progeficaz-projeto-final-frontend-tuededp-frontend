import React, { useState } from 'react';
import HeaderDeslogado from '../../../components/header-deslogado';
import Footer from '../../../components/footer';
import { cadastrarAluno, validarCEP, formatarCPF, formatarTelefone, formatarCEP } from '../../../services/apiService';
import './cadastro_aluno.css';

const CadastroAluno = () => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    interesse: '',
    data_nascimento: '',
    cep: '',
    cidade: '',
    estado: '',
    endereco: '',
    complemento: '',
    senha: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [cepError, setCepError] = useState('');

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

  const handleCEPChange = async (e) => {
    const cep = e.target.value;
    const formattedCEP = formatarCEP(cep);
    
    setFormData(prev => ({
      ...prev,
      cep: formattedCEP
    }));

    // Validar CEP quando tiver 9 caracteres (00000-000)
    if (formattedCEP.length === 9) {
      setLoading(true);
      setCepError('');
      
      const result = await validarCEP(formattedCEP.replace('-', ''));
      
      if (result.success) {
        setFormData(prev => ({
          ...prev,
          rua: result.data.rua,
          cidade: result.data.cidade,
          estado: result.data.estado
        }));
      } else {
        setCepError(result.error);
      }
      
      setLoading(false);
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
      interesse: formData.interesse || null,
      data_nascimento: formData.data_nascimento || null,
      endereco: {
        cep: formData.cep || null,
        rua: formData.rua || null,
        cidade: formData.cidade || null,
        estado: formData.estado || null,
        complemento: formData.complemento || null
      }
    };

    const result = await cadastrarAluno(dadosParaEnvio);

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
    <div className="cadastro-aluno-container">
      <HeaderDeslogado />
      
      <main className="main-content">
        <div className="cadastro-card">
          <h1 className="cadastro-title">Cadastro de Aluno</h1>
          <p className="cadastro-subtitle">Preencha os dados para criar sua conta de aluno</p>
          
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
                <label htmlFor="interesse" className="form-label">Área de interesse:</label>
                <select 
                  id="interesse" 
                  name="interesse"
                  value={formData.interesse}
                  onChange={handleInputChange}
                  className={`form-input ${errors.interesse ? 'error' : ''}`}
                >
                  <option value="">Selecione uma área</option>
                  <option value="programacao">Programação</option>
                  <option value="matematica">Matemática</option>
                  <option value="fisica">Física</option>
                  <option value="quimica">Química</option>
                  <option value="biologia">Biologia</option>
                  <option value="historia">História</option>
                  <option value="geografia">Geografia</option>
                  <option value="portugues">Português</option>
                  <option value="ingles">Inglês</option>
                  <option value="outros">Outros</option>
                </select>
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

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="cep" className="form-label">CEP:</label>
                <input
                  type="text"
                  id="cep"
                  name="cep"
                  value={formData.cep}
                  onChange={handleCEPChange}
                  placeholder="00000-000"
                  className={`form-input ${errors.cep || cepError ? 'error' : ''}`}
                />
                {(errors.cep || cepError) && <span className="error-message">{errors.cep || cepError}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="cidade" className="form-label">Cidade:</label>
                <input
                  type="text"
                  id="cidade"
                  name="cidade"
                  value={formData.cidade}
                  onChange={handleInputChange}
                  placeholder="Digite sua cidade"
                  className={`form-input ${errors.cidade ? 'error' : ''}`}
                />
                {errors.cidade && <span className="error-message">{errors.cidade}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="estado" className="form-label">Estado:</label>
                <select 
                  id="estado" 
                  name="estado"
                  value={formData.estado}
                  onChange={handleInputChange}
                  className={`form-input ${errors.estado ? 'error' : ''}`}
                >
                  <option value="">Selecione o estado</option>
                  <option value="AC">Acre</option>
                  <option value="AL">Alagoas</option>
                  <option value="AP">Amapá</option>
                  <option value="AM">Amazonas</option>
                  <option value="BA">Bahia</option>
                  <option value="CE">Ceará</option>
                  <option value="DF">Distrito Federal</option>
                  <option value="ES">Espírito Santo</option>
                  <option value="GO">Goiás</option>
                  <option value="MA">Maranhão</option>
                  <option value="MT">Mato Grosso</option>
                  <option value="MS">Mato Grosso do Sul</option>
                  <option value="MG">Minas Gerais</option>
                  <option value="PA">Pará</option>
                  <option value="PB">Paraíba</option>
                  <option value="PR">Paraná</option>
                  <option value="PE">Pernambuco</option>
                  <option value="PI">Piauí</option>
                  <option value="RJ">Rio de Janeiro</option>
                  <option value="RN">Rio Grande do Norte</option>
                  <option value="RS">Rio Grande do Sul</option>
                  <option value="RO">Rondônia</option>
                  <option value="RR">Roraima</option>
                  <option value="SC">Santa Catarina</option>
                  <option value="SP">São Paulo</option>
                  <option value="SE">Sergipe</option>
                  <option value="TO">Tocantins</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="endereco" className="form-label">Endereço:</label>
                <input
                  type="text"
                  id="endereco"
                  name="endereco"
                  value={formData.endereco}
                  onChange={handleInputChange}
                  placeholder="Rua, número"
                  className={`form-input ${errors.endereco ? 'error' : ''}`}
                />
                {errors.endereco && <span className="error-message">{errors.endereco}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="complemento" className="form-label">Complemento:</label>
              <input
                type="text"
                id="complemento"
                name="complemento"
                value={formData.complemento}
                onChange={handleInputChange}
                placeholder="Apartamento, bloco, etc. (opcional)"
                className={`form-input ${errors.complemento ? 'error' : ''}`}
              />
              {errors.complemento && <span className="error-message">{errors.complemento}</span>}
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
              {loading ? 'CRIANDO CONTA...' : 'CRIAR CONTA DE ALUNO'}
            </button>
          </form>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default CadastroAluno;
