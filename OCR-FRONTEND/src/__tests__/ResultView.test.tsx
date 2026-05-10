import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
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