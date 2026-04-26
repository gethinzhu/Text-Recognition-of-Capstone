import { BookOpen, Users, Award, Zap } from 'lucide-react';

const FEATURES = [
  {
    icon: <BookOpen size={22} className="text-[#1a1a2e]" />,
    title: 'Fraktur-Optimised OCR',
    desc: 'Our primary model (Google Gemini via OpenRouter) is specifically prompted for 1930s German Fraktur newspaper typography, maximising recognition accuracy on historical scans.',
  },
  {
    icon: <Users size={22} className="text-[#1a1a2e]" />,
    title: 'Multiple Input Methods',
    desc: 'Upload JPEG, PNG, TIFF, BMP, or GIF files individually, or submit a ZIP archive for batch processing. Camera capture is also supported for quick on-device scanning.',
  },
  {
    icon: <Award size={22} className="text-[#1a1a2e]" />,
    title: 'Reviewable & Exportable Results',
    desc: 'Review the transcribed text in the results panel, then download your output as a PDF or DOCX file, ready for academic or professional use.',
  },
  {
    icon: <Zap size={22} className="text-[#1a1a2e]" />,
    title: 'Flexible API Key Support',
    desc: 'Use the shared server API key out of the box, or bring your own OpenRouter key to use your own quota and billing. Your key is sent per request and never stored on the server.',
  },
];

const USER_GROUPS = [
  {
    title: 'Historical Researchers',
    desc: 'Access primary sources from 1930s German-language newspapers for academic research in history, media studies, and German cultural studies.',
  },
  {
    title: 'Archivists & Librarians',
    desc: 'Digitise and transcribe historical newspaper collections, making archives fully searchable and accessible to researchers and the general public.',
  },
  {
    title: 'Students & Educators',
    desc: 'Engage directly with original historical documents for coursework, thesis research, or classroom teaching — no prior knowledge of Fraktur required.',
  },
  {
    title: 'Digital Humanities Scholars',
    desc: 'Process large volumes of historical text for corpus analysis, computational linguistics, or cultural heritage digitisation projects.',
  },
];

export default function AboutPage() {
  return (
    <div style={{ minHeight: '100vh', paddingTop: '64px', paddingBottom: '80px', background: '#f9fafb' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 2rem' }}>

        {/* ── Hero ── */}
        <header className="text-center" style={{ padding: '3rem 0 2.5rem' }}>
          <h1
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: 'clamp(32px, 4vw, 48px)',
              fontWeight: 700,
              color: '#1a1a2e',
              letterSpacing: '-0.02em',
              marginBottom: '0.75rem',
            }}
          >
            About Deciffer
          </h1>
          <p style={{ fontSize: '1rem', color: '#6b7280', lineHeight: 1.6 }}>
            Making historical German Fraktur documents accessible to researchers and archivists
          </p>
        </header>

        {/* ── Description card ── */}
        <div
          className="bg-white border border-gray-200 rounded-2xl shadow-sm"
          style={{ padding: '2rem', marginBottom: '1.5rem' }}
        >
          <p style={{ fontSize: '0.95rem', color: '#374151', lineHeight: 1.75, marginBottom: '1rem' }}>
            Deciffer is an AI-powered OCR tool designed to convert scanned historical German newspapers printed
            in Fraktur script into clean, searchable, and exportable digital text — bridging the gap between
            20th-century printed archives and modern research workflows.
          </p>
          <p style={{ fontSize: '0.95rem', color: '#374151', lineHeight: 1.75 }}>
            Fraktur was the dominant typeface in German-speaking countries from the 16th century through to the
            mid-20th century. While historically significant, its letterforms present major challenges for
            standard OCR engines. Deciffer addresses this by using a multimodal vision model (Google Gemini via
            OpenRouter) specifically prompted for Fraktur recognition. A secondary pipeline based on Calamari 2
            and Kraken is also under active development as part of this research project.
          </p>
        </div>

        {/* ── Feature cards (2-column grid) ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1rem',
            marginBottom: '2.5rem',
          }}
        >
          {FEATURES.map(({ icon, title, desc }) => (
            <div
              key={title}
              className="bg-white border border-gray-200 rounded-2xl shadow-sm"
              style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}
            >
              <div
                className="bg-gray-100 rounded-xl flex-shrink-0"
                style={{ padding: '0.6rem', display: 'inline-flex' }}
              >
                {icon}
              </div>
              <div>
                <h3
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    color: '#1a1a2e',
                    marginBottom: '0.4rem',
                  }}
                >
                  {title}
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.65 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Who Uses Deciffer? ── */}
        <section style={{ marginBottom: '1.5rem' }}>
          <h2
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: 'clamp(32px, 4vw, 48px)',
              fontWeight: 700,
              color: '#1a1a2e',
              letterSpacing: '-0.02em',
              textAlign: 'center',
              marginBottom: '1.5rem',
            }}
          >
            Who Uses Deciffer?
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {USER_GROUPS.map(({ title, desc }) => (
              <div
                key={title}
                className="bg-white border border-gray-200 rounded-2xl shadow-sm"
                style={{ padding: '1.25rem 1.5rem' }}
              >
                <h3
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    color: '#1a1a2e',
                    marginBottom: '0.35rem',
                  }}
                >
                  {title}
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.65 }}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Note on Technology ── */}
        <div
          className="border border-yellow-200 rounded-2xl"
          style={{ padding: '1.5rem', background: '#fefce8' }}
        >
          <h3
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: '0.95rem',
              fontWeight: 700,
              color: '#1a1a2e',
              marginBottom: '0.5rem',
            }}
          >
            Note on Technology
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.7 }}>
            Deciffer is powered by an advanced AI multimodal vision model specifically optimised for historical
            German Fraktur typography. It supports multiple image formats and batch processing via ZIP upload,
            rapidly converting scanned documents into editable digital text that can be exported as PDF or DOCX
            — ready for academic and professional research use.
          </p>
        </div>

      </div>
    </div>
  );
}
