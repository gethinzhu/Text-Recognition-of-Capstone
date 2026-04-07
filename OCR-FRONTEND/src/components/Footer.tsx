import { Link } from 'react-router-dom';
import { NAV_LINKS } from '../constants';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <Link to="/" className="footer-brand" style={{ textDecoration: 'none' }}>
          <div className="footer-brand-icon">𝔇</div>
          <span className="footer-brand-name">Deciffer</span>
        </Link>
        <div className="footer-links">
          {NAV_LINKS.map((l) => (
            <Link key={l.path} to={l.path} className="footer-link" style={{ textDecoration: 'none' }}>
              {l.label}
            </Link>
          ))}
        </div>
        <div className="footer-copy">© {new Date().getFullYear()} Deciffer. All rights reserved.</div>
      </div>
    </footer>
  );
}
