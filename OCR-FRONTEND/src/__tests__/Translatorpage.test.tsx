import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import TranslatorPage from '../pages/TranslatorPage';
import * as api from '../api';

// ── Mocks ──────────────────────────────────────────────────────────────────────

vi.mock('../api', () => ({
  handleTranslate: vi.fn(),
}));

vi.mock('../components/ResultsSection', () => ({
  default: ({ onBack }: { onBack: () => void }) => (
    <div data-testid="results-section">
      <button onClick={onBack}>Back</button>
    </div>
  ),
}));

vi.mock('../utils/extractPreviews', () => ({
  extractPreviews: vi.fn(() => ({})),
}));

// ── Helpers ────────────────────────────────────────────────────────────────────

const renderPage = () =>
  render(
    <MemoryRouter>
      <TranslatorPage />
    </MemoryRouter>
  );

const makeFile = (name = 'scan.jpg', type = 'image/jpeg') =>
  new File(['binary'], name, { type });

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('TranslatorPage', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  // ── Layout ──────────────────────────────────────────────────────────────────

  it('renders the page title', () => {
    renderPage();
    expect(screen.getByText('Fraktur Text Recogniser')).toBeInTheDocument();
  });

  it('renders the subtitle', () => {
    renderPage();
    expect(screen.getByText(/Recognise historical Fraktur documents/i)).toBeInTheDocument();
  });

  it('renders all three input tabs', () => {
    renderPage();
    expect(screen.getByText('Text')).toBeInTheDocument();
    expect(screen.getByText('File')).toBeInTheDocument();
    expect(screen.getByText('Camera')).toBeInTheDocument();
  });

  it('renders the supported formats bar', () => {
    renderPage();
    expect(screen.getByText('Supported Formats')).toBeInTheDocument();
    expect(screen.getByText('JPG')).toBeInTheDocument();
    expect(screen.getByText('Direct Text')).toBeInTheDocument();
  });

  // ── Text Tab ─────────────────────────────────────────────────────────────────

  it('shows text textarea by default', () => {
    renderPage();
    expect(screen.getByPlaceholderText(/Paste or type your Fraktur text/i)).toBeInTheDocument();
  });

  it('Recognise Text button is disabled when textarea is empty', () => {
    renderPage();
    const btn = screen.getByRole('button', { name: /Recognise Text/i });
    expect(btn).toBeDisabled();
  });

  it('Recognise Text button enables when text is entered', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(
      screen.getByPlaceholderText(/Paste or type your Fraktur text/i),
      'Sample Fraktur text'
    );
    expect(screen.getByRole('button', { name: /Recognise Text/i })).not.toBeDisabled();
  });

  it('Clear button is disabled when no input exists', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /Clear/i })).toBeDisabled();
  });

  it('Clear button clears the textarea', async () => {
    const user = userEvent.setup();
    renderPage();
    const textarea = screen.getByPlaceholderText(/Paste or type your Fraktur text/i);
    await user.type(textarea, 'Some text');
    await user.click(screen.getByRole('button', { name: /Clear/i }));
    expect(textarea).toHaveValue('');
  });

  // ── Tab Switching ────────────────────────────────────────────────────────────

  it('switches to File tab on click', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByText('File'));
    expect(screen.getByText('Click to upload or drag and drop')).toBeInTheDocument();
  });

  it('switches to Camera tab on click', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByText('Camera'));
    expect(screen.getByText('Open Camera')).toBeInTheDocument();
  });

  it('switches back to Text tab from File tab', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByText('File'));
    await user.click(screen.getByText('Text'));
    expect(screen.getByPlaceholderText(/Paste or type your Fraktur text/i)).toBeInTheDocument();
  });

  // ── File Tab ─────────────────────────────────────────────────────────────────

  it('shows Select File button on File tab', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByText('File'));
    expect(screen.getByRole('button', { name: /Select File/i })).toBeInTheDocument();
  });

  it('Recognise Text button is disabled on File tab with no file selected', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByText('File'));
    expect(screen.getByRole('button', { name: /Recognise Text/i })).toBeDisabled();
  });

  // ── OCR Engine Toggle ────────────────────────────────────────────────────────

  it('shows Gemini engine by default', () => {
    renderPage();
    expect(screen.getByRole('switch', { name: /OCR engine is Gemini/i })).toBeInTheDocument();
  });

  it('switches to Calamari engine on toggle click', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('switch', { name: /OCR engine is Gemini/i }));
    expect(screen.getByRole('switch', { name: /OCR engine is Calamari/i })).toBeInTheDocument();
  });

  it('switches back to Gemini engine on second toggle click', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('switch', { name: /OCR engine is Gemini/i }));
    await user.click(screen.getByRole('switch', { name: /OCR engine is Calamari/i }));
    expect(screen.getByRole('switch', { name: /OCR engine is Gemini/i })).toBeInTheDocument();
  });

  it('shows Calamari warning note on text tab in Calamari mode', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('switch', { name: /OCR engine is Gemini/i }));
    expect(
      screen.getByText(/Calamari only works with image data/i)
    ).toBeInTheDocument();
  });

  it('disables Recognise Text button in Calamari mode on text tab', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(
      screen.getByPlaceholderText(/Paste or type your Fraktur text/i),
      'Some text'
    );
    await user.click(screen.getByRole('switch', { name: /OCR engine is Gemini/i }));
    expect(screen.getByRole('button', { name: /Recognise Text/i })).toBeDisabled();
  });

  // ── API Key Panel ────────────────────────────────────────────────────────────

  it('opens API key panel on API Key button click', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: /API Key/i }));
    expect(screen.getByPlaceholderText('sk-or-v1-...')).toBeInTheDocument();
  });

  it('saves API key to localStorage on input', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: /API Key/i }));
    await user.type(screen.getByPlaceholderText('sk-or-v1-...'), 'sk-test-key');
    expect(localStorage.getItem('openrouter_api_key')).toBe('sk-test-key');
  });

  // ── Translation ──────────────────────────────────────────────────────────────

  it('calls handleTranslate with correct params on text input', async () => {
    const user = userEvent.setup();
    vi.mocked(api.handleTranslate).mockResolvedValueOnce({
      direct_text: { text: 'Recognised text' },
    });

    renderPage();
    await user.type(
      screen.getByPlaceholderText(/Paste or type your Fraktur text/i),
      'Fraktur input'
    );
    await user.click(screen.getByRole('button', { name: /Recognise Text/i }));

    await waitFor(() => {
      expect(api.handleTranslate).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'text',
          data: 'Fraktur input',
          engine: 'gemini',
        })
      );
    });
  });

  it('shows error message when handleTranslate rejects', async () => {
    const user = userEvent.setup();
    vi.mocked(api.handleTranslate).mockRejectedValueOnce(new Error('Server error'));

    renderPage();
    await user.type(
      screen.getByPlaceholderText(/Paste or type your Fraktur text/i),
      'Some text'
    );
    await user.click(screen.getByRole('button', { name: /Recognise Text/i }));

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });

  it('shows results section after successful translation', async () => {
    const user = userEvent.setup();
    vi.mocked(api.handleTranslate).mockResolvedValueOnce({
      direct_text: { text: 'Recognised text' },
    });

    renderPage();
    await user.type(
      screen.getByPlaceholderText(/Paste or type your Fraktur text/i),
      'Some text'
    );
    await user.click(screen.getByRole('button', { name: /Recognise Text/i }));

    await waitFor(() => {
      expect(screen.getByTestId('results-section')).toBeInTheDocument();
    });
  });

  it('returns to input view when Back is clicked in results section', async () => {
    const user = userEvent.setup();
    vi.mocked(api.handleTranslate).mockResolvedValueOnce({
      direct_text: { text: 'Recognised text' },
    });

    renderPage();
    await user.type(
      screen.getByPlaceholderText(/Paste or type your Fraktur text/i),
      'Some text'
    );
    await user.click(screen.getByRole('button', { name: /Recognise Text/i }));

    await waitFor(() => {
      expect(screen.getByTestId('results-section')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Back/i }));
    expect(screen.getByText('Fraktur Text Recogniser')).toBeInTheDocument();
  });
});