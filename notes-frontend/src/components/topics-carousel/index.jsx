// topics-carousel/index.jsx
import { useRef } from "react";
import TopicCard from "../topic-card";
import "./index.css";

export default function TopicsCarousel() {
  const scroller = useRef(null);
  const scrollBy = (offset) => scroller.current?.scrollBy({ left: offset, behavior: "smooth" });

  return (
    <div className="topics-block">
      <div className="scroller" ref={scroller}>
        {[...Array(8)].map((_,i)=>(<TopicCard key={i}/>))}
      </div>
      <div className="arrows">
        <button aria-label="Anterior" onClick={()=>scrollBy(-360)}>←</button>
        <button aria-label="Próximo" onClick={()=>scrollBy(360)}>→</button>
      </div>
    </div>
  );
}
