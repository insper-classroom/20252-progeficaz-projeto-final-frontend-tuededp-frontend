import React from 'react';
import { useNavigate } from 'react-router-dom';
import './index.css';

const Footer = () => {
  const navigate = useNavigate();

  const goHomeAndScroll = (targetId) => {
    // sempre vai para '/'
    navigate('/');

    // pequeno delay para garantir que o DOM da página '/' esteja disponível
    setTimeout(() => {
      if (!targetId || targetId === 'top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 50);
  };

  const goOnlyHome = () => {
    navigate('/');
  };

  const goService = () => {
    navigate('/junte-se-nos');
    // garante que, após a navegação, a página role para o topo
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  };

  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-content">
        {/* Social Media Buttons (todos vão para '/') */}
        <div className="social-icons" aria-hidden="false">
          <button className="social-link facebook" aria-label="Facebook" onClick={goOnlyHome}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
            </svg>
          </button>

          <button className="social-link instagram" aria-label="Instagram" onClick={goOnlyHome}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
            </svg>
          </button>

          <button className="social-link linkedin" aria-label="LinkedIn" onClick={goOnlyHome}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
              <rect x="2" y="9" width="4" height="12"/>
              <circle cx="4" cy="4" r="2"/>
            </svg>
          </button>
        </div>

        {/* Footer navigation */}
        <nav className="footer-nav" aria-label="Footer navigation">
          <button className="nav-link" onClick={() => goHomeAndScroll('top')}>Home</button>
          <button className="nav-link" onClick={() => goHomeAndScroll('sobre')}>About</button>
          <button className="nav-link" onClick={goOnlyHome}>Terms</button>
          <button className="nav-link" onClick={goService}>Service</button>
        </nav>

        <p className="copyright">Tue de DP @ 2025</p>
      </div>
    </footer>
  );
};

export default Footer;
