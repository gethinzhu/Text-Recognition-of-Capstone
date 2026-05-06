import { useState } from 'react';
import type { FormEvent } from 'react';
import { CheckCircle2, HelpCircle, Send } from 'lucide-react';
import { ContactApiError, submitContactMessage } from '../api';
import '../css/ContactPage.css';

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
      <div className="contact-page-inner">
        <header className="contact-header">
          <h1 className="contact-title">Contact Us</h1>
          <p className="contact-subtitle">
            Have questions or feedback about the Fraktur OCR system? Send a message to the project team.
          </p>
          <p className="contact-email-note">
            You can also contact us directly at{' '}
            <a href="mailto:deciffer.contact@gmail.com">deciffer.contact@gmail.com</a>.
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
