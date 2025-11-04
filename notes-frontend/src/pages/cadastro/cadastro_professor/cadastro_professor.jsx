import React, { useState } from 'react';
import HeaderDeslogado from '../../../components/header-deslogado';
import Footer from '../../../components/footer';
import { useNavigate } from "react-router-dom";
import { cadastrarProfessor, formatarCPF, formatarTelefone } from '../../../services/apiService';
import './cadastro_professor.css';

const emptyExperience = () => ({ cargo: '', empresa: '', inicio: '', fim: '', descricao: '', link: '' });
const emptyFormacao = () => ({ instituicao: '', curso: '', inicio: '', fim: '', descricao: '' });
const emptyCert = () => ({ titulo: '', org: '', ano: '', link: '' });
const emptyProjeto = () => ({ titulo: '', resumo: '', link: '' });

const CadastroProfessor = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    area: '',
    data_nascimento: '',
    historico_academico_profissional: '',
    endereco: '',
    senha: '',

    // extras (strings for comma-list inputs)
    especializacoes: '',
    quer_ensinar: '',
    modalidades: '',
    idiomas: '',
    valor_hora: '',
    disponibilidade_timezone: '',
    disponibilidade_dias: '',      // csv
    disponibilidade_horarios: '', // csv

    // complex lists
    experiencias: [ emptyExperience() ],
    formacao: [ emptyFormacao() ],
    certificacoes: [ emptyCert() ],
    projetos: [ emptyProjeto() ],

    // links
    links_linkedin: '',
    links_github: '',
    links_site: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // style helpers: aumenta espaço entre labels/inputs nos blocos dinâmicos
  const dynamicBlockStyle = { display: 'grid', gap: 12, marginBottom: 18, padding: '8px 0' };
  const smallInputStyle = { width: '100%' };

  // máscara de moeda simples (entrada): permite apenas dígitos e um ponto, até 2 casas
  function maskCurrencyInput(value) {
    if (value == null) return '';
    let v = String(value).replace(",", ".");
    v = v.replace(/[^\d.]/g, "");
    const parts = v.split(".");
    if (parts.length > 1) {
      v = parts[0] + "." + parts.slice(1).join("").slice(0,2);
    }
    return v;
  }

  function onlyDigits(value) {
    return String(value || "").replace(/\D+/g, "");
  }

  function setField(name, value) {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  }

  // Função única e consolidada de máscaras para todos os campos
  function applyMaskForField(name, value) {
    if (!name) return value ?? "";
    const n = String(name).toLowerCase();
    let v = value == null ? "" : String(value);

    // Telefones -> usa helper externo se disponível
    if (n.includes("telefone")) {
      return typeof formatarTelefone === "function" ? formatarTelefone(v) : v.replace(/[^\d()+\- ]/g, "");
    }

    // CPF -> usa helper externo se disponível
    if (n.includes("cpf")) {
      return typeof formatarCPF === "function" ? formatarCPF(v) : v.replace(/\D/g, "").slice(0,11);
    }

    // Valor/hora -> moeda simplificada
    if (n === "valor_hora" || n.includes("valor")) {
      return maskCurrencyInput(v);
    }

    // Ano (somente 4 dígitos)
    if (n === "ano") {
      return onlyDigits(v).slice(0,4);
    }

    // Disponibilidade: dias/horarios - aceita apenas letras, números, dois-pontos, hífen e vírgula
    if (n.includes("disponibilidade") && (n.includes("dias") || n.includes("horarios"))) {
      return v.replace(/[^0-9a-zA-Záàâãéèêíïóôõúüç:\-, \/]/g, "");
    }

    // Links (URLs) — se o usuário começar sem http, prefixa https:// para ajudar
    if (n.includes("link") && v.trim()) {
      const t = v.trim();
      if (!/^https?:\/\//i.test(t)) {
        return `https://${t.replace(/^(https?:\/\/)?/i, "")}`;
      }
      return t;
    }

    // Nomes, textos e outros: apenas não permitir controle inválido no início (mantém espaços internos)
    return v;
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const masked = applyMaskForField(name, value);
    setField(name, masked);
  };

  // handlers for dynamic lists (experiencias, formacao, certificacoes, projetos)
  function updateListField(listName, idx, key, value) {
    // aplica máscara condicional em campos conhecidos (ex: ano dentro de certificacoes)
    let val = value;
    const keyName = String(key).toLowerCase();
    if (keyName === "ano") val = onlyDigits(value).slice(0,4);
    if (keyName === "telefone") val = typeof formatarTelefone === "function" ? formatarTelefone(value) : value;
    if (keyName === "cpf") val = typeof formatarCPF === "function" ? formatarCPF(value) : value;
    if (keyName === "valor_hora") val = maskCurrencyInput(value);
    if (keyName.includes("link") && val && !/^https?:\/\//i.test(val)) {
      val = `https://${val.replace(/^(https?:\/\/)?/i, "")}`;
    }

    setFormData(prev => {
      const arr = Array.isArray(prev[listName]) ? [...prev[listName]] : [];
      arr[idx] = { ...(arr[idx] || {}), [key]: val };
      return { ...prev, [listName]: arr };
    });
  }
  function addListItem(listName, factory) {
    setFormData(prev => ({ ...prev, [listName]: [...(prev[listName] || []), factory()] }));
  }
  function removeListItem(listName, idx) {
    setFormData(prev => {
      const arr = [...(prev[listName] || [])];
      arr.splice(idx, 1);
      if (arr.length === 0) {
        const empty = listName === 'experiencias' ? emptyExperience() :
                      listName === 'formacao' ? emptyFormacao() :
                      listName === 'certificacoes' ? emptyCert() : emptyProjeto();
        return { ...prev, [listName]: [empty] };
      }
      return { ...prev, [listName]: arr };
    });
  }

  const basicValidate = () => {
    const err = {};
    if (!formData.nome || !formData.nome.trim()) err.nome = "Nome é obrigatório";
    if (!formData.email || !formData.email.trim()) err.email = "E-mail é obrigatório";
    if (!formData.senha) err.senha = "Senha é obrigatória";
    return err;
  };

  const csvToArray = (s) => {
    if (!s) return [];
    return s.split(",").map(x => x.trim()).filter(Boolean);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const validation = basicValidate();
    if (Object.keys(validation).length) {
      setErrors(validation);
      setLoading(false);
      return;
    }

    // monta payload compatível com backend
    const payload = {
      nome: formData.nome.trim(),
      email: formData.email.trim(),
      senha: formData.senha,
      telefone: formData.telefone?.trim() || null,
      cpf: formData.cpf?.trim() || null,
      area: formData.area || null,
      data_nascimento: formData.data_nascimento || null,
      historico_academico_profissional: formData.historico_academico_profissional?.trim() || null,
      endereco: formData.endereco?.trim() || null,

      // listas simples: enviamos como array de strings
      especializacoes: csvToArray(formData.especializacoes),
      quer_ensinar: csvToArray(formData.quer_ensinar),
      modalidades: csvToArray(formData.modalidades),
      idiomas: csvToArray(formData.idiomas),

      // valor_hora como número se informado
      valor_hora: formData.valor_hora === '' ? undefined : Number(String(formData.valor_hora).replace(",", ".").trim()),

      // disponibilidade como objeto (se qualquer campo preenchido)
      disponibilidade: (formData.disponibilidade_timezone || formData.disponibilidade_dias || formData.disponibilidade_horarios)
        ? {
            timezone: formData.disponibilidade_timezone || undefined,
            dias: csvToArray(formData.disponibilidade_dias),
            horarios: csvToArray(formData.disponibilidade_horarios)
          }
        : undefined,

      // listas complexas: enviamos arrays de objetos (seu backend já aceita isso)
      experiencias: Array.isArray(formData.experiencias) ? formData.experiencias.map(ex => {
        return {
          cargo: (ex.cargo || '').trim(),
          empresa: (ex.empresa || '').trim(),
          inicio: (ex.inicio || '').trim(),
          fim: (ex.fim || '').trim(),
          descricao: (ex.descricao || '').trim(),
          link: (ex.link || '').trim() || undefined
        };
      }).filter(x => x.cargo || x.empresa || x.descricao) : undefined,

      formacao: Array.isArray(formData.formacao) ? formData.formacao.map(f => ({
        instituicao: (f.instituicao || '').trim(),
        curso: (f.curso || '').trim(),
        inicio: (f.inicio || '').trim(),
        fim: (f.fim || '').trim(),
        descricao: (f.descricao || '').trim()
      })).filter(x => x.instituicao || x.curso) : undefined,

      certificacoes: Array.isArray(formData.certificacoes) ? formData.certificacoes.map(c => ({
        titulo: (c.titulo || '').trim(),
        org: (c.org || '').trim(),
        ano: (c.ano || '').trim(),
        link: (c.link || '').trim() || undefined
      })).filter(x => x.titulo) : undefined,

      projetos: Array.isArray(formData.projetos) ? formData.projetos.map(p => ({
        titulo: (p.titulo || '').trim(),
        resumo: (p.resumo || '').trim(),
        link: (p.link || '').trim() || undefined
      })).filter(x => x.titulo || x.resumo) : undefined,

      links: {
        linkedin: formData.links_linkedin?.trim() || undefined,
        github: formData.links_github?.trim() || undefined,
        site: formData.links_site?.trim() || undefined
      }
    };

    // remove undefined keys
    Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);
    if (payload.links) {
      Object.keys(payload.links).forEach(k => payload.links[k] === undefined && delete payload.links[k]);
      if (!Object.keys(payload.links).length) delete payload.links;
    }

    console.log('🔍 payload professor:', payload);

    try {
      const result = await cadastrarProfessor(payload);

      if (result.success) {
        alert('Cadastro realizado com sucesso!');
        navigate('/login');
        return;
      }

      if (result.errors) {
        setErrors(result.errors);
      } else {
        alert(result.message || 'Erro ao criar conta');
      }
    } catch (err) {
      console.error(err);
      alert(err?.message || 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cadastro-professor-container">
      <HeaderDeslogado />
      <div className="voltar-seta" onClick={() => navigate('/cadastro-escolha')} title="Voltar">
        <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </div>

      <main className="main-content">
        <div className="cadastro-card">
          <h1 className="cadastro-title">Cadastro de Professor</h1>
          <p className="cadastro-subtitle">Preencha os dados para criar sua conta de professor</p>

          <form className="cadastro-form" onSubmit={handleSubmit}>
            {/* Seção 1: Dados Pessoais */}
            <div className="form-section">
              <h2 className="section-title">Dados Pessoais</h2>
              <p className="section-description">Informações básicas para identificação e contato</p>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Nome completo</label>
                  <input name="nome" value={formData.nome} onChange={handleInputChange} required className={`form-input ${errors.nome? 'error':''}`} />
                  {errors.nome && <div className="error-message">{errors.nome}</div>}
                </div>
                <div className="form-group">
                  <label>E-mail</label>
                  <input name="email" type="email" value={formData.email} onChange={handleInputChange} required className={`form-input ${errors.email? 'error':''}`} />
                  {errors.email && <div className="error-message">{errors.email}</div>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Telefone</label>
                  <input name="telefone" value={formData.telefone} onChange={(e) => setField('telefone', applyMaskForField('telefone', e.target.value))} className="form-input" />
                </div>
                <div className="form-group">
                  <label>CPF</label>
                  <input name="cpf" value={formData.cpf} onChange={(e) => setField('cpf', applyMaskForField('cpf', e.target.value))} className="form-input" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Área de especialização</label>
                  <select name="area" value={formData.area} onChange={handleInputChange} className="form-input">
                    <option value="">Selecione uma área</option>
                    <option>Programação</option><option>Matemática</option><option>Física</option><option>Química</option>
                    <option>Biologia</option><option>História</option><option>Geografia</option><option>Português</option>
                    <option>Inglês</option><option>Filosofia</option><option>Sociologia</option><option>Educação Física</option>
                    <option>Artes</option><option>Outros</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Data de nascimento</label>
                  <input name="data_nascimento" type="date" value={formData.data_nascimento} onChange={handleInputChange} className="form-input" />
                </div>
              </div>

              <div className="form-group">
                <label>Histórico Acadêmico e Profissional</label>
                <textarea name="historico_academico_profissional" value={formData.historico_academico_profissional} onChange={handleInputChange} className="form-input form-textarea" rows="4" />
              </div>

              <div className="form-group">
                <label>Endereço</label>
                <input name="endereco" value={formData.endereco} onChange={handleInputChange} className="form-input" placeholder="Rua, número, cidade, estado" />
              </div>
            </div>

            {/* Seção 2: Informações Profissionais */}
            <div className="form-section">
              <h2 className="section-title">Informações Profissionais</h2>
              <p className="section-description">Detalhes sobre suas especialidades, disponibilidade e valores</p>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Especializações (separadas por vírgula)</label>
                  <input name="especializacoes" value={formData.especializacoes} onChange={handleInputChange} className="form-input" placeholder="Cálculo, Física, Python" />
                </div>
                <div className="form-group">
                  <label>Quero ensinar (separadas por vírgula)</label>
                  <input name="quer_ensinar" value={formData.quer_ensinar} onChange={handleInputChange} className="form-input" placeholder="Cálculo I, Álgebra" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Modalidades (separadas por vírgula)</label>
                  <input name="modalidades" value={formData.modalidades} onChange={handleInputChange} className="form-input" placeholder="Online, Presencial" />
                </div>
                <div className="form-group">
                  <label>Idiomas (separados por vírgula)</label>
                  <input name="idiomas" value={formData.idiomas} onChange={handleInputChange} className="form-input" placeholder="PT-BR, EN-B2" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Valor / Hora (R$)</label>
                  <input name="valor_hora" type="text" inputMode="decimal" value={formData.valor_hora} onChange={(e) => setField('valor_hora', applyMaskForField('valor_hora', e.target.value))} className="form-input" placeholder="Ex: 50.00" />
                </div>
                <div className="form-group">
                  <label>Disponibilidade - Fuso Horário</label>
                  <input name="disponibilidade_timezone" value={formData.disponibilidade_timezone} onChange={handleInputChange} className="form-input" placeholder="America/Sao_Paulo" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Disponibilidade - Dias (separados por vírgula)</label>
                  <input name="disponibilidade_dias" value={formData.disponibilidade_dias} onChange={(e) => setField('disponibilidade_dias', applyMaskForField('disponibilidade_dias', e.target.value))} className="form-input" placeholder="Segunda, Terça, Quarta" />
                </div>
                <div className="form-group">
                  <label>Disponibilidade - Horários (separados por vírgula)</label>
                  <input name="disponibilidade_horarios" value={formData.disponibilidade_horarios} onChange={(e) => setField('disponibilidade_horarios', applyMaskForField('disponibilidade_horarios', e.target.value))} className="form-input" placeholder="09:00-12:00, 14:00-18:00" />
                </div>
              </div>
            </div>

            {/* Seção 3: Experiências e Formação */}
            <div className="form-section">
              <h2 className="section-title">Experiências e Formação</h2>
              <p className="section-description">Adicione suas experiências profissionais, formação acadêmica, certificações e projetos relevantes</p>
              
              {/* experiências (opcional, não apenas trabalho) */}
              <div className="form-group">
                <label>Experiências (opcional)</label>
                <p className="hint">Descreva experiências relevantes — como projetos, ensino, pesquisa, eventos ou trabalhos.</p>

              {formData.experiencias.map((ex, i) => (
                <div key={i} className="list-item" style={dynamicBlockStyle}>
                  <input
                    placeholder="Título ou atividade"
                    value={ex.cargo}
                    onChange={e => updateListField('experiencias', i, 'cargo', e.target.value)}
                    className="form-input"
                    style={smallInputStyle}
                  />
                  <textarea
                    placeholder="Descrição (opcional)"
                    value={ex.descricao}
                    onChange={e => updateListField('experiencias', i, 'descricao', e.target.value)}
                    className="form-input form-textarea small"
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      placeholder="Período - início"
                      value={ex.inicio}
                      onChange={e => updateListField('experiencias', i, 'inicio', e.target.value)}
                      className="form-input small"
                    />
                    <input
                      placeholder="Período - fim"
                      value={ex.fim}
                      onChange={e => updateListField('experiencias', i, 'fim', e.target.value)}
                      className="form-input small"
                    />
                  </div>
                  <input
                    placeholder="Link (opcional)"
                    value={ex.link}
                    onChange={e => updateListField('experiencias', i, 'link', e.target.value)}
                    className="form-input"
                  />
                  <div style={{ marginTop: 6 }}>
                    <button type="button" onClick={() => removeListItem('experiencias', i)}>Remover</button>
                  </div>
                </div>
              ))}

                <button type="button" onClick={() => addListItem('experiencias', emptyExperience)}>
                  Adicionar experiência
                </button>
              </div>

              {/* formação */}
              <div className="form-group">
                <label>Formação</label>
              {formData.formacao.map((f, i) => (
                <div key={i} className="list-item" style={dynamicBlockStyle}>
                  <input placeholder="Instituição" value={f.instituicao} onChange={e => updateListField('formacao', i, 'instituicao', e.target.value)} className="form-input" />
                  <input placeholder="Curso" value={f.curso} onChange={e => updateListField('formacao', i, 'curso', e.target.value)} className="form-input" />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input placeholder="Início" value={f.inicio} onChange={e => updateListField('formacao', i, 'inicio', e.target.value)} className="form-input small" />
                    <input placeholder="Fim" value={f.fim} onChange={e => updateListField('formacao', i, 'fim', e.target.value)} className="form-input small" />
                  </div>
                  <textarea placeholder="Descrição (opcional)" value={f.descricao} onChange={e => updateListField('formacao', i, 'descricao', e.target.value)} className="form-input form-textarea small" />
                  <div style={{marginTop:6}}>
                    <button type="button" onClick={() => removeListItem('formacao', i)}>Remover</button>
                  </div>
                </div>
              ))}
                <button type="button" onClick={() => addListItem('formacao', emptyFormacao)}>Adicionar formação</button>
              </div>

              {/* certificações */}
              <div className="form-group">
                <label>Certificações</label>
              {formData.certificacoes.map((c, i) => (
                <div key={i} className="list-item" style={dynamicBlockStyle}>
                  <input placeholder="Título" value={c.titulo} onChange={e => updateListField('certificacoes', i, 'titulo', e.target.value)} className="form-input" />
                  <input placeholder="Organização" value={c.org} onChange={e => updateListField('certificacoes', i, 'org', e.target.value)} className="form-input" />
                  <input placeholder="Ano" value={c.ano} onChange={e => updateListField('certificacoes', i, 'ano', applyMaskForField('ano', e.target.value))} className="form-input small" />
                  <input placeholder="Link (opcional)" value={c.link} onChange={e => updateListField('certificacoes', i, 'link', e.target.value)} className="form-input" />
                  <div style={{marginTop:6}}>
                    <button type="button" onClick={() => removeListItem('certificacoes', i)}>Remover</button>
                  </div>
                </div>
              ))}
                <button type="button" onClick={() => addListItem('certificacoes', emptyCert)}>Adicionar certificação</button>
              </div>

              {/* projetos */}
              <div className="form-group">
                <label>Projetos</label>
              {formData.projetos.map((p, i) => (
                <div key={i} className="list-item" style={dynamicBlockStyle}>
                  <input placeholder="Título" value={p.titulo} onChange={e => updateListField('projetos', i, 'titulo', e.target.value)} className="form-input" />
                  <input placeholder="Link (opcional)" value={p.link} onChange={e => updateListField('projetos', i, 'link', e.target.value)} className="form-input" />
                  <textarea placeholder="Resumo" value={p.resumo} onChange={e => updateListField('projetos', i, 'resumo', e.target.value)} className="form-input form-textarea small" />
                  <div style={{marginTop:6}}>
                    <button type="button" onClick={() => removeListItem('projetos', i)}>Remover</button>
                  </div>
                </div>
              ))}
                <button type="button" onClick={() => addListItem('projetos', emptyProjeto)}>Adicionar projeto</button>
              </div>
            </div>

            {/* Seção 4: Links e Senha */}
            <div className="form-section">
              <h2 className="section-title">Links e Segurança</h2>
              <p className="section-description">Adicione seus links profissionais e defina uma senha segura</p>
              
              {/* links */}
              <div className="form-row">
                <div className="form-group">
                  <label>LinkedIn</label>
                  <input name="links_linkedin" value={formData.links_linkedin} onChange={(e) => setField('links_linkedin', applyMaskForField('links_linkedin', e.target.value))} className="form-input" placeholder="https://linkedin.com/in/seu-perfil" />
                </div>
                <div className="form-group">
                  <label>GitHub</label>
                  <input name="links_github" value={formData.links_github} onChange={(e) => setField('links_github', applyMaskForField('links_github', e.target.value))} className="form-input" placeholder="https://github.com/seu-usuario" />
                </div>
              </div>

              <div className="form-group">
                <label>Site / Portfólio</label>
                <input name="links_site" value={formData.links_site} onChange={(e) => setField('links_site', applyMaskForField('links_site', e.target.value))} className="form-input" placeholder="https://seusite.com.br" />
              </div>

              {/* senha */}
              <div className="form-group">
                <label>Senha</label>
                <input name="senha" type="password" value={formData.senha} onChange={handleInputChange} className={`form-input ${errors.senha? 'error':''}`} required />
                {errors.senha && <div className="error-message">{errors.senha}</div>}
              </div>
            </div>

            {/* Ações finais */}
            <div style={{display:'flex', gap:12, marginTop:32}}>
              <button type="submit" className="cadastro-button" disabled={loading}>{loading ? 'CRIANDO CONTA...' : 'CRIAR CONTA DE PROFESSOR'}</button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CadastroProfessor;
