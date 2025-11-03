import { useNavigate } from "react-router-dom";
import "./index.css";

export default function WelcomePanel({ nome = "Matheus", avatarUrl }) {
  const navigate = useNavigate();

  const handleAddInteresses = () => {
    navigate("/perfil");
  };

  return (
    <div className="welcome-panel">
      <div className="welcome-text">
        <h2>Bem-vindo(a), {nome}</h2>
      </div>

      <div className="welcome-avatar">
        <div className="avatar-ring">
          <img
            src={avatarUrl || "https://via.placeholder.com/48"}
            alt={`Avatar de ${nome}`}
            className="avatar"
          />
        </div>

        <button className="add-link" onClick={handleAddInteresses}>
          Adicionar interesses
        </button>
      </div>
    </div>
  );
}
