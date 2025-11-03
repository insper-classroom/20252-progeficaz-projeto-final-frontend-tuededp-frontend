// src/components/avaliacao-form/avaliacao-form.jsx
import React, { useState } from "react";
import { criarAvaliacao } from "../../services/avaliacoesService";
import { getUser } from "../../services/authService";
import "./avaliacao-form.css";

export default function AvaliacaoForm({ agendamento, onClose, onSuccess }) {
  const user = getUser();
  const aula = agendamento.aula || {};
  const professor = aula.professor || agendamento.professor || {};

  const [nota, setNota] = useState(5);
  const [texto, setTexto] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // Validações
    if (nota < 0 || nota > 10) {
      setError("A nota deve estar entre 0 e 10");
      return;
    }

    if (!texto.trim()) {
      setError("Por favor, escreva um comentário sobre a aula");
      return;
    }

    const alunoId = user?._id || user?.id;
    const aulaId = aula._id || aula.id || agendamento.id_aula;
    const profId = professor._id || professor.id || aula.id_professor || agendamento.id_professor;

    console.log("[avaliacao-form] Dados para criar avaliação:", {
      alunoId,
      aulaId,
      profId,
      professor: professor,
      aula: aula,
      agendamento: agendamento
    });

    if (!alunoId || !aulaId || !profId) {
      console.error("[avaliacao-form] Dados incompletos:", { alunoId, aulaId, profId });
      setError("Dados incompletos para criar a avaliação");
      return;
    }

    setLoading(true);
    try {
      const avaliacaoData = {
        id_aluno: alunoId,
        id_aula: aulaId,
        id_prof: profId,
        nota: Number(nota),
        texto: texto.trim(),
      };
      
      console.log("[avaliacao-form] Enviando avaliação:", avaliacaoData);
      
      const resultado = await criarAvaliacao(avaliacaoData);
      console.log("[avaliacao-form] Avaliação criada com sucesso:", resultado);

      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      setError(err.message || "Erro ao criar avaliação");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="avaliacao-modal-overlay" onClick={onClose}>
      <div className="avaliacao-modal" onClick={(e) => e.stopPropagation()}>
        <div className="avaliacao-modal-header">
          <h2>Avaliar Aula</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="avaliacao-modal-body">
          <div className="aula-info">
            <h3>{aula.titulo || "Aula"}</h3>
            <p>Professor: {professor.nome || "N/A"}</p>
          </div>

          {error && (
            <div className="alert alert--error">{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="nota">
                Nota (0 a 10): <strong>{nota}</strong>
              </label>
              <input
                id="nota"
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={nota}
                onChange={(e) => setNota(Number(e.target.value))}
                required
              />
              <div className="range-labels">
                <span>0</span>
                <span>5</span>
                <span>10</span>
              </div>
            </div>

            <div className="field">
              <label htmlFor="texto">Comentário *</label>
              <textarea
                id="texto"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Compartilhe sua experiência com esta aula..."
                rows={5}
                required
              />
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn--outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn--primary"
                disabled={loading}
              >
                {loading ? "Enviando..." : "Enviar Avaliação"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

