import React from "react";
import HeaderLogado from "../../components/header-logado";
import Footer from "../../components/footer";
import { getProfile, updateProfile, uploadAvatar, changePassword } from "../../services/userService";
import { getUser, setUser } from "../../services/authService";
import "./index.css";

export default function PerfilAluno() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [avatarSaving, setAvatarSaving] = React.useState(false);
  const [passSaving, setPassSaving] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [ok, setOk] = React.useState("");

  const meLocal = getUser();
  const [form, setForm] = React.useState({
    nome: meLocal?.nome || "",
    email: meLocal?.email || "",
    telefone: meLocal?.telefone || "",
  });

  const [avatarPreview, setAvatarPreview] = React.useState(meLocal?.avatarUrl || "");
  const [senhaAtual, setSenhaAtual] = React.useState("");
  const [novaSenha, setNovaSenha] = React.useState("");
  const [novaSenha2, setNovaSenha2] = React.useState("");

  React.useEffect(() => {
    (async () => {
      try {
        const me = await getProfile();
        setForm({
          nome: me?.nome || "",
          email: me?.email || "",
          telefone: me?.telefone || "",
        });
        if (me?.avatarUrl) setAvatarPreview(me.avatarUrl);
        // também garante que o local esteja coerente (opcional)
        setUser({ ...(getUser() || {}), ...me });
      } catch (e) {
        setErr(e.message || "Erro ao carregar perfil");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setErr(""); setOk("");
    setSaving(true);
    try {
      const updated = await updateProfile(form); // já faz setUser internamente
      if (updated?.avatarUrl) setAvatarPreview(updated.avatarUrl);
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
    setAvatarPreview(url); // preview imediato
    setErr(""); setOk("");
    setAvatarSaving(true);
    try {
      const res = await uploadAvatar(file); // já faz setUser internamente
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

  return (
    <div className="perfil">
      <HeaderLogado />
      <main className="perfil-main">
        <div className="perfil-container">
          <header className="perfil-header">
            <h1>Meu Perfil</h1>
            <p>Gerencie seus dados pessoais, foto e senha.</p>
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
                    <input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="nome@exemplo.com" />
                  </div>
                  <div className="field">
                    <label htmlFor="telefone">Telefone</label>
                    <input id="telefone" name="telefone" value={form.telefone} onChange={handleChange} placeholder="(00) 00000-0000" />
                  </div>
                  <div className="actions">
                    <button className="btn btn--primary" type="submit" disabled={saving}>
                      {saving ? "Salvando..." : "Salvar alterações"}
                    </button>
                  </div>
                </form>
              </section>

              {/* Senha */}
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
