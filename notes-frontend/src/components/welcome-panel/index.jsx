// welcome-panel/index.jsx
import "./index.css";
export default function WelcomePanel({ nome="Lucas", onAddInteresses }) {
  return (
    <div className="welcome-panel">
      <h2>Bem-vindo(a) <br/>de volta, {nome}</h2>
    </div>
  );
}
