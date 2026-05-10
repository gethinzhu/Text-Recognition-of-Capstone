import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ContactPage from '../pages/ContactPage';
import * as api from '../api';
import { ContactApiError } from '../api';

// ── Mocks ──────────────────────────────────────────────────────────────────────

vi.mock('../api', () => ({
  submitContactMessage: vi.fn(),
  ContactApiError: class ContactApiError extends Error {
    status: number;
    fieldErrors?: Record<string, string>;
    constructor(message: string, status: number, fieldErrors?: Record<string, string>) {
      super(message);
      this.name = 'ContactApiError';
      this.status = status;
      this.fieldErrors = fieldErrors;
    }
  },
}));

// ── Helpers ────────────────────────────────────────────────────────────────────

const renderPage = () => render(<ContactPage />);

const fillForm = async (
  user: ReturnType<typeof userEvent.setup>,
  overrides: Partial<{ name: string; email: string; subject: string; message: string }> = {}
) => {
  const fields = {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    subject: 'Test subject',
    message: 'Hello there.',
    ...overrides,
  };

  if (fields.name) await user.type(screen.getByLabelText(/Name/i), fields.name);
  if (fields.email) await user.type(screen.getByLabelText(/Email/i), fields.email);
  if (fields.subject) await user.type(screen.getByLabelText(/Subject/i), fields.subject);
  if (fields.message) await user.type(screen.getByLabelText(/Message/i), fields.message);
};

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('ContactPage', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Layout ─────────────────────────────────────────────────────────────────

  it('renders the page title', () => {
    renderPage();
    expect(screen.getByText('Contact Us')).toBeInTheDocument();
  });

  it('renders the subtitle', () => {
    renderPage();
    expect(screen.getByText(/Have questions or feedback/i)).toBeInTheDocument();
  });

  it('renders the direct email link', () => {
    renderPage();
    const link = screen.getByRole('link', { name: /deciffer.contact@gmail.com/i });
    expect(link).toHaveAttribute('href', 'mailto:deciffer.contact@gmail.com');
  });

  it('renders all form fields', () => {
    renderPage();
    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Subject/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Message/i)).toBeInTheDocument();
  });

  it('renders the Send message button', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /Send message/i })).toBeInTheDocument();
  });

  it('renders all FAQ items', () => {
    renderPage();
    expect(screen.getByText(/What should I include in a support message/i)).toBeInTheDocument();
    expect(screen.getByText(/Can I report OCR quality issues/i)).toBeInTheDocument();
    expect(screen.getByText(/Which OCR modes are supported/i)).toBeInTheDocument();
    expect(screen.getByText(/Is my API key stored by the server/i)).toBeInTheDocument();
  });

  // ── Validation ─────────────────────────────────────────────────────────────

  it('shows error when Name is empty on submit', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: /Send message/i }));
    expect(screen.getByText('Name is required.')).toBeInTheDocument();
  });

  it('shows error when Email is empty on submit', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: /Send message/i }));
    expect(screen.getByText('Email is required.')).toBeInTheDocument();
  });

  it('shows error when Message is empty on submit', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: /Send message/i }));
    expect(screen.getByText('Message is required.')).toBeInTheDocument();
  });

  it('shows error for invalid email format', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText(/Name/i), 'Ada');
    await user.type(screen.getByLabelText(/Email/i), 'not-an-email');
    await user.type(screen.getByLabelText(/Message/i), 'Hello');
    await user.click(screen.getByRole('button', { name: /Send message/i }));
    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument();
  });

  it('clears field error when user starts typing', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: /Send message/i }));
    expect(screen.getByText('Name is required.')).toBeInTheDocument();
    await user.type(screen.getByLabelText(/Name/i), 'A');
    expect(screen.queryByText('Name is required.')).not.toBeInTheDocument();
  });

  it('does not call submitContactMessage when validation fails', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: /Send message/i }));
    expect(api.submitContactMessage).not.toHaveBeenCalled();
  });

  // ── Submission ─────────────────────────────────────────────────────────────

  it('calls submitContactMessage with correct payload on valid submit', async () => {
    const user = userEvent.setup();
    vi.mocked(api.submitContactMessage).mockResolvedValueOnce({
      id: '1',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      subject: 'Test subject',
      message: 'Hello there.',
      created_at: '2026-01-01T00:00:00Z',
    });

    renderPage();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /Send message/i }));

    await waitFor(() => {
      expect(api.submitContactMessage).toHaveBeenCalledWith({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        subject: 'Test subject',
        message: 'Hello there.',
      });
    });
  });

  it('shows success message after successful submission', async () => {
    const user = userEvent.setup();
    vi.mocked(api.submitContactMessage).mockResolvedValueOnce({
      id: '1',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      subject: 'Test subject',
      message: 'Hello there.',
      created_at: '2026-01-01T00:00:00Z',
    });

    renderPage();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /Send message/i }));

    await waitFor(() => {
      expect(screen.getByText(/Message sent successfully/i)).toBeInTheDocument();
    });
  });

  it('resets form fields after successful submission', async () => {
    const user = userEvent.setup();
    vi.mocked(api.submitContactMessage).mockResolvedValueOnce({
      id: '1',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      subject: 'Test',
      message: 'Hello.',
      created_at: '2026-01-01T00:00:00Z',
    });

    renderPage();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /Send message/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/Name/i)).toHaveValue('');
      expect(screen.getByLabelText(/Email/i)).toHaveValue('');
      expect(screen.getByLabelText(/Message/i)).toHaveValue('');
    });
  });

  it('shows submitting state while request is in flight', async () => {
    const user = userEvent.setup();
    vi.mocked(api.submitContactMessage).mockImplementationOnce(
      () => new Promise(() => {}) // never resolves
    );

    renderPage();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /Send message/i }));

    expect(screen.getByRole('button', { name: /Sending.../i })).toBeDisabled();
  });

  // ── Error Handling ─────────────────────────────────────────────────────────

  it('shows API error message on ContactApiError', async () => {
    const user = userEvent.setup();
    vi.mocked(api.submitContactMessage).mockRejectedValueOnce(
      new ContactApiError('Server validation failed.', 422)
    );

    renderPage();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /Send message/i }));

    await waitFor(() => {
      expect(screen.getByText('Server validation failed.')).toBeInTheDocument();
    });
  });

  it('shows field errors from ContactApiError fieldErrors', async () => {
    const user = userEvent.setup();
    vi.mocked(api.submitContactMessage).mockRejectedValueOnce(
      new ContactApiError('Validation failed.', 422, {
        email: 'Enter a valid email address.',
      })
    );

    renderPage();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /Send message/i }));

    await waitFor(() => {
      expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument();
    });
  });

  it('shows network error message on unknown error', async () => {
    const user = userEvent.setup();
    vi.mocked(api.submitContactMessage).mockRejectedValueOnce(new Error('Network error'));

    renderPage();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /Send message/i }));

    await waitFor(() => {
      expect(screen.getByText(/Network error. Please try again later./i)).toBeInTheDocument();
    });
  });
});