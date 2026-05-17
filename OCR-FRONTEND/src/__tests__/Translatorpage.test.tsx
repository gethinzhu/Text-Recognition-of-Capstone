import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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
  default: ({
    onBack,
    onCopy,
    onExportPdf,
    onExportDocx,
    onClear,
  }: {
    onBack: () => void;
    onCopy: () => void;
    onExportPdf: () => void;
    onExportDocx: () => void;
    onClear: () => void;
  }) => (
    <div data-testid="results-section">
      <button onClick={onBack}>Back</button>
      <button onClick={onCopy}>Copy Text</button>
      <button onClick={onExportPdf}>Export PDF</button>
      <button onClick={onExportDocx}>Export DOCX</button>
      <button onClick={onClear}>New Translation</button>
    </div>
  ),
}));

vi.mock('../utils/extractPreviews', () => ({
  extractPreviews: vi.fn(() => ({})),
}));

vi.mock('jspdf', () => ({
  // Must use a regular function (not arrow) so it works with `new jsPDF()`
  jsPDF: vi.fn(function (this: Record<string, unknown>) {
    this.internal = { pageSize: { getWidth: () => 210, getHeight: () => 297 } };
    this.setFont = vi.fn();
    this.setFontSize = vi.fn();
    this.splitTextToSize = vi.fn().mockReturnValue(['mocked line']);
    this.text = vi.fn();
    this.addPage = vi.fn();
    this.line = vi.fn();
    this.save = vi.fn();
  }),
}));

vi.mock('file-saver', () => ({
  saveAs: vi.fn(),
}));

