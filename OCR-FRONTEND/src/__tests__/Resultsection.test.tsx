import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ResultsSection from '../components/ResultsSection';
import type { ResultItem } from '../components/ResultView';

// ── Mock ResultView to keep tests focused on ResultsSection ──────────────────
vi.mock('../components/ResultView', () => ({
  default: ({ items }: { items: ResultItem[] }) => (
    <div data-testid="result-view">
      {items.map((item) => (
        <div key={item.fileName}>{item.text}</div>
      ))}
    </div>
  ),
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

const mockItem = (overrides?: Partial<ResultItem>): ResultItem => ({
  fileName: 'test.jpg',
  text: 'Recognised OCR text',
  ...overrides,
});

const defaultProps = {
  items: [mockItem()],
  previews: {},
  copied: false,
  onBack: vi.fn(),
  onCopy: vi.fn(),
  onExportPdf: vi.fn(),
  onExportDocx: vi.fn(),
  onClear: vi.fn(),
};

const renderSection = (props = {}) =>
  render(<ResultsSection {...defaultProps} {...props} />);

// ── Tests ────────────────────────────────────────────────────────────────────

describe('ResultsSection', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  it('renders the Back to Input button', () => {
    renderSection();
    expect(screen.getByRole('button', { name: /Back to Input/i })).toBeInTheDocument();
  });

  it('renders the Copy Text button', () => {
    renderSection();
    expect(screen.getByRole('button', { name: /Copy Text/i })).toBeInTheDocument();
  });

  it('renders the Download PDF button', () => {
    renderSection();
    expect(screen.getByRole('button', { name: /Download PDF/i })).toBeInTheDocument();
  });

  it('renders the Download DOCX button', () => {
    renderSection();
    expect(screen.getByRole('button', { name: /Download DOCX/i })).toBeInTheDocument();
  });

  it('renders the New Translation button', () => {
    renderSection();
    expect(screen.getByRole('button', { name: /New Translation/i })).toBeInTheDocument();
  });

  it('renders the ResultView component', () => {
    renderSection();
    expect(screen.getByTestId('result-view')).toBeInTheDocument();
  });

  // ── Copied state ───────────────────────────────────────────────────────────

  it('shows "Copy Text" when copied is false', () => {
    renderSection({ copied: false });
    expect(screen.getByRole('button', { name: /Copy Text/i })).toBeInTheDocument();
  });

  it('shows "Copied!" when copied is true', () => {
    renderSection({ copied: true });
    expect(screen.getByRole('button', { name: /Copied!/i })).toBeInTheDocument();
  });

  // ── Callbacks ──────────────────────────────────────────────────────────────

  it('calls onBack when Back to Input is clicked', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    renderSection({ onBack });
    await user.click(screen.getByRole('button', { name: /Back to Input/i }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('calls onCopy when Copy Text is clicked', async () => {
    const user = userEvent.setup();
    const onCopy = vi.fn();
    renderSection({ onCopy });
    await user.click(screen.getByRole('button', { name: /Copy Text/i }));
    expect(onCopy).toHaveBeenCalledOnce();
  });

  it('calls onExportPdf when Download PDF is clicked', async () => {
    const user = userEvent.setup();
    const onExportPdf = vi.fn();
    renderSection({ onExportPdf });
    await user.click(screen.getByRole('button', { name: /Download PDF/i }));
    expect(onExportPdf).toHaveBeenCalledOnce();
  });

  it('calls onExportDocx when Download DOCX is clicked', async () => {
    const user = userEvent.setup();
    const onExportDocx = vi.fn();
    renderSection({ onExportDocx });
    await user.click(screen.getByRole('button', { name: /Download DOCX/i }));
    expect(onExportDocx).toHaveBeenCalledOnce();
  });

  it('calls onClear when New Translation is clicked', async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    renderSection({ onClear });
    await user.click(screen.getByRole('button', { name: /New Translation/i }));
    expect(onClear).toHaveBeenCalledOnce();
  });

  // ── Props passthrough ──────────────────────────────────────────────────────

  it('passes items to ResultView', () => {
    renderSection({ items: [mockItem({ text: 'Passed text' })] });
    expect(screen.getByText('Passed text')).toBeInTheDocument();
  });
});