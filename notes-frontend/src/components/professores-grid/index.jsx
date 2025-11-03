// professores-grid/index.jsx
import ReviewCard from "../review-card";
import "./index.css";

export default function ProfessoresGrid(){
  return (
    <div className="professores-grid">
      <div className="grid">
        <ReviewCard/><ReviewCard/><ReviewCard/>
      </div>
      <button className="see-more">Veja mais</button>
    </div>
  );
}
