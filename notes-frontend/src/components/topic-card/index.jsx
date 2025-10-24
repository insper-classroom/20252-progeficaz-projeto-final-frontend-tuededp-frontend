// topic-card/index.jsx
import "./index.css";
import heroImg from "../../assets/garota_home.png"; 

export default function TopicCard() {
  return (
    <article className="topic-card">
      <header>
        <div className="avatar">A</div>
        <div className="meta">
          <strong>Header</strong>
        </div>
      </header>
      <div className="media">
        <img src={heroImg} alt="Estudante em ambiente iluminado estudando no notebook" className="ll-hero__img" />
      </div>
      <div className="body">
        <h4>Title</h4>
        <small>Subtitle</small>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor</p>
        <div className="actions">
          <button className="btn secondary">Secondary</button>
          <button className="btn primary">Primary</button>
        </div>
      </div>
    </article>
  );
}
