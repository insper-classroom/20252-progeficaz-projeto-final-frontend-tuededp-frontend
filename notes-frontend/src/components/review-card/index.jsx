// review-card/index.jsx
import "./index.css";
export default function ReviewCard(){
  return (
    <article className="review-card">
      <div className="stars">★★★★★</div>
      <strong>Review title</strong>
      <div className="sub">Review body</div>
      <div className="reviewer">
        <img src="https://via.placeholder.com/24" alt="" />
        <div><b>Reviewer name</b><div className="date">Date</div></div>
      </div>
    </article>
  );
}
