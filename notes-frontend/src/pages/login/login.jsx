import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../../services/authService";
import HeaderDeslogado from "../../components/header-deslogado";
import Footer from "../../components/footer";
import "./login.css";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // seu backend espera { email, senha }
    const res = await login(email, password);
    setLoading(false);

    if (!res.success) {
      setError(res.error || "Email ou senha inválidos");
      return;
    }

    // vai para a Home (HeaderLogado aparece automaticamente)
    navigate("/");
  }

  return (
    <div className="page-auth">
      <HeaderDeslogado />

      <main className="auth-main">
        <section className="auth-card">
          <header className="auth-head">
            <h1>Entrar</h1>
            <p>Acesse sua conta para continuar seus estudos.</p>
          </header>

          {error && (
            <div className="auth-alert auth-alert--error" role="alert">
              {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                inputMode="email"
                placeholder="nome@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
              />
            </div>

            <div className="field">
              <label htmlFor="password">Senha</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button className="btn btn--primary auth-submit" type="submit" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </button>

            <div className="auth-meta">
              <span className="muted">Ainda não tem conta?</span>{" "}
              <Link to="/cadastro-escolha" className="link">Criar conta</Link>
            </div>
          </form>
        </section>

        {/* Lado visual (opcional) para manter o “clima LinkedIn Learning” */}
        <aside className="auth-figure" aria-hidden="true">
          <div className="figure-card">
            <h3>Aprenda no seu ritmo</h3>
            <p>Trilhas, aulas curtas, certificados e professores verificados.</p>
          </div>
        </aside>
      </main>

      <Footer />
    </div>
  );
}
