import React, { useState, useEffect } from 'react';
import HeaderLogado from "../../components/header-logado";
import Footer from "../../components/footer";
import { buscarCategorias, criarAula, buscarMinhasAulas } from '../../services/apiService';
import { getUser } from '../../services/authService';
import './home-professor.css';

export default function HomeProfessor() {
  const user = getUser();
  const [mostrarForm, setMostrarForm] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [minhasAulas, setMinhasAulas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(null);
  
  const [formData, setFormData] = useState({
    titulo: '',
    descricao_aula: '',
    preco_decimal: '',
    id_categoria: '',
    id_professor: user?._id || user?.id || ''
  });

  useEffect(() => {
    if (user?._id || user?.id) {
      carregarDados();
    }
    
    // Recarregar dados quando a página volta ao foco (útil quando o usuário volta de outra aba)
    const handleFocus = () => {
      if (user?._id || user?.id) {
        carregarDados();
      }
    };
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [user?._id, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const carregarDados = async () => {
    setLoading(true);
    setErro(null);
    try {
      const professorId = user?._id || user?.id;
      if (!professorId) {
        setErro('ID do professor não encontrado. Faça login novamente.');
        setLoading(false);
        return;
      }

      // Buscar dados separadamente para identificar qual está falhando
      try {
        const catsRes = await buscarCategorias();
        if (catsRes.success) {
          setCategorias(catsRes.data);
        } else {
          console.warn('Erro ao buscar categorias:', catsRes.error);
          // Não bloqueia a página se categorias falharem
        }
      } catch (error) {
        console.warn('Erro ao buscar categorias:', error);
        // Não bloqueia a página se categorias falharem
      }

      try {
        const aulasRes = await buscarMinhasAulas(professorId);
        if (aulasRes.success) {
          console.log('[home-professor] Aulas recebidas:', aulasRes.data);
          aulasRes.data.forEach((aula, index) => {
            console.log(`[home-professor] Aula ${index + 1}:`, {
              titulo: aula.titulo,
              status: aula.status,
              id: aula._id
            });
          });
          setMinhasAulas(aulasRes.data);
        } else {
          const errorMsg = aulasRes.error || 'Erro ao carregar aulas';
          if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError')) {
            setErro('Não foi possível conectar ao servidor. Verifique se o backend está rodando em http://localhost:5000');
          } else {
            setErro(errorMsg);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar aulas:', error);
        if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
          setErro('Não foi possível conectar ao servidor. Verifique se o backend está rodando em http://localhost:5000');
        } else {
          setErro('Erro ao carregar aulas: ' + (error.message || 'Erro desconhecido'));
        }
      }
    } catch (error) {
      console.error('Erro geral ao carregar dados:', error);
      if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
        setErro('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
      } else {
        setErro('Erro ao carregar dados: ' + (error.message || 'Erro desconhecido'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(null);
    setSucesso(null);
    setSalvando(true);

    try {
      // Validar campos obrigatórios
      if (!formData.titulo) {
        setErro('Título da aula é obrigatório');
        setSalvando(false);
        return;
      }

      // Garantir que o ID do professor está preenchido
      const professorId = user?._id || user?.id;
      if (!professorId) {
        setErro('ID do professor não encontrado. Faça login novamente.');
        setSalvando(false);
        return;
      }

      // Converter preço para número
      const aulaData = {
        titulo: formData.titulo,
        descricao_aula: formData.descricao_aula || null,
        preco_decimal: formData.preco_decimal ? parseFloat(formData.preco_decimal) : null,
        id_categoria: formData.id_categoria || null,
        id_professor: professorId
      };

      const resultado = await criarAula(aulaData);

      if (resultado.success) {
        setSucesso('Aula criada com sucesso!');
        const professorId = user?._id || user?.id || '';
        setFormData({
          titulo: '',
          descricao_aula: '',
          preco_decimal: '',
          id_categoria: '',
          id_professor: professorId
        });
        setMostrarForm(false);
        // Recarrega a lista de aulas imediatamente
        await carregarDados();
      } else {
        setErro(resultado.error || 'Erro ao criar aula');
      }
    } catch (error) {
      console.error('Erro ao criar aula:', error);
      setErro('Erro ao processar solicitação');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="home-professor">
      <HeaderLogado />
      
      <main className="hp-main">
        <div className="hp-container">
          <header className="hp-header">
            <h1>Bem-vindo, {user?.nome || 'Professor'}!</h1>
            <p>Gerencie suas aulas e acompanhe seus alunos.</p>
            <button 
              className="btn btn--primary"
              onClick={() => setMostrarForm(!mostrarForm)}
            >
              {mostrarForm ? 'Cancelar' : '+ Criar Nova Aula'}
            </button>
          </header>

          {(erro || sucesso) && (
            <div className={`alert ${erro ? 'alert--error' : 'alert--ok'}`}>
              {erro || sucesso}
            </div>
          )}

          {mostrarForm && (
            <section className="hp-card hp-form-card">
              <h2>Criar Nova Aula</h2>
              <form onSubmit={handleSubmit} className="hp-form">
                <div className="field">
                  <label htmlFor="titulo">Título da Aula *</label>
                  <input
                    id="titulo"
                    name="titulo"
                    value={formData.titulo}
                    onChange={handleChange}
                    placeholder="Ex.: Introdução ao Python"
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="descricao_aula">Descrição</label>
                  <textarea
                    id="descricao_aula"
                    name="descricao_aula"
                    value={formData.descricao_aula}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Descreva o conteúdo e objetivos da aula..."
                  />
                </div>

                <div className="grid-2">
                  <div className="field">
                    <label htmlFor="id_categoria">Categoria</label>
                    {loading ? (
                      <p>Carregando categorias...</p>
                    ) : categorias.length === 0 ? (
                      <p className="hint">Nenhuma categoria disponível. Crie categorias primeiro.</p>
                    ) : (
                      <select
                        id="id_categoria"
                        name="id_categoria"
                        value={formData.id_categoria}
                        onChange={handleChange}
                      >
                        <option value="">Selecione uma categoria (opcional)</option>
                        {categorias.map((cat) => (
                          <option key={cat._id} value={cat._id}>
                            {cat.nome}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="field">
                    <label htmlFor="preco_decimal">Preço (R$)</label>
                    <input
                      id="preco_decimal"
                      name="preco_decimal"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.preco_decimal}
                      onChange={handleChange}
                      placeholder="50.00"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn--outline"
                    onClick={() => {
                      setMostrarForm(false);
                      setErro(null);
                      setSucesso(null);
                    }}
                    disabled={salvando}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn--primary"
                    disabled={salvando}
                  >
                    {salvando ? 'Criando...' : 'Criar Aula'}
                  </button>
                </div>
              </form>
            </section>
          )}

          <section className="hp-card">
            <h2>Minhas Aulas</h2>
            {loading ? (
              <p>Carregando aulas...</p>
            ) : minhasAulas.length === 0 ? (
              <div className="hp-empty-state">
                <p>Você ainda não criou nenhuma aula.</p>
                <p className="hint">Clique em "Criar Nova Aula" para começar.</p>
              </div>
            ) : (
              <div className="hp-aulas-grid">
                {minhasAulas.map((aula) => (
                  <div key={aula._id} className="hp-aula-card">
                    <h3>{aula.titulo}</h3>
                    {aula.descricao_aula && <p className="hp-aula-desc">{aula.descricao_aula}</p>}
                    <div className="hp-aula-meta">
                      {aula.categoria && (
                        <span className="hp-badge">{aula.categoria.nome}</span>
                      )}
                      {aula.preco_decimal && (
                        <span className="hp-price">R$ {parseFloat(aula.preco_decimal).toFixed(2)}</span>
                      )}
                      <span className={`hp-status hp-status-${aula.status?.toLowerCase() || 'disponivel'}`}>
                        {aula.status || 'disponível'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="hp-card">
            <h2>Ações Rápidas</h2>
            <div className="hp-actions-grid">
              <a href="/dashboard-professor" className="hp-action-card">
                <h3>Dashboard</h3>
                <p>Veja estatísticas, alunos e avaliações</p>
              </a>
              <a href="/perfil" className="hp-action-card">
                <h3>Meu Perfil</h3>
                <p>Atualize suas informações</p>
              </a>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

