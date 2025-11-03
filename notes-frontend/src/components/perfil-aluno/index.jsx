// components/perfil-aluno/index.jsx
import React from "react";
import HeaderLogado from "../../components/header-logado";
import Footer from "../../components/footer";
import { getProfile, updateProfile, uploadAvatar, changePassword } from "../../services/userService";
import { getUser, setUser } from "../../services/authService";
import "./index.css";

export default function PerfilAluno() {
  const meLocal = getUser();
  const isProfessor = meLocal?.tipo === "professor" || meLocal?.tipo === "prof";
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [avatarSaving, setAvatarSaving] = React.useState(false);
  const [passSaving, setPassSaving] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [ok, setOk] = React.useState("");

  // Estado inicial do formulário baseado no tipo de usuário
  const [form, setForm] = React.useState(() => {
    const baseForm = {
      nome: meLocal?.nome || "",
      email: meLocal?.email || "",
      telefone: meLocal?.telefone || "",
      slug: meLocal?.slug || "",
      headline: meLocal?.headline || "",
      modalidades: (meLocal?.modalidades || []).join(", "),
      valor_hora: meLocal?.valor_hora ?? "",
      links_linkedin: meLocal?.links?.linkedin || "",
      links_github: meLocal?.links?.github || "",
      links_site: meLocal?.links?.site || "",
    };

    // Campos específicos de alunos (aparecem apenas para alunos)
    if (!isProfessor) {
      baseForm.bio = meLocal?.bio || "";
      baseForm.quer_aprender = (meLocal?.quer_aprender || []).join(", ");
      baseForm.idiomas = (meLocal?.idiomas || []).join(", ");
      // NOTA: removi especializacoes e quer_ensinar daqui (só pra professor)
    }

    // Campos específicos de professores (aparecem apenas para professores)
    if (isProfessor) {
      baseForm.historico_academico_profissional = meLocal?.historico_academico_profissional || "";
      baseForm.especializacoes = (meLocal?.especializacoes || []).join(", ");
      baseForm.quer_ensinar = (meLocal?.quer_ensinar || []).join(", ");
      // campos mais complexos (experiencias, formacao, etc.) não estão sendo exibidos aqui
      // para evitar enviar formatos errados ao backend — podemos adicionar UI específica depois.
    }

    return baseForm;
  });

  const [avatarPreview, setAvatarPreview] = React.useState(meLocal?.avatarUrl || "");
  const [senhaAtual, setSenhaAtual] = React.useState("");
  const [novaSenha, setNovaSenha] = React.useState("");
  const [novaSenha2, setNovaSenha2] = React.useState("");

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const me = await getProfile();
        if (!alive) return;

        const updatedForm = {
          nome: me?.nome || "",
          email: me?.email || "",
          telefone: me?.telefone || "",
          slug: me?.slug || "",
          headline: me?.headline || "",
          modalidades: (me?.modalidades || []).join(", "),
          valor_hora: me?.valor_hora ?? "",
          links_linkedin: me?.links?.linkedin || "",
          links_github: me?.links?.github || "",
          links_site: me?.links?.site || "",
        };

        // Campos específicos de alunos
        if (!isProfessor) {
          updatedForm.bio = me?.bio || "";
          updatedForm.quer_aprender = (me?.quer_aprender || []).join(", ");
          updatedForm.idiomas = (me?.idiomas || []).join(", ");
        }

        // Campos específicos de professores
        if (isProfessor) {
          updatedForm.historico_academico_profissional = me?.historico_academico_profissional || "";
          updatedForm.especializacoes = (me?.especializacoes || []).join(", ");
          updatedForm.quer_ensinar = (me?.quer_ensinar || []).join(", ");
        }

        setForm(prev => ({ ...prev, ...updatedForm }));

        if (me?.avatarUrl) setAvatarPreview(me.avatarUrl);

        // Sincroniza storage local (sem perder campos locais)
        setUser({ ...(getUser() || {}), ...me });
      } catch (e) {
        setErr(e.message || "Erro ao carregar perfil");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // isProfessor é estático durante a sessão; evitei dependência para não re-inicializar

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setErr(""); setOk(""); setSaving(true);
    try {
      // Prepara o patch baseado no tipo de usuário
      const patch = {
        nome: form.nome,
        telefone: form.telefone,
        slug: form.slug?.trim(),
        headline: form.headline,
        links: {
          linkedin: form.links_linkedin?.trim(),
          github: form.links_github?.trim(),
          site: form.links_site?.trim(),
        },
      };

      // Campos específicos de alunos (SOMENTE para alunos)
      if (!isProfessor) {
        patch.bio = form.bio;
        patch.quer_aprender = form.quer_aprender; // enviado como string (backend fará normalize_list_maybe)
        patch.idiomas = form.idiomas;
      }

      // Campos específicos de professores (SOMENTE para professores)
      if (isProfessor) {
        patch.historico_academico_profissional = form.historico_academico_profissional;
        patch.especializacoes = form.especializacoes;
        patch.quer_ensinar = form.quer_ensinar;
      }

      // Campos comuns (ambos)
      if (form.modalidades !== undefined) {
        patch.modalidades = form.modalidades;
      }
      // valor_hora: para aluno é "disposto a pagar", para professor "cobrado" — ambos usam o mesmo campo name no backend
      if (form.valor_hora !== undefined && form.valor_hora !== "") {
        // converter para número se possível
        const n = Number(form.valor_hora);
        patch.valor_hora = Number.isFinite(n) ? n : null;
      } else {
        // se deixado vazio, envie null para limpar no backend caso deseje
        patch.valor_hora = null;
      }

      const updated = await updateProfile(patch);
      if (updated?.avatarUrl) setAvatarPreview(updated.avatarUrl);
      if (updated?.slug && updated.slug !== form.slug) {
        setForm(prev => ({ ...prev, slug: updated.slug }));
      }
      setOk("Perfil atualizado com sucesso!");
    } catch (e) {
      setErr(e.message || "Erro ao atualizar perfil");
    } finally {
      setSaving(false);
    }
  }

  async function handlePickAvatar(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
    setErr(""); setOk(""); setAvatarSaving(true);
    try {
      const res = await uploadAvatar(file);
      if (res?.avatarUrl) setAvatarPreview(res.avatarUrl);
      if (res?.user?.avatarUrl) setAvatarPreview(res.user.avatarUrl);
      setOk("Foto atualizada!");
    } catch (e) {
      setErr(e.message || "Erro ao enviar foto");
    } finally {
      setAvatarSaving(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setErr(""); setOk("");
    if (!senhaAtual || !novaSenha) return setErr("Preencha as senhas.");
    if (novaSenha !== novaSenha2) return setErr("As novas senhas não conferem.");
    setPassSaving(true);
    try {
      await changePassword({ senhaAtual, novaSenha });
      setOk("Senha alterada com sucesso!");
      setSenhaAtual(""); setNovaSenha(""); setNovaSenha2("");
    } catch (e) {
      setErr(e.message || "Erro ao alterar senha");
    } finally {
      setPassSaving(false);
    }
  }

  const publicUrl = form.slug ? (isProfessor ? `/professor/${form.slug}` : `/aluno/${form.slug}`) : null;

  return (
    <div className="perfil">
      <HeaderLogado />
      <main className="perfil-main">
        <div className="perfil-container">
          <header className="perfil-header">
            <h1>Meu Perfil</h1>
            <p>Gerencie seus dados pessoais e configure seu perfil público.</p>
            {publicUrl && (
              <a className="btn btn--ghost" href={publicUrl} target="_blank" rel="noreferrer">
                Ver perfil público
              </a>
            )}
          </header>

          {(err || ok) && (
            <div className={`alert ${err ? "alert--error" : "alert--ok"}`}>
              {err || ok}
            </div>
          )}

          {loading ? (
            <div className="skeleton">
              <div className="sk-line w40" />
              <div className="sk-line w70" />
              <div className="sk-card" />
            </div>
          ) : (
            <div className="perfil-grid">
              {/* Avatar */}
              <section className="card">
                <h2 className="card-title">Foto de perfil</h2>
                <div className="avatar-block">
                  <div className="avatar">
                    {avatarPreview ? <img src={avatarPreview} alt="Avatar" /> : <span className="avatar-fallback">👤</span>}
                  </div>
                  <label className="btn btn--outline" htmlFor="avatarInput">
                    {avatarSaving ? "Enviando..." : "Trocar foto"}
                  </label>
                  <input id="avatarInput" type="file" accept="image/*" onChange={handlePickAvatar} hidden />
                  <p className="hint">PNG/JPG até 2MB.</p>
                </div>
              </section>

              {/* Dados */}
              <section className="card">
                <h2 className="card-title">Informações pessoais</h2>
                <form onSubmit={handleSave} className="form">
                  <div className="field">
                    <label htmlFor="nome">Nome completo</label>
                    <input id="nome" name="nome" value={form.nome} onChange={handleChange} placeholder="Seu nome" />
                  </div>

                  <div className="field">
                    <label htmlFor="email">E-mail</label>
                    <input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="nome@exemplo.com" disabled />
                    <small className="hint">O e-mail é gerenciado na seção de Segurança/Conta.</small>
                  </div>

                  <div className="field">
                    <label htmlFor="telefone">Telefone</label>
                    <input id="telefone" name="telefone" value={form.telefone} onChange={handleChange} placeholder="(00) 00000-0000" />
                  </div>

                  <hr className="sep" />
                  <h3 className="subsection">Perfil público</h3>

                  <div className="field">
                    <label htmlFor="slug">URL do perfil</label>
                    <div className="inline">
                      <span className="muted">/{isProfessor ? "professor" : "aluno"}/</span>
                      <input id="slug" name="slug" value={form.slug} onChange={handleChange} placeholder="seu-nome-unico" />
                    </div>
                    <small className="hint">Use apenas letras, números e hífens. Ex.: gabriel-rosa</small>
                  </div>

                  <div className="field">
                    <label htmlFor="headline">Headline</label>
                    <input id="headline" name="headline" value={form.headline} onChange={handleChange} placeholder="Ex.: Estudante de CC | Estatística | Front-end" />
                  </div>

                  {isProfessor ? (
                    <>
                      <div className="field">
                        <label htmlFor="historico_academico_profissional">Histórico Acadêmico e Profissional</label>
                        <textarea id="historico_academico_profissional" name="historico_academico_profissional" value={form.historico_academico_profissional} onChange={handleChange} rows={4} placeholder="Formação acadêmica, experiência profissional, conquistas..." />
                      </div>

                      <div className="field">
                        <label htmlFor="especializacoes">Especializações (separe por vírgula)</label>
                        <input id="especializacoes" name="especializacoes" value={form.especializacoes} onChange={handleChange} placeholder="Cálculo I, Machine Learning" />
                      </div>

                      <div className="field">
                        <label htmlFor="quer_ensinar">Quero ensinar (vírgulas)</label>
                        <input id="quer_ensinar" name="quer_ensinar" value={form.quer_ensinar || ""} onChange={handleChange} placeholder="Cálculo, Estatística" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="field">
                        <label htmlFor="bio">Sobre você</label>
                        <textarea id="bio" name="bio" value={form.bio} onChange={handleChange} rows={4} placeholder="Conte um pouco sobre você, interesses, objetivos..." />
                      </div>

                      <div className="grid-2">
                        <div className="field">
                          <label htmlFor="idiomas">Idiomas (separe por vírgula)</label>
                          <input id="idiomas" name="idiomas" value={form.idiomas} onChange={handleChange} placeholder="PT-BR, EN-B2" />
                        </div>

                        <div className="field">
                          <label htmlFor="quer_aprender">Quero aprender (vírgulas)</label>
                          <input id="quer_aprender" name="quer_aprender" value={form.quer_aprender} onChange={handleChange} placeholder="Econometria, Trading algorítmico" />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Modalidades e valor/hora (tanto para aluno quanto professor) */}
                  <div className="grid-2">
                    <div className="field">
                      <label htmlFor="modalidades">{isProfessor ? "Modalidades de Ensino (vírgulas)" : "Modalidades (vírgulas)"}</label>
                      <input id="modalidades" name="modalidades" value={form.modalidades} onChange={handleChange} placeholder="Online, Presencial" />
                    </div>
                    <div className="field">
                      <label htmlFor="valor_hora">Valor/hora (R$)</label>
                      <input id="valor_hora" name="valor_hora" type="number" step="1" min="0" value={form.valor_hora} onChange={handleChange} placeholder="60" />
                    </div>
                  </div>

                  <div className="grid-3">
                    <div className="field">
                      <label htmlFor="links_linkedin">LinkedIn</label>
                      <input id="links_linkedin" name="links_linkedin" value={form.links_linkedin} onChange={handleChange} placeholder="https://linkedin.com/in/..." />
                    </div>
                    <div className="field">
                      <label htmlFor="links_github">GitHub</label>
                      <input id="links_github" name="links_github" value={form.links_github} onChange={handleChange} placeholder="https://github.com/..." />
                    </div>
                    <div className="field">
                      <label htmlFor="links_site">Site/Portfólio</label>
                      <input id="links_site" name="links_site" value={form.links_site} onChange={handleChange} placeholder="https://seusite.com" />
                    </div>
                  </div>

                  <div className="actions">
                    <button className="btn btn--primary" type="submit" disabled={saving}>
                      {saving ? "Salvando..." : "Salvar alterações"}
                    </button>
                    {publicUrl && (
                      <a className="btn btn--outline" href={publicUrl} target="_blank" rel="noreferrer">
                        Ver perfil público
                      </a>
                    )}
                  </div>
                </form>
              </section>

              {/* Segurança */}
              <section className="card span-2">
                <h2 className="card-title">Segurança</h2>
                <form onSubmit={handleChangePassword} className="form form-inline">
                  <div className="field">
                    <label htmlFor="senhaAtual">Senha atual</label>
                    <input id="senhaAtual" type="password" value={senhaAtual} onChange={(e)=>setSenhaAtual(e.target.value)} placeholder="••••••••" />
                  </div>
                  <div className="field">
                    <label htmlFor="novaSenha">Nova senha</label>
                    <input id="novaSenha" type="password" value={novaSenha} onChange={(e)=>setNovaSenha(e.target.value)} placeholder="No mínimo 8 caracteres" />
                  </div>
                  <div className="field">
                    <label htmlFor="novaSenha2">Confirmar nova senha</label>
                    <input id="novaSenha2" type="password" value={novaSenha2} onChange={(e)=>setNovaSenha2(e.target.value)} placeholder="Repita a nova senha" />
                  </div>
                  <div className="actions">
                    <button className="btn btn--ghost" type="submit" disabled={passSaving}>
                      {passSaving ? "Alterando..." : "Alterar senha"}
                    </button>
                  </div>
                </form>
              </section>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
