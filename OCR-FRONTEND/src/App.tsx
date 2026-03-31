import { useState } from 'react';
import type { FC } from 'react';
import './App.css';

type PageId = 'home' | 'translator' | 'how' | 'about' | 'contact';

const NAV_LINKS: { id: PageId; label: string; cta?: boolean }[] = [
  { id: 'home',       label: 'Home' },
  { id: 'translator', label: 'Translator', cta: true },
  { id: 'how',        label: 'How It Works' },
  { id: 'about',      label: 'About' },
  { id: 'contact',    label: 'Contact' },
];

function Nav({ page, setPage }: { page: PageId; setPage: (id: PageId) => void }) {
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

function Footer({ setPage }: { setPage: (id: PageId) => void }) {
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

/* ── Home hero ── */
function HomePage({ setPage }: { setPage: (id: PageId) => void }) {
  return (
    <div className="page page--home">
      <section className="hero" aria-labelledby="hero-heading">
        <div className="hero-inner">
          <h1 id="hero-heading" className="hero-heading">
            Translate Fraktur Font to Modern
            <br />
            German
          </h1>
          <p className="hero-sub">
            Our advanced translation service converts historical Fraktur font documents into readable
            modern German text. Support for images, PDFs, DOCX files, and live camera capture.
          </p>
          <button
            type="button"
            className="hero-cta"
            onClick={() => setPage('translator')}
          >
            Start Translating →
          </button>
        </div>
      </section>
    </div>
  );
}

/* ── Empty page shells ── */
function TranslatorPage() { return <div className="page"><div className="page-content" /></div>; }
function HowPage()        { return <div className="page"><div className="page-content" /></div>; }
function AboutPage()      { return <div className="page"><div className="page-content" /></div>; }
function ContactPage()    { return <div className="page"><div className="page-content" /></div>; }

const SUBPAGES: Record<Exclude<PageId, 'home'>, FC> = {
  translator: TranslatorPage,
  how:        HowPage,
  about:      AboutPage,
  contact:    ContactPage,
};

function SubPageView({ page }: { page: Exclude<PageId, 'home'> }) {
  const Page = SUBPAGES[page];
  return <Page />;
}

export default function App() {
  const [page, setPage] = useState<PageId>('home');

  return (
    <>
      <Nav page={page} setPage={setPage} />
      {page === 'home' ? <HomePage setPage={setPage} /> : <SubPageView page={page} />}
      <Footer setPage={setPage} />
    </>
  );
}