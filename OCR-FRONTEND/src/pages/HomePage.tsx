import { useNavigate } from 'react-router-dom';
import FeatureCard from '../components/FeatureCard';

/* ── SVG Icons ── */
const IconUpload = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const IconAI = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2"/>
    <rect x="9" y="9" width="6" height="6" rx="1"/>
    <line x1="9" y1="2" x2="9" y2="4"/>
    <line x1="15" y1="2" x2="15" y2="4"/>
    <line x1="9" y1="20" x2="9" y2="22"/>
    <line x1="15" y1="20" x2="15" y2="22"/>
    <line x1="2" y1="9" x2="4" y2="9"/>
    <line x1="2" y1="15" x2="4" y2="15"/>
    <line x1="20" y1="9" x2="22" y2="9"/>
    <line x1="20" y1="15" x2="22" y2="15"/>
  </svg>
);

const IconLayout = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <line x1="3" y1="9" x2="21" y2="9"/>
    <line x1="12" y1="9" x2="12" y2="21"/>
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
  {
    icon: <IconUpload />,
    title: 'Flexible File Upload',
    desc: 'Upload JPEG, PNG, TIFF, BMP, or GIF files — individually or as a batch via ZIP archive.',
  },
  {
    icon: <IconAI />,
    title: 'Multi-Model AI OCR',
    desc: 'Choose your preferred AI backend (e.g. Gemini API) for Fraktur text recognition tuned to historical documents.',
  },
  {
    icon: <IconLayout />,
    title: 'Newspaper Layout Detection',
    desc: 'Automatically separates columns, articles, headlines, and advertisements — preserving logical reading order.',
  },
  {
    icon: <IconDownload />,
    title: 'Clean Export',
    desc: 'Download results as PDF or Word. Each article is separated into its own paragraph, ready for analysis.',
  },
];

const STEPS = [
  {
    num: '1',
    title: 'Upload Your Document',
    desc: 'Upload JPEG, PNG, TIFF, BMP, or GIF scans. Batch upload supported.',
  },
  {
    num: '2',
    title: 'AI Reads the Page',
    desc: 'Your chosen model extracts Fraktur text and detects article boundaries across multi-column layouts.',
  },
  {
    num: '3',
    title: 'Review and Export',
    desc: 'Check the transcribed text, make edits if needed, then export as PDF or Word — ready for research.',
  },
];

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="page page--home">
      {/* Hero */}
      <section className="hero" aria-labelledby="hero-heading">
        <div className="hero-inner">
          <h1 id="hero-heading" className="hero-heading">
            Unlock Historical Fraktur Documents
            <br />
            with AI
          </h1>
          <p className="hero-sub">
            Upload your scanned Fraktur newspaper pages and get clean, exportable modern German text
            in minutes. Built for historians, archivists, and language researchers.
          </p>
          <button
            type="button"
            className="hero-cta"
            onClick={() => navigate('/recognise')}
          >
            Upload Your Scans →
          </button>
        </div>
      </section>

      {/* Section 1: Powerful Features */}
      <section className="home-section features-section">
        <div className="home-section-inner">
          <h2 className="section-heading">What Deciffer Does</h2>
          <p className="section-sub">Four core capabilities built for historical document research</p>
          <div className="features-grid">
            {FEATURES.map((f) => (
              <FeatureCard key={f.title} icon={f.icon} title={f.title} desc={f.desc} />
            ))}
          </div>
        </div>
      </section>

      {/* Section 2: How It Works */}
      <section className="home-section steps-section">
        <div className="home-section-inner">
          <h2 className="section-heading">How It Works</h2>
          <p className="section-sub">From scan to searchable text in three straightforward steps</p>
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
            <button type="button" className="steps-cta" onClick={() => navigate('/how-it-works')}>
              Learn More →
            </button>
          </div>
        </div>
      </section>

      {/* Section 3: CTA Banner */}
      <section className="home-section cta-section-wrap">
        <div className="home-section-inner">
          <div className="cta-banner">
            <h2 className="cta-banner-heading">Your Archive, Finally Searchable.</h2>
            <p className="cta-banner-sub">Designed for researchers who work with historical Fraktur-printed sources.</p>
            <button type="button" className="cta-banner-btn" onClick={() => navigate('/recognise')}>
              Get Started →
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
