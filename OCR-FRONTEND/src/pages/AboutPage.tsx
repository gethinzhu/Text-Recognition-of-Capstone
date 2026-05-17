import { BookOpen, Users, Award, Zap } from 'lucide-react';
import '../css/AboutPage.css';

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
    <div className="about-shell">
      <div className="about-container">

        {/* ── Hero ── */}
        <header className="about-header">
          <h1 className="about-title">About Deciffer</h1>
          <p className="about-subtitle">
            Making historical German Fraktur documents accessible to researchers and archivists
          </p>
        </header>

        {/* ── Description card ── */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm about-desc-card">
          <p className="about-desc-text">
            Deciffer is an AI-powered OCR tool designed to convert scanned historical German newspapers printed
            in Fraktur script into clean, searchable, and exportable digital text — bridging the gap between
            20th-century printed archives and modern research workflows.
          </p>
          <p className="about-desc-text">
            Fraktur was the dominant typeface in German-speaking countries from the 16th century through to the
            mid-20th century. While historically significant, its letterforms present major challenges for
            standard OCR engines. Deciffer addresses this by using a multimodal vision model (Google Gemini via
            OpenRouter) specifically prompted for Fraktur recognition. A secondary pipeline based on Calamari 2
            and Kraken is also under active development as part of this research project.
          </p>
        </div>

        {/* ── Feature cards (2-column grid) ── */}
        <div className="about-features-grid">
          {FEATURES.map(({ icon, title, desc }) => (
            <div
              key={title}
              className="bg-white border border-gray-200 rounded-2xl shadow-sm about-feature-card"
            >
              <div className="bg-gray-100 rounded-xl about-feature-icon-wrap">
                {icon}
              </div>
              <div>
                <h3 className="about-feature-title">{title}</h3>
                <p className="about-feature-desc">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Who Uses Deciffer? ── */}
        <section className="about-users-section">
          <h2 className="about-users-title">Who Uses Deciffer?</h2>
          <div className="about-users-list">
            {USER_GROUPS.map(({ title, desc }) => (
              <div
                key={title}
                className="bg-white border border-gray-200 rounded-2xl shadow-sm about-user-card"
              >
                <h3 className="about-user-title">{title}</h3>
                <p className="about-user-desc">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="border border-yellow-200 rounded-2xl about-project-card">
          <h3 className="about-project-title">Project Information</h3>
          <p className="about-project-text">
            Deciffer is an academic software project developed as part of the
            Information Technology Capstone Project unit at The University of
            Western Australia (UWA), 2026.
          </p>

          <p className="about-project-text">
            The project focuses on recognising and processing historical
            Fraktur documents into readable modern text using OCR and AI-assisted
            text recognition technologies.
          </p>

          <p className="about-project-text">
            Developed by Aksa Benny, Alwyn Sajan, Guoxing Zhu,
            Ying Hu, and Zhengdong Jiang. 
          </p>
        </div>
      </div>
    </div>
  );
}
