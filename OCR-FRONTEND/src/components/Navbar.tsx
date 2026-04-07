import { Link, NavLink } from 'react-router-dom';
import { NAV_LINKS } from '../constants';

export default function Navbar() {
  return (
    <nav className="nav">
      <Link to="/" className="nav-brand" style={{ textDecoration: 'none' }}>
        <div className="nav-brand-icon">𝔇</div>
        <span className="nav-brand-name">Deciffer</span>
      </Link>
      <div className="nav-links">
        {NAV_LINKS.map((l) => (
          <NavLink
            key={l.path}
            to={l.path}
            end={l.end}
            className={({ isActive }) =>
              `nav-link${l.cta ? ' cta' : ''}${isActive ? ' active' : ''}`
            }
          >
            {l.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
