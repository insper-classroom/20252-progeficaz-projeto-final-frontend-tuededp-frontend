import "./index.css";
export default function SectionTitle({ children, right }) {
  return (
    <div className="section-title">
      <h2>{children}</h2>
      <span className="rule" />
      {right && <div className="right">{right}</div>}
    </div>
  )};