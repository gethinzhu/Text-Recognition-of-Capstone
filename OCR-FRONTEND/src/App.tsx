import { useState } from 'react';
import './App.css';

const NAV_LINKS = [
  { id: 'home',       label: 'Home' },
  { id: 'translator', label: 'Translator', cta: true },
  { id: 'how',        label: 'How It Works' },
  { id: 'about',      label: 'About' },
  { id: 'contact',    label: 'Contact' },
];

function Nav({ page, setPage }) {
  return (
    <nav className="nav">
      <div className="nav-brand" onClick={() => setPage('home')}>
        <div className="nav-brand-icon">𝔇</div>
        <span className="nav-brand-name">Deciffer</span>
      </div>
      <div className="nav-links">
        {NAV_LINKS.map((l) => (
          <button
            key={l.id}
            className={`nav-link${l.cta ? ' cta' : ''}${page === l.id ? ' active' : ''}`}
            onClick={() => setPage(l.id)}
          >
            {l.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

function Footer({ setPage }) {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand" onClick={() => setPage('home')}>
          <div className="footer-brand-icon">𝔇</div>
          <span className="footer-brand-name">Deciffer</span>
        </div>
        <div className="footer-links">
          {NAV_LINKS.map((l) => (
            <button key={l.id} className="footer-link" onClick={() => setPage(l.id)}>
              {l.label}
            </button>
          ))}
        </div>
        <div className="footer-copy">© {new Date().getFullYear()} Deciffer. All rights reserved.</div>
      </div>
    </footer>
  );
}

/* ── Empty page shells ── */
function HomePage()       { return <div className="page"><div className="page-content" /></div>; }
function TranslatorPage() { return <div className="page"><div className="page-content" /></div>; }
function HowPage()        { return <div className="page"><div className="page-content" /></div>; }
function AboutPage()      { return <div className="page"><div className="page-content" /></div>; }
function ContactPage()    { return <div className="page"><div className="page-content" /></div>; }

const PAGES = {
  home:       HomePage,
  translator: TranslatorPage,
  how:        HowPage,
  about:      AboutPage,
  contact:    ContactPage,
};

export default function App() {
  const [page, setPage] = useState('home');
  const PageComponent = PAGES[page];

  return (
    <>
      <Nav page={page} setPage={setPage} />
      <PageComponent />
      <Footer setPage={setPage} />
    </>
  );
}