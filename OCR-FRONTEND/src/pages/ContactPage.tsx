import { useState, type FormEvent } from 'react';
import { Check } from 'lucide-react';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactPage() {
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors]   = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'Name is required.';
    const em = email.trim();
    if (!em)                     next.email = 'Email is required.';
    else if (!EMAIL_RE.test(em)) next.email = 'Please enter a valid email address.';
    if (!message.trim()) next.message = 'Message is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (validate()) setSuccess(true);
  };

  const resetForm = () => {
    setSuccess(false);
    setName(''); setEmail(''); setSubject(''); setMessage(''); setErrors({});
  };

  const clearError = (key: string) =>
    setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });

  const inputCls = 'w-full bg-gray-100 border-0 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0f172a]';

  const FAQS = [
    {
      q: 'What file formats do you support?',
      a: 'We support JPEG, PNG, TIFF, BMP, and GIF files for individual uploads. For batch processing, upload a ZIP archive containing any of these image formats.',
    },
    {
      q: 'Is there a file size limit?',
      a: 'Yes, please keep individual image files under 10 MB for reliable processing. For batch uploads, compress your images into a ZIP archive.',
    },
    {
      q: 'How accurate is the Fraktur transcription?',
      a: 'Accuracy depends on scan quality and font clarity. Our primary model is Google Gemini (via OpenRouter), purpose-prompted for 1930s German Fraktur newspaper typography. We recommend reviewing all outputs before academic use.',
    },
    {
      q: 'Can I edit the transcribed text before exporting?',
      a: 'Yes, all transcription results are fully editable in the review panel before you export to PDF or Word.',
    },
    {
      q: 'Which OCR model does Deciffer use?',
      a: 'Deciffer currently uses Google Gemini (accessed via the OpenRouter API) as its primary OCR engine — a multimodal vision model prompted specifically for historical German Fraktur. A secondary pipeline based on Calamari 2 with a Fraktur-19th-century checkpoint (line-segmented by Kraken) is available for offline batch workflows.',
    },
  ];

  return (
    <div className="bg-[#F4F6F9]" style={{ minHeight: '100vh', paddingTop: '64px', paddingBottom: '80px' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '0 2rem' }}>

        {/* Header */}
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
            Contact Us
          </h1>
          <p className="text-lg text-gray-500">
            Have questions? We&apos;d love to hear from you.
          </p>
        </header>

        {/* Contact Form */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm" style={{ padding: '2rem' }}>
          {success ? (
            <div className="text-center" style={{ padding: '3rem 0' }}>
              <div
                className="inline-flex items-center justify-center rounded-full bg-green-100"
                style={{ padding: '0.75rem', marginBottom: '1rem' }}
              >
                <Check className="text-green-600" size={32} strokeWidth={2.5} aria-hidden />
              </div>
              <p className="font-semibold text-[#0f172a] text-lg">Message sent!</p>
              <p className="text-sm text-gray-500" style={{ marginTop: '0.5rem' }}>
                We&apos;ll get back to you within 24 hours.
              </p>
              <button
                type="button"
                onClick={resetForm}
                className="text-sm font-medium text-[#0f172a] underline underline-offset-2 hover:text-[#1e293b] transition"
                style={{ marginTop: '1.5rem', display: 'block', margin: '1.5rem auto 0' }}
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>

              {/* Row 1 · Name + Email */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label htmlFor="contact-name" className="block text-sm font-medium text-[#0f172a]" style={{ marginBottom: '0.25rem' }}>
                    Name *
                  </label>
                  <input
                    id="contact-name" name="name" type="text" autoComplete="name"
                    placeholder="Your name" value={name}
                    onChange={(e) => { setName(e.target.value); if (errors.name) clearError('name'); }}
                    className={inputCls} style={{ padding: '0.75rem 1rem' }}
                  />
                  {errors.name && <p className="text-red-600 text-xs" style={{ marginTop: '0.375rem' }} role="alert">{errors.name}</p>}
                </div>
                <div>
                  <label htmlFor="contact-email" className="block text-sm font-medium text-[#0f172a]" style={{ marginBottom: '0.25rem' }}>
                    Email *
                  </label>
                  <input
                    id="contact-email" name="email" type="email" autoComplete="email"
                    placeholder="your.email@example.com" value={email}
                    onChange={(e) => { setEmail(e.target.value); if (errors.email) clearError('email'); }}
                    className={inputCls} style={{ padding: '0.75rem 1rem' }}
                  />
                  {errors.email && <p className="text-red-600 text-xs" style={{ marginTop: '0.375rem' }} role="alert">{errors.email}</p>}
                </div>
              </div>

              {/* Row 2 · Subject */}
              <div style={{ marginTop: '1rem' }}>
                <label htmlFor="contact-subject" className="block text-sm font-medium text-[#0f172a]" style={{ marginBottom: '0.25rem' }}>
                  Subject
                </label>
                <input
                  id="contact-subject" name="subject" type="text"
                  placeholder="What is this regarding?" value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className={inputCls} style={{ padding: '0.75rem 1rem' }}
                />
              </div>

              {/* Row 3 · Message */}
              <div style={{ marginTop: '1rem' }}>
                <label htmlFor="contact-message" className="block text-sm font-medium text-[#0f172a]" style={{ marginBottom: '0.25rem' }}>
                  Message *
                </label>
                <textarea
                  id="contact-message" name="message" rows={6}
                  placeholder="Tell us how we can help you..." value={message}
                  onChange={(e) => { setMessage(e.target.value); if (errors.message) clearError('message'); }}
                  className={`${inputCls} resize-y`}
                  style={{ padding: '0.75rem 1rem', minHeight: '180px' }}
                />
                {errors.message && <p className="text-red-600 text-xs" style={{ marginTop: '0.375rem' }} role="alert">{errors.message}</p>}
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full bg-[#0f172a] text-white rounded-xl font-semibold text-sm hover:bg-[#1e293b] transition"
                style={{ padding: '0.75rem', marginTop: '1.5rem' }}
              >
                Send Message
              </button>
              <p className="text-xs text-gray-400 text-center" style={{ marginTop: '0.5rem' }}>
                * Required fields. We typically respond within 24 hours.
              </p>
            </form>
          )}
        </div>

        {/* FAQ card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm" style={{ padding: '2rem', marginTop: '2rem' }}>
          <h2 className="text-xl font-bold text-[#0f172a]" style={{ marginBottom: '1.5rem' }}>
            Frequently Asked Questions
          </h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {FAQS.map(({ q, a }, i) => (
              <li
                key={i}
                className={i < FAQS.length - 1 ? 'border-b border-gray-100' : ''}
                style={{ padding: i < FAQS.length - 1 ? '0 0 1rem' : '0', marginBottom: i < FAQS.length - 1 ? '1rem' : '0' }}
              >
                <p className="font-semibold text-[#0f172a] text-sm">{q}</p>
                <p className="text-gray-500 text-sm" style={{ marginTop: '0.25rem', lineHeight: '1.6' }}>{a}</p>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
}
