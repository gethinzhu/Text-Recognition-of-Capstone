import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ResultView, { type ResultItem } from '../components/ResultView';

const mockItem = (overrides?: Partial<ResultItem>): ResultItem => ({
  fileName: 'test.jpg',
  text: 'Recognised OCR text',
  ...overrides,
});

const mockPreviews: Record<string, string> = {
  'test.jpg': 'data:image/jpeg;base64,abc123',
};

describe('ResultView', () => {
  it('renders nothing when items array is empty', () => {
    const { container } = render(
      <ResultView items={[]} previews={{}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders the recognised text for a single item', () => {
    render(
      <ResultView items={[mockItem()]} previews={mockPreviews} />
    );
    expect(screen.getByText('Recognised OCR text')).toBeInTheDocument();
  });

  it('renders image preview when a preview URL is available', () => {
    render(
      <ResultView items={[mockItem()]} previews={mockPreviews} />
    );
    const img = screen.getByAltText('test.jpg');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', mockPreviews['test.jpg']);
  });

  it('renders "Preview not available" when no preview exists', () => {
    render(
      <ResultView items={[mockItem()]} previews={{}} />
    );
    expect(screen.getByText('Preview not available')).toBeInTheDocument();
  });

  it('renders source text when sourceText is provided instead of image', () => {
    render(
      <ResultView
        items={[mockItem({ sourceText: 'Original Fraktur text' })]}
        previews={{}}
      />
    );
    expect(screen.getByText('Original Fraktur text')).toBeInTheDocument();
    expect(screen.getByText('Input Text')).toBeInTheDocument();
  });

  it('renders a generic error message for non-credits errors', () => {
    render(
      <ResultView
        items={[mockItem({ error: 'Something went wrong', text: undefined })]}
        previews={{}}
      />
    );
    expect(screen.getByText(/Error: Something went wrong/i)).toBeInTheDocument();
  });

  it('renders CreditsErrorCard for insufficient credits error', () => {
    render(
      <ResultView
        items={[mockItem({ error: 'insufficient credits', text: undefined })]}
        previews={{}}
      />
    );
    expect(screen.getByText('Insufficient Balance')).toBeInTheDocument();
  });

  it('does not render tabs when there is only one item', () => {
    render(
      <ResultView items={[mockItem()]} previews={mockPreviews} />
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders tabs when there are multiple items', () => {
    const items = [
      mockItem({ fileName: 'file1.jpg' }),
      mockItem({ fileName: 'file2.jpg', text: 'Second file text' }),
    ];
    const previews = {
      'file1.jpg': 'data:image/jpeg;base64,aaa',
      'file2.jpg': 'data:image/jpeg;base64,bbb',
    };
    render(<ResultView items={items} previews={previews} />);
    const tabs = screen.getAllByRole('button');
    expect(tabs).toHaveLength(2);
    expect(tabs[0]).toHaveAttribute('title', 'file1.jpg');
    expect(tabs[1]).toHaveAttribute('title', 'file2.jpg');
  });

  it('switches active tab on click', async () => {
    const user = userEvent.setup();
    const items = [
      mockItem({ fileName: 'file1.jpg', text: 'First text' }),
      mockItem({ fileName: 'file2.jpg', text: 'Second text' }),
    ];
    const previews = {
      'file1.jpg': 'data:image/jpeg;base64,aaa',
      'file2.jpg': 'data:image/jpeg;base64,bbb',
    };
    render(<ResultView items={items} previews={previews} />);

    // Initially shows first item
    expect(screen.getByText('First text')).toBeInTheDocument();

    // Click second tab
    await user.click(screen.getByText('file2.jpg'));
    expect(screen.getByText('Second text')).toBeInTheDocument();
  });

  it('renders an error dot on tab for items with errors', () => {
    const items = [
      mockItem({ fileName: 'file1.jpg' }),
      mockItem({ fileName: 'file2.jpg', error: 'some error', text: undefined }),
    ];
    render(<ResultView items={items} previews={mockPreviews} />);
    const errorDot = screen.getByLabelText('error');
    expect(errorDot).toBeInTheDocument();
  });
});

// ── Calamari warning ──────────────────────────────────────────────────────────

describe('ResultView — Calamari quality warning', () => {
  it('shows a quality warning when the result engine is calamari', () => {
    render(<ResultView items={[mockItem({ engine: 'calamari' })]} previews={{}} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Calamari recognition quality may be poor/i)).toBeInTheDocument();
  });

  it('does not show a quality warning for gemini engine', () => {
    render(<ResultView items={[mockItem({ engine: 'gemini' })]} previews={{}} />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('does not show a quality warning when engine is unspecified', () => {
    render(<ResultView items={[mockItem()]} previews={{}} />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

// ── Zoom and pan ──────────────────────────────────────────────────────────────

describe('ResultView — zoom and pan', () => {
  const previewMap: Record<string, string> = {
    'test.jpg': 'data:image/jpeg;base64,abc123',
  };

  beforeEach(() => {
    // setPointerCapture / releasePointerCapture may not exist in this jsdom version
    Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', {
      configurable: true,
      writable: true,
      value: vi.fn(),
    });
    Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', {
      configurable: true,
      writable: true,
      value: vi.fn(),
    });
    Object.defineProperty(HTMLElement.prototype, 'hasPointerCapture', {
      configurable: true,
      writable: true,
      value: vi.fn().mockReturnValue(false),
    });
  });

  const getViewport = (container: HTMLElement) =>
    container.querySelector('.result-source-viewport') as HTMLElement;

  const getImg = (container: HTMLElement) =>
    container.querySelector('img') as HTMLElement;

  it('renders the zoom viewport when a preview URL is provided', () => {
    const { container } = render(<ResultView items={[mockItem()]} previews={previewMap} />);
    expect(getViewport(container)).toBeInTheDocument();
  });

  it('zooms in on wheel scroll up (deltaY < 0)', () => {
    const { container } = render(<ResultView items={[mockItem()]} previews={previewMap} />);
    fireEvent.wheel(getViewport(container), { deltaY: -100 });
    expect(getImg(container).style.transform).toContain('scale(1.15)');
  });

  it('clamps zoom at maxZoom (4) after repeated zoom-in scrolls', () => {
    const { container } = render(<ResultView items={[mockItem()]} previews={previewMap} />);
    for (let i = 0; i < 25; i++) {
      fireEvent.wheel(getViewport(container), { deltaY: -100 });
    }
    expect(getImg(container).style.transform).toContain('scale(4)');
  });

  it('zooms out on wheel scroll down and resets pan at min zoom', () => {
    const { container } = render(<ResultView items={[mockItem()]} previews={previewMap} />);
    const viewport = getViewport(container);
    fireEvent.wheel(viewport, { deltaY: -100 });
    fireEvent.wheel(viewport, { deltaY: 100 });
    expect(getImg(container).style.transform).toBe('translate(0px, 0px) scale(1)');
  });

  it('does not start panning when zoom is at minimum', () => {
    const { container } = render(<ResultView items={[mockItem()]} previews={previewMap} />);
    const viewport = getViewport(container);
    fireEvent.pointerDown(viewport, { clientX: 100, clientY: 100, pointerId: 1 });
    expect(viewport).not.toHaveClass('panning');
  });

  it('adds panning class on pointer down when zoomed in', () => {
    const { container } = render(<ResultView items={[mockItem()]} previews={previewMap} />);
    const viewport = getViewport(container);
    fireEvent.wheel(viewport, { deltaY: -100 });
    fireEvent.pointerDown(viewport, { clientX: 0, clientY: 0, pointerId: 1 });
    expect(viewport).toHaveClass('panning');
  });

  it('updates pan position on pointer move while panning', () => {
    const { container } = render(<ResultView items={[mockItem()]} previews={previewMap} />);
    const viewport = getViewport(container);
    fireEvent.wheel(viewport, { deltaY: -100, clientX: 0, clientY: 0 });
    fireEvent.pointerDown(viewport, { clientX: 0, clientY: 0, pointerId: 1 });
    fireEvent.pointerMove(viewport, { clientX: 20, clientY: 30, pointerId: 1 });
    expect(getImg(container).style.transform).toContain('translate(20px, 30px)');
  });

  it('pointer move does nothing when not panning', () => {
    const { container } = render(<ResultView items={[mockItem()]} previews={previewMap} />);
    const viewport = getViewport(container);
    fireEvent.wheel(viewport, { deltaY: -100 });
    fireEvent.pointerMove(viewport, { clientX: 20, clientY: 30, pointerId: 1 });
    expect(getImg(container).style.transform).toContain('translate(0px, 0px)');
  });

  it('ends panning on pointer up', () => {
    const { container } = render(<ResultView items={[mockItem()]} previews={previewMap} />);
    const viewport = getViewport(container);
    fireEvent.wheel(viewport, { deltaY: -100 });
    fireEvent.pointerDown(viewport, { clientX: 0, clientY: 0, pointerId: 1 });
    expect(viewport).toHaveClass('panning');
    fireEvent.pointerUp(viewport, { pointerId: 1 });
    expect(viewport).not.toHaveClass('panning');
  });

  it('ends panning on pointer leave', () => {
    const { container } = render(<ResultView items={[mockItem()]} previews={previewMap} />);
    const viewport = getViewport(container);
    fireEvent.wheel(viewport, { deltaY: -100 });
    fireEvent.pointerDown(viewport, { clientX: 0, clientY: 0, pointerId: 1 });
    fireEvent.pointerLeave(viewport, { pointerId: 1 });
    expect(viewport).not.toHaveClass('panning');
  });

  it('ends panning on pointer cancel', () => {
    const { container } = render(<ResultView items={[mockItem()]} previews={previewMap} />);
    const viewport = getViewport(container);
    fireEvent.wheel(viewport, { deltaY: -100 });
    fireEvent.pointerDown(viewport, { clientX: 0, clientY: 0, pointerId: 1 });
    fireEvent.pointerCancel(viewport, { pointerId: 1 });
    expect(viewport).not.toHaveClass('panning');
  });

  it('releases pointer capture in endPan when hasPointerCapture returns true', () => {
    Object.defineProperty(HTMLElement.prototype, 'hasPointerCapture', {
      configurable: true,
      writable: true,
      value: vi.fn().mockReturnValue(true),
    });
    const { container } = render(<ResultView items={[mockItem()]} previews={previewMap} />);
    const viewport = getViewport(container);
    fireEvent.wheel(viewport, { deltaY: -100 });
    fireEvent.pointerDown(viewport, { clientX: 0, clientY: 0, pointerId: 1 });
    fireEvent.pointerUp(viewport, { pointerId: 1 });
    expect(HTMLElement.prototype.releasePointerCapture).toHaveBeenCalled();
  });

  it('resets zoom and pan when switching to a different item', async () => {
    const user = userEvent.setup();
    const items = [
      mockItem({ fileName: 'file1.jpg', text: 'Text 1' }),
      mockItem({ fileName: 'file2.jpg', text: 'Text 2' }),
    ];
    const previews = {
      'file1.jpg': 'data:image/jpeg;base64,aaa',
      'file2.jpg': 'data:image/jpeg;base64,bbb',
    };
    const { container } = render(<ResultView items={items} previews={previews} />);
    const viewport = getViewport(container);
    fireEvent.wheel(viewport, { deltaY: -100 });
    expect(getImg(container).style.transform).toContain('scale(1.15)');
    await user.click(screen.getByTitle('file2.jpg'));
    expect(getImg(container).style.transform).toBe('translate(0px, 0px) scale(1)');
  });
});