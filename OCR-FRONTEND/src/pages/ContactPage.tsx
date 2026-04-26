import { useState } from 'react';
import type { FormEvent } from 'react';
import { CheckCircle2, HelpCircle, Send } from 'lucide-react';
import { ContactApiError, submitContactMessage } from '../api';

type ContactForm = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

type ContactErrors = Partial<Record<keyof ContactForm, string>>;

const initialForm: ContactForm = {
  name: '',
  email: '',
  subject: '',
  message: '',
};

const faqItems = [
  {
    question: 'What should I include in a support message?',
    answer:
      'Include the input type, file format, OCR mode, and a short description of what went wrong.',
  },
  {
    question: 'Can I report OCR quality issues?',
    answer:
      'Yes. Please describe the source scan and include the expected Fraktur text if you know it.',
  },
  {
    question: 'Which OCR modes are supported?',
    answer:
      'The project currently supports Gemini API mode and is preparing a local Calamari-based workflow.',
  },
  {
    question: 'Is my API key stored by the server?',
    answer:
      'No. User-supplied OpenRouter keys are sent per request and are not stored by the backend.',
  },
];

export default function ContactPage() {
  const [form, setForm] = useState<ContactForm>(initialForm);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const updateField = (field: keyof ContactForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitted(false);
    setSubmitError(null);
  };

  const validate = () => {
    const nextErrors: ContactErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = 'Name is required.';
    }

    if (!form.email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!form.message.trim()) {
      nextErrors.message = 'Message is required.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      await submitContactMessage(form);
      setSubmitted(true);
      setForm(initialForm);
    } catch (error) {
      if (error instanceof ContactApiError) {
        if (error.fieldErrors) {
          setErrors(error.fieldErrors);
        }
        setSubmitError(error.message);
      } else {
        setSubmitError('Network error. Please try again later.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="contact-page-shell">
      <style>{`
        .contact-page-shell {
          min-height: calc(100vh - 88px);
          background: #f4f6f9;
          color: #17172a;
          padding: 64px 28px 72px;
        }

        .contact-page-inner {
          width: min(1120px, 100%);
          margin: 0 auto;
        }

        .contact-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .contact-title {
          margin: 0;
          color: #17172a;
          font-size: clamp(32px, 4vw, 48px);
          line-height: 1.1;
          letter-spacing: -0.02em;
          font-weight: 700;
        }

        .contact-subtitle {
          margin: 12px auto 0;
          max-width: 640px;
          color: #6b7280;
          font-size: 16px;
          line-height: 1.6;
          font-weight: 300;
        }

        .contact-card {
          border: 1px solid #dfe4ec;
          border-radius: 8px;
          background: #ffffff;
          box-shadow: 0 18px 45px rgba(20, 24, 36, 0.08);
          padding: 36px;
        }

        .contact-form {
          display: grid;
          gap: 22px;
        }

        .contact-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 22px;
        }

        .contact-field {
          display: grid;
          gap: 8px;
        }

        .contact-field label {
          color: #0d1326;
          font-size: 0.96rem;
          font-weight: 700;
        }

        .contact-field input,
        .contact-field textarea {
          width: 100%;
          border: 1px solid #d9dee8;
          border-radius: 8px;
          background: #f8f9fb;
          color: #17172a;
          font: inherit;
          font-size: 1rem;
          outline: none;
          transition: border-color 0.16s ease, box-shadow 0.16s ease, background 0.16s ease;
        }

        .contact-field input {
          min-height: 56px;
          padding: 0 18px;
        }

        .contact-field textarea {
          min-height: 220px;
          resize: vertical;
          padding: 16px 18px;
          line-height: 1.6;
        }

        .contact-field input:focus,
        .contact-field textarea:focus {
          border-color: #3b4558;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(59, 69, 88, 0.12);
        }

        .contact-field input::placeholder,
        .contact-field textarea::placeholder {
          color: #96a0b2;
        }

        .contact-error {
          color: #b42318;
          font-size: 0.88rem;
        }

        .contact-submit-error {
          color: #b42318;
          font-size: 0.95rem;
          font-weight: 700;
        }

        .contact-submit-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
        }

        .contact-submit-success {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #26734d;
          font-size: 0.95rem;
          font-weight: 700;
        }

        .contact-submit-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          min-height: 50px;
          border: 0;
          border-radius: 8px;
          padding: 0 24px;
          background: #1b1209;
          color: #ffffff;
          font: inherit;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 14px 28px rgba(27, 18, 9, 0.18);
          transition: transform 0.16s ease, background 0.16s ease, box-shadow 0.16s ease;
        }

        .contact-submit-button:disabled {
          cursor: not-allowed;
          opacity: 0.68;
          transform: none;
          box-shadow: none;
        }

        .contact-submit-button:hover {
          background: #2b2118;
          transform: translateY(-1px);
          box-shadow: 0 18px 32px rgba(27, 18, 9, 0.22);
        }

        .contact-faq {
          margin-top: 42px;
        }

        .contact-faq-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 18px;
        }

        .contact-faq-title {
          margin: 0;
          font-size: 1.55rem;
          color: #17172a;
        }

        .contact-faq-note {
          margin: 0;
          color: #6a7487;
          font-size: 0.98rem;
        }

        .contact-faq-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .contact-faq-item {
          border: 1px solid #dfe4ec;
          border-radius: 8px;
          background: #ffffff;
          padding: 22px;
          box-shadow: 0 12px 30px rgba(20, 24, 36, 0.05);
        }

        .contact-faq-question {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin: 0;
          color: #17172a;
          font-size: 1.02rem;
          font-weight: 800;
          line-height: 1.35;
        }

        .contact-faq-question svg {
          flex: 0 0 auto;
          margin-top: 1px;
          color: #9a6f2f;
        }

        .contact-faq-answer {
          margin: 10px 0 0 30px;
          color: #5f6a7e;
          line-height: 1.65;
        }

        @media (max-width: 760px) {
          .contact-page-shell {
            padding: 42px 18px 56px;
          }

          .contact-card {
            padding: 24px;
          }

          .contact-form-grid,
          .contact-faq-grid {
            grid-template-columns: 1fr;
          }

          .contact-faq-header,
          .contact-submit-row {
            align-items: stretch;
            flex-direction: column;
          }

          .contact-submit-button {
            width: 100%;
          }
        }
      `}</style>

      <div className="contact-page-inner">
        <header className="contact-header">
          <h1 className="contact-title">Contact Us</h1>
          <p className="contact-subtitle">
            Have questions or feedback about the Fraktur OCR system? Send a message to the project team.
          </p>
        </header>

        <section className="contact-card" aria-label="Contact form">
          <form className="contact-form" onSubmit={handleSubmit} noValidate>
            <div className="contact-form-grid">
              <div className="contact-field">
                <label htmlFor="contact-name">Name *</label>
                <input
                  id="contact-name"
                  value={form.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  placeholder="Your name"
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? 'contact-name-error' : undefined}
                />
                {errors.name && (
                  <span className="contact-error" id="contact-name-error">
                    {errors.name}
                  </span>
                )}
              </div>

              <div className="contact-field">
                <label htmlFor="contact-email">Email *</label>
                <input
                  id="contact-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  placeholder="your.email@example.com"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'contact-email-error' : undefined}
                />
                {errors.email && (
                  <span className="contact-error" id="contact-email-error">
                    {errors.email}
                  </span>
                )}
              </div>
            </div>

            <div className="contact-field">
              <label htmlFor="contact-subject">Subject</label>
              <input
                id="contact-subject"
                value={form.subject}
                onChange={(event) => updateField('subject', event.target.value)}
                placeholder="What is this regarding?"
              />
            </div>

            <div className="contact-field">
              <label htmlFor="contact-message">Message *</label>
              <textarea
                id="contact-message"
                value={form.message}
                onChange={(event) => updateField('message', event.target.value)}
                placeholder="Tell us how we can help..."
                aria-invalid={Boolean(errors.message)}
                aria-describedby={errors.message ? 'contact-message-error' : undefined}
              />
              {errors.message && (
                <span className="contact-error" id="contact-message-error">
                  {errors.message}
                </span>
              )}
            </div>

            <div className="contact-submit-row">
              {submitted ? (
                <span className="contact-submit-success">
                  <CheckCircle2 size={18} aria-hidden="true" />
                  Message sent successfully.
                </span>
              ) : submitError ? (
                <span className="contact-submit-error">{submitError}</span>
              ) : (
                <span />
              )}
              <button className="contact-submit-button" type="submit" disabled={submitting}>
                <Send size={18} aria-hidden="true" />
                {submitting ? 'Sending...' : 'Send message'}
              </button>
            </div>
          </form>
        </section>

        <section className="contact-faq" aria-labelledby="contact-faq-title">
          <div className="contact-faq-header">
            <h2 className="contact-faq-title" id="contact-faq-title">
              Common Questions
            </h2>
            <p className="contact-faq-note">Useful context before sending a message.</p>
          </div>

          <div className="contact-faq-grid">
            {faqItems.map((item) => (
              <article className="contact-faq-item" key={item.question}>
                <h3 className="contact-faq-question">
                  <HelpCircle size={20} aria-hidden="true" />
                  {item.question}
                </h3>
                <p className="contact-faq-answer">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
