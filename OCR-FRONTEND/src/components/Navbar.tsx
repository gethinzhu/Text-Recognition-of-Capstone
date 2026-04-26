import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { NAV_LINKS } from '../constants';
import { getCredits } from '../api';

export default function Navbar() {
  const [remaining, setRemaining] = useState<number | null>(null);

  const fetchCredits = () => {
    const key = localStorage.getItem('openrouter_api_key') || undefined;
    getCredits(key)
      .then((data) => setRemaining(data.remaining))
      .catch(() => setRemaining(null));
  };

  useEffect(() => {
    fetchCredits();

    // Refresh every 60 seconds
    const id = setInterval(fetchCredits, 60_000);

    // Re-fetch immediately when user changes key or finishes an upload
    window.addEventListener('apikey-changed', fetchCredits);
    window.addEventListener('credits-refresh', fetchCredits);

    return () => {
      clearInterval(id);
      window.removeEventListener('apikey-changed', fetchCredits);
      window.removeEventListener('credits-refresh', fetchCredits);
    };
  }, []);

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

        {remaining !== null && (
          <div className="nav-credits" title="Remaining OpenRouter credits">
            <span className="nav-credits-dot" />
            ${remaining.toFixed(2)}
          </div>
        )}
      </div>
    </nav>
  );
}
