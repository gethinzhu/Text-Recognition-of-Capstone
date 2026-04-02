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

/* ── SVG Icons ── */
const IconUpload = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const IconCamera = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

const IconDocument = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);

const IconDownload = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const FEATURES = [
  { icon: <IconUpload />, title: 'Multiple Input Formats', desc: 'Support for text, images (JPG, PNG, TIF), PDF, and DOCX files' },
  { icon: <IconCamera />, title: 'Camera Capture', desc: 'Take photos directly from your device camera for instant translation' },
  { icon: <IconDocument />, title: 'OCR Technology', desc: 'Advanced optical character recognition specifically tuned for Fraktur font' },
  { icon: <IconDownload />, title: 'Export Options', desc: 'Download your translated text as PDF or DOCX documents' },
];

const STEPS = [
  { num: '1', title: 'Upload Your Document', desc: 'Upload an image, PDF, DOCX file, or capture a photo with your camera' },
  { num: '2', title: 'Automatic Translation', desc: 'Our system processes and translates the Fraktur text to modern German' },
  { num: '3', title: 'Download Results', desc: 'Review, edit, and export your translated text as PDF or DOCX' },
];

/* ── Home hero ── */
function HomePage({ setPage }: { setPage: (id: PageId) => void }) {
  return (
    <div className="page page--home">
      {/* Hero */}
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

      {/* Section 1: Powerful Features */}
      <section className="home-section features-section">
        <div className="home-section-inner">
          <h2 className="section-heading">Powerful Features</h2>
          <p className="section-sub">Everything you need to translate historical German documents</p>
          <div className="features-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon-wrap">{f.icon}</div>
                <h3 className="feature-card-title">{f.title}</h3>
                <p className="feature-card-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 2: Simple 3-Step Process */}
      <section className="home-section steps-section">
        <div className="home-section-inner">
          <h2 className="section-heading">Simple 3-Step Process</h2>
          <p className="section-sub">Get your translations in minutes</p>
          <div className="steps-grid">
            {STEPS.map((s) => (
              <div key={s.num} className="step-item">
                <div className="step-num">{s.num}</div>
                <h3 className="step-title">{s.title}</h3>
                <p className="step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="steps-cta-wrap">
            <button type="button" className="steps-cta" onClick={() => setPage('how')}>
              Learn More →
            </button>
          </div>
        </div>
      </section>

      {/* Section 3: CTA Banner */}
      <section className="home-section cta-section-wrap">
        <div className="home-section-inner">
          <div className="cta-banner">
            <h2 className="cta-banner-heading">Ready to Start Translating?</h2>
            <p className="cta-banner-sub">Join thousands of researchers, historians, and genealogists who trust our service</p>
            <button type="button" className="cta-banner-btn" onClick={() => setPage('translator')}>
              Get Started Now →
            </button>
          </div>
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