vi.mock('docx', () => ({
  Document: vi.fn(function () {}),
  Packer: { toBlob: vi.fn().mockResolvedValue(new Blob(['docx'])) },
  Paragraph: vi.fn(function () {}),
  TextRun: vi.fn(function () {}),
  HeadingLevel: { HEADING_1: 'Heading1' },
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
    expect(screen.getByText('Select File', { selector: 'button' })).toBeInTheDocument();
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

  // ── View Results Banner ────────────────────────────────────────────────────

  it('shows view-results banner after returning to input from results', async () => {
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
    await waitFor(() => expect(screen.getByTestId('results-section')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /Back/i }));
    expect(screen.getByText(/View results/i)).toBeInTheDocument();
  });

  it('navigates back to results when View results banner button is clicked', async () => {
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
    await waitFor(() => expect(screen.getByTestId('results-section')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /Back/i }));
    await user.click(screen.getByText(/View results →/i));
    expect(screen.getByTestId('results-section')).toBeInTheDocument();
  });

  // ── Credits error ──────────────────────────────────────────────────────────

  it('shows CreditsErrorCard when translation error contains "insufficient"', async () => {
    const user = userEvent.setup();
    vi.mocked(api.handleTranslate).mockRejectedValueOnce(
      new Error('insufficient credits')
    );
    renderPage();
    await user.type(
      screen.getByPlaceholderText(/Paste or type your Fraktur text/i),
      'Some text'
    );
    await user.click(screen.getByRole('button', { name: /Recognise Text/i }));
    await waitFor(() => {
      expect(screen.getByText('Insufficient Balance')).toBeInTheDocument();
    });
  });

  // ── Copy / Export ──────────────────────────────────────────────────────────

  it('calls navigator.clipboard.writeText when Copy Text is clicked', async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
      writable: true,
    });
    vi.mocked(api.handleTranslate).mockResolvedValueOnce({
      direct_text: { text: 'Recognised text' },
    });
    renderPage();
    await user.type(
      screen.getByPlaceholderText(/Paste or type your Fraktur text/i),
      'Some text'
    );
    await user.click(screen.getByRole('button', { name: /Recognise Text/i }));
    await waitFor(() => expect(screen.getByTestId('results-section')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /Copy Text/i }));
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });

  it('calls jsPDF.save on Export PDF click', async () => {
    const user = userEvent.setup();
    const { jsPDF } = await import('jspdf');
    const mockSave = vi.fn();
    vi.mocked(jsPDF).mockImplementation(function (this: Record<string, unknown>) {
      this.internal = { pageSize: { getWidth: () => 210, getHeight: () => 297 } };
      this.setFont = vi.fn();
      this.setFontSize = vi.fn();
      this.splitTextToSize = vi.fn().mockReturnValue(['line']);
      this.text = vi.fn();
      this.addPage = vi.fn();
      this.line = vi.fn();
      this.save = mockSave;
    } as any);
    vi.mocked(api.handleTranslate).mockResolvedValueOnce({
      direct_text: { text: 'Recognised text' },
    });
    renderPage();
    await user.type(
      screen.getByPlaceholderText(/Paste or type your Fraktur text/i),
      'Some text'
    );
    await user.click(screen.getByRole('button', { name: /Recognise Text/i }));
    await waitFor(() => expect(screen.getByTestId('results-section')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /Export PDF/i }));
    expect(mockSave).toHaveBeenCalledWith('fraktur-output.pdf');
  });

  it('calls Packer.toBlob and saveAs on Export DOCX click', async () => {
    const user = userEvent.setup();
    const { saveAs } = await import('file-saver');
    const { Packer } = await import('docx');
    vi.mocked(api.handleTranslate).mockResolvedValueOnce({
      direct_text: { text: 'Recognised text' },
    });
    renderPage();
    await user.type(
      screen.getByPlaceholderText(/Paste or type your Fraktur text/i),
      'Some text'
    );
    await user.click(screen.getByRole('button', { name: /Recognise Text/i }));
    await waitFor(() => expect(screen.getByTestId('results-section')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /Export DOCX/i }));
    await waitFor(() => {
      expect(Packer.toBlob).toHaveBeenCalled();
      expect(saveAs).toHaveBeenCalled();
    });
  });

  it('clears results and returns to input on New Translation click', async () => {
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
    await waitFor(() => expect(screen.getByTestId('results-section')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /New Translation/i }));
    expect(screen.getByText('Fraktur Text Recogniser')).toBeInTheDocument();
    expect(screen.queryByTestId('results-section')).not.toBeInTheDocument();
  });

  // ── Drag and drop ──────────────────────────────────────────────────────────

  it('activates drag-active class on dragenter over the drop zone', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByText('File'));
    const dropZone = document.querySelector('.file-drop-zone') as HTMLElement;
    fireEvent.dragEnter(dropZone);
    expect(dropZone).toHaveClass('drag-active');
  });

  it('maintains drag-active class on dragover', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByText('File'));
    const dropZone = document.querySelector('.file-drop-zone') as HTMLElement;
    fireEvent.dragOver(dropZone, { dataTransfer: { dropEffect: 'none' } });
    expect(dropZone).toHaveClass('drag-active');
  });

  it('deactivates drag-active on dragleave when relatedTarget is outside', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByText('File'));
    const dropZone = document.querySelector('.file-drop-zone') as HTMLElement;
    fireEvent.dragEnter(dropZone);
    fireEvent.dragLeave(dropZone, { relatedTarget: null });
    expect(dropZone).not.toHaveClass('drag-active');
  });

  it('deactivates drag-active on drop and shows dropped filename', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByText('File'));
    const dropZone = document.querySelector('.file-drop-zone') as HTMLElement;
    fireEvent.dragEnter(dropZone);
    const file = new File(['data'], 'dropped.jpg', { type: 'image/jpeg' });
    // jsdom does not implement DataTransfer; build a FileList-compatible object
    const fileList = Object.assign([file], {
      item: (i: number) => (i === 0 ? file : null),
    }) as unknown as FileList;
    fireEvent.drop(dropZone, { dataTransfer: { files: fileList } });
    expect(dropZone).not.toHaveClass('drag-active');
    expect(screen.getByText('dropped.jpg')).toBeInTheDocument();
  });

  it('opens file browser on Enter key press on the drop zone', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByText('File'));
    const dropZone = document.querySelector('.file-drop-zone') as HTMLElement;
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
    fireEvent.keyDown(dropZone, { key: 'Enter' });
    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  // ── Camera ────────────────────────────────────────────────────────────────

  it('shows error when browser does not support getUserMedia', async () => {
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: undefined,
      configurable: true,
      writable: true,
    });
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByText('Camera'));
    await user.click(screen.getByRole('button', { name: /Open Camera/i }));
    await waitFor(() => {
      expect(
        screen.getByText(/Live camera preview is not supported in this browser/i)
      ).toBeInTheDocument();
    });
  });

  it('shows Stop button when camera starts successfully', async () => {
    const mockStream = {
      getTracks: () => [{ stop: vi.fn() }],
      getVideoTracks: () => [{ getSettings: () => ({ deviceId: 'default' }) }],
    };
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
        enumerateDevices: vi.fn().mockResolvedValue([]),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
      configurable: true,
      writable: true,
    });
    vi.spyOn(HTMLVideoElement.prototype, 'play').mockResolvedValue(undefined);

    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByText('Camera'));
    await user.click(screen.getByRole('button', { name: /Open Camera/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Stop/i })).toBeInTheDocument();
    });
  });

  it('hides Stop button after clicking Stop', async () => {
    const mockStream = {
      getTracks: () => [{ stop: vi.fn() }],
      getVideoTracks: () => [{ getSettings: () => ({ deviceId: 'default' }) }],
    };
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
        enumerateDevices: vi.fn().mockResolvedValue([]),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
      configurable: true,
      writable: true,
    });
    vi.spyOn(HTMLVideoElement.prototype, 'play').mockResolvedValue(undefined);

    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByText('Camera'));
    await user.click(screen.getByRole('button', { name: /Open Camera/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /Stop/i })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /Stop/i }));
    expect(screen.queryByRole('button', { name: /Stop/i })).not.toBeInTheDocument();
  });

  it('shows camera error when getUserMedia rejects', async () => {
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockRejectedValue(new Error('Permission denied')),
        enumerateDevices: vi.fn().mockResolvedValue([]),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
      configurable: true,
      writable: true,
    });
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByText('Camera'));
    await user.click(screen.getByRole('button', { name: /Open Camera/i }));
    await waitFor(() => {
      expect(screen.getByText(/Camera access failed: Permission denied/i)).toBeInTheDocument();
    });
  });

  it('shows camera-not-ready error when Capture is clicked with zero video dimensions', async () => {
    const mockStream = {
      getTracks: () => [{ stop: vi.fn() }],
      getVideoTracks: () => [{ getSettings: () => ({ deviceId: 'default' }) }],
    };
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
        enumerateDevices: vi.fn().mockResolvedValue([]),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
      configurable: true,
      writable: true,
    });
    vi.spyOn(HTMLVideoElement.prototype, 'play').mockResolvedValue(undefined);

    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByText('Camera'));
    await user.click(screen.getByRole('button', { name: /Open Camera/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /Capture/i })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /Capture/i }));
    await waitFor(() => {
      expect(screen.getByText(/Camera preview is not ready yet/i)).toBeInTheDocument();
    });
  });

  // ── API Key panel ─────────────────────────────────────────────────────────

  it('closes API key panel when clicking outside', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: /API Key/i }));
    expect(screen.getByPlaceholderText('sk-or-v1-...')).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    await waitFor(() => {
      expect(screen.queryByPlaceholderText('sk-or-v1-...')).not.toBeInTheDocument();
    });
  });

  it('toggles API key visibility between password and text', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: /API Key/i }));
    const input = screen.getByPlaceholderText('sk-or-v1-...');
    expect(input).toHaveAttribute('type', 'password');
    await user.click(screen.getByTitle('Show key'));
    expect(input).toHaveAttribute('type', 'text');
    await user.click(screen.getByTitle('Hide key'));
    expect(input).toHaveAttribute('type', 'password');
  });

  it('drag-drop with empty file list does nothing', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByText('File'));
    const dropZone = document.querySelector('.file-drop-zone') as HTMLElement;
    fireEvent.dragEnter(dropZone);
    expect(dropZone).toHaveClass('drag-active');
    const emptyList = Object.assign([], { item: () => null }) as unknown as FileList;
    fireEvent.drop(dropZone, { dataTransfer: { files: emptyList } });
    expect(dropZone).not.toHaveClass('drag-active');
    expect(screen.getByText('Click to upload or drag and drop')).toBeInTheDocument();
  });

  it('handles camera photo captured via native camera input', async () => {
    Object.defineProperty(global.URL, 'createObjectURL', {
      value: vi.fn().mockReturnValue('blob:mock-url'),
      configurable: true,
      writable: true,
    });
    Object.defineProperty(global.URL, 'revokeObjectURL', {
      value: vi.fn(),
      configurable: true,
      writable: true,
    });
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: undefined,
      configurable: true,
      writable: true,
    });

    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByText('Camera'));

    const cameraInput = document.querySelector('input[capture]') as HTMLInputElement;
    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
    const fileList = Object.assign([file], {
      item: (i: number) => (i === 0 ? file : null),
    }) as unknown as FileList;
    Object.defineProperty(cameraInput, 'files', { value: fileList, configurable: true });
    fireEvent.change(cameraInput);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Retake/i })).toBeInTheDocument();
    });
  });

  it('clicking Retake clears camera preview and hides Retake button', async () => {
    Object.defineProperty(global.URL, 'createObjectURL', {
      value: vi.fn().mockReturnValue('blob:mock-url'),
      configurable: true,
      writable: true,
    });
    Object.defineProperty(global.URL, 'revokeObjectURL', {
      value: vi.fn(),
      configurable: true,
      writable: true,
    });
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: undefined,
      configurable: true,
      writable: true,
    });

    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByText('Camera'));

    const cameraInput = document.querySelector('input[capture]') as HTMLInputElement;
    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
    const fileList = Object.assign([file], {
      item: (i: number) => (i === 0 ? file : null),
    }) as unknown as FileList;
    Object.defineProperty(cameraInput, 'files', { value: fileList, configurable: true });
    fireEvent.change(cameraInput);

    await waitFor(() => expect(screen.getByRole('button', { name: /Retake/i })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /Retake/i }));
    expect(screen.queryByRole('button', { name: /Retake/i })).not.toBeInTheDocument();
  });

  it('clicking API Key in Calamari mode switches back to Gemini and opens panel', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('switch', { name: /OCR engine is Gemini/i }));
    expect(screen.getByRole('switch', { name: /OCR engine is Calamari/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /API Key/i }));
    // Clicking API Key in Calamari mode switches engine back to Gemini and opens the panel
    expect(screen.getByRole('switch', { name: /OCR engine is Gemini/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('sk-or-v1-...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('sk-or-v1-...')).not.toBeDisabled();
  });
});