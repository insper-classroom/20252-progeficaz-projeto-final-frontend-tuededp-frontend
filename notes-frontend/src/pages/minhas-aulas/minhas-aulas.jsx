// src/pages/minhas-aulas/minhas-aulas.jsx
import React, { useEffect, useState } from "react";
import HeaderLogado from "../../components/header-logado";
import Footer from "../../components/footer";
import { requireAuth, getUser } from "../../services/authService";
import { getToken } from "../../services/authService";
import AvaliacaoForm from "../../components/avaliacao-form";
import { listarAvaliacoes } from "../../services/avaliacoesService";
import "./minhas-aulas.css";

export default function MinhasAulas() {
  const user = getUser();
  const [aulas, setAulas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [avaliandoAula, setAvaliandoAula] = useState(null);
  const [avaliacoesExistentes, setAvaliacoesExistentes] = useState([]);

  useEffect(() => {
    requireAuth();
    carregarAulas();
  }, []);

  async function carregarAulas() {
    try {
      setLoading(true);
      const token = getToken();
      const alunoId = user?._id || user?.id;

      if (!alunoId) {
        setError("ID do aluno não encontrado");
        return;
      }

      // Busca agendamentos do aluno
      const response = await fetch(`/api/agenda?aluno=${alunoId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Erro ao carregar aulas");
      }

      const data = await response.json();
      const agendamentos = data.data || data || [];

      // Para cada agendamento, busca os dados completos da aula
      const aulasCompletas = await Promise.all(
        agendamentos.map(async (agendamento) => {
          if (agendamento.aula?._id || agendamento.id_aula) {
            const aulaId = agendamento.aula?._id || agendamento.id_aula;
            try {
              const aulaResponse = await fetch(`/api/aulas/${aulaId}`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              if (aulaResponse.ok) {
                const aulaData = await aulaResponse.json();
                return {
                  ...agendamento,
                  aula: aulaData,
                };
              }
            } catch (err) {
              console.error("Erro ao buscar dados da aula:", err);
            }
          }
          return agendamento;
        })
      );

      setAulas(aulasCompletas);

      // Busca avaliações existentes do aluno
      if (alunoId) {
        try {
          const avaliacoes = await listarAvaliacoes({ id_aluno: alunoId });
          setAvaliacoesExistentes(avaliacoes || []);
        } catch (err) {
          console.error("[minhas-aulas] Erro ao buscar avaliações:", err);
        }
      }
    } catch (err) {
      console.error("[minhas-aulas] Erro:", err);
      setError(err.message || "Erro ao carregar aulas");
    } finally {
      setLoading(false);
    }
  }

  function formatarData(data) {
    if (!data) return "N/A";
    const d = new Date(data);
    if (isNaN(d.getTime())) return data;
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getStatusClass(status) {
    const statusLower = status?.toLowerCase() || "";
    if (statusLower === "concluida") return "status-concluida";
    if (statusLower === "confirmada") return "status-confirmada";
    if (statusLower === "agendada") return "status-agendada";
    if (statusLower === "cancelada") return "status-cancelada";
    return "status-default";
  }

  function podeAvaliar(agendamento) {
    // Verifica se o agendamento está concluído
    const statusAgendamento = agendamento.status?.toLowerCase() || "";
    // Aceita "concluida" ou "concluída" (com ou sem acento)
    const agendamentoConcluido = statusAgendamento === "concluida" || 
                                  statusAgendamento === "concluída" ||
                                  statusAgendamento.includes("conclu");
    
    if (!agendamentoConcluido) {
      return false;
    }

    // Se o agendamento está concluído, permite avaliar
    // Não precisa verificar o status da aula, pois o importante é o agendamento estar concluído

    // Verifica se o aluno já avaliou esta aula
    const aulaId = agendamento.aula?._id || agendamento.aula?.id || agendamento.id_aula;
    if (aulaId) {
      const jaAvaliou = avaliacoesExistentes.some((av) => {
        const avAulaId = av.id_aula?._id || av.id_aula?.id || av.id_aula;
        return avAulaId === aulaId;
      });
      if (jaAvaliou) {
        return false; // Já avaliou, não pode avaliar novamente
      }
    }

    return true;
  }

  function handleAvaliar(agendamento) {
    setAvaliandoAula(agendamento);
  }

  function handleAvaliacaoConcluida() {
    setAvaliandoAula(null);
    carregarAulas(); // Recarrega para atualizar dados
  }

  return (
    <div className="minhas-aulas-page">
      <HeaderLogado />
      <main className="minhas-aulas-main">
        <div className="container">
          <header className="page-header">
            <h1>Minhas Aulas</h1>
            <p>Acompanhe suas aulas agendadas e avalie as aulas concluídas</p>
          </header>

          {error && (
            <div className="alert alert--error">{error}</div>
          )}

          {loading ? (
            <div className="loading">Carregando aulas...</div>
          ) : aulas.length === 0 ? (
            <div className="empty-state">
              <p>Você ainda não tem aulas agendadas.</p>
            </div>
          ) : (
            <div className="aulas-list">
              {aulas.map((agendamento) => {
                const aula = agendamento.aula || {};
                const professor = aula.professor || agendamento.professor || {};
                const podeAvaliarAula = podeAvaliar(agendamento);
                
                // Debug: log para verificar condições
                const statusAgendamento = agendamento.status?.toLowerCase();
                const statusAula = agendamento.aula?.status?.toLowerCase();
                console.log('[minhas-aulas] Agendamento:', {
                  id: agendamento._id || agendamento.id,
                  statusAgendamento,
                  statusAula,
                  podeAvaliar: podeAvaliarAula,
                  temAula: !!agendamento.aula
                });

                return (
                  <div key={agendamento._id || agendamento.id} className="aula-card">
                    <div className="aula-header">
                      <div className="aula-info">
                        <h3>{aula.titulo || "Aula sem título"}</h3>
                        <p className="professor-name">
                          Professor: {professor.nome || "N/A"}
                        </p>
                        <p className="aula-data">
                          Data/Hora: {formatarData(agendamento.data_hora)}
                        </p>
                      </div>
                      <div className="aula-status">
                        <span className={`status-badge ${getStatusClass(agendamento.status)}`}>
                          {agendamento.status || "N/A"}
                        </span>
                      </div>
                    </div>

                    {aula.descricao && (
                      <p className="aula-descricao">{aula.descricao}</p>
                    )}

                    {/* Aba de avaliação para aulas concluídas */}
                    {podeAvaliarAula ? (
                      <div className="avaliacao-section">
                        <button
                          className="btn btn--primary"
                          onClick={() => handleAvaliar(agendamento)}
                        >
                          Avaliar Aula
                        </button>
                      </div>
                    ) : (
                      // Mostra mensagem apenas se já avaliou
                      (statusAgendamento === "concluida" || statusAgendamento === "concluída" || statusAgendamento.includes("conclu")) && (
                        <div className="avaliacao-section">
                          {avaliacoesExistentes.some((av) => {
                            const aulaId = agendamento.aula?._id || agendamento.aula?.id || agendamento.id_aula;
                            const avAulaId = av.id_aula?._id || av.id_aula?.id || av.id_aula;
                            return avAulaId === aulaId;
                          }) && (
                            <p className="avaliacao-info">
                              ✓ Você já avaliou esta aula
                            </p>
                          )}
                        </div>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Modal de avaliação */}
      {avaliandoAula && (
        <AvaliacaoForm
          agendamento={avaliandoAula}
          onClose={() => setAvaliandoAula(null)}
          onSuccess={handleAvaliacaoConcluida}
        />
      )}
    </div>
  );
}

