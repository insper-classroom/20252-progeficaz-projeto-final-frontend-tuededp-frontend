// cta-share/index.jsx
import "./index.css";
import { useNavigate } from "react-router-dom";

export default function CTAShare(){
  const navigate = useNavigate();
  const handleClick = () => {
    // navegar para a página e garantir que role para o topo
    navigate('/junte-se-nos');
    // small timeout para garantir que a navegação ocorreu antes de rolar
    setTimeout(()=>{ window.scrollTo({ top: 0, behavior: 'smooth' }); }, 50);
  };

  return (
    <div className="cta-share">
      <p>Tem experiência e busca uma fonte de renda extra?</p>
      <h3>Entre em contato ou:</h3>
      <button className="primary" onClick={handleClick}>Comece Agora!</button>
      <div className="icons">💬 ✉️</div>
    </div>
  );
}
