import { useState } from "react";
import "./index.css";

export default function PerfilProfessor() {
  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: ""
  });

  const [buscandocep, setBuscandoCEP] = useState(false);
  const [cepError, setCepError] = useState("");

  function handleChange(entrada) {
    const { name, value } = entrada.target;
    setForm((s) => ({ ...s, [name]: value }));
  }

  function limpaEndereco() {
    setForm((s) => ({
      ...s,
      logradouro: "",
      bairro: "",
      cidade: "",
      uf: "",
      complemento: ""
    }));
  }

  async function handleCepBlur() {
    setCepError("");
    const cep_limpo = (form.cep || "").replace(/\D/g, "");
    if (cep_limpo.length !== 8) {
      limpaEndereco();
      return;
    }

    setBuscandoCEP(true);
    try {

      const res = await fetch(`/api/auth/checa_cep/${cep_limpo}`);
      if (!res.ok) {
        if (res.status === 404) {
          setCepError("CEP não encontrado");
        } else {
          setCepError("Falha ao consultar CEP");
        }
        limpaEndereco();
        setBuscandoCEP(false);
        return;
      }
      const data = await res.json();

      setForm((s) => ({
        ...s,
        logradouro: data.logradouro || "",
        bairro: data.bairro || "",
        cidade: data.localidade || "",
        uf: data.uf || "",
        complemento: data.complemento || ""
      }));
    } catch (err) {
      console.error("Erro ao buscar CEP:", err);
      setCepError("Erro de rede ao consultar CEP");
      limpaEndereco();
    } finally {
      setBuscandoCEP(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    // Aqui  enviar o form para o backend 
    console.log("submit", form);
    // Exemplo: fetch('/api/professores', { method:'POST', body: JSON.stringify(form), headers: {'Content-Type':'application/json'} })
  }

  return (
    <div className="perfil-professor">
      <h2>Cadastro / Atualizar Professor</h2>
      <form onSubmit={handleSubmit} className="perfil-form">
        <label>
          Nome
          <input name="nome" value={form.nome} onChange={handleChange} />
        </label>

        <label>
          Email
          <input name="email" value={form.email} onChange={handleChange} />
        </label>

        <label>
          Telefone
          <input name="telefone" value={form.telefone} onChange={handleChange} />
        </label>

        <label>
          CEP
          <input
            name="cep"
            value={form.cep}
            onChange={handleChange}
            onBlur={handleCepBlur}
            placeholder="00000-000"
            maxLength={9}
          />
        </label>
        {buscandocep && <div className="cep-info">Buscando CEP...</div>}
        {cepError && <div className="cep-error">{cepError}</div>}

        <label>
          Logradouro
          <input name="logradouro" value={form.logradouro} onChange={handleChange} />
        </label>

        <label>
          Número
          <input name="numero" value={form.numero} onChange={handleChange} />
        </label>

        <label>
          Complemento
          <input name="complemento" value={form.complemento} onChange={handleChange} />
        </label>

        <label>
          Bairro
          <input name="bairro" value={form.bairro} onChange={handleChange} />
        </label>

        <label>
          Cidade
          <input name="cidade" value={form.cidade} onChange={handleChange} />
        </label>

        <label>
          UF
          <input name="uf" value={form.uf} onChange={handleChange} maxLength={2} />
        </label>

        <button type="submit">Salvar</button>
      </form>
    </div>
  );
}
