import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';

function Greeting({ name }: { name: string }) {
  return <p>Hello, {name}!</p>;
}

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <span data-testid="count">{count}</span>
      <button onClick={() => setCount((c) => c + 1)}>Increment</button>
    </div>
  );
}

describe('Test environment setup', () => {
  it('renders a React component into the jsdom environment', () => {
    render(<Greeting name="World" />);
    expect(screen.getByText('Hello, World!')).toBeInTheDocument();
  });

  it('applies jest-dom matchers correctly', () => {
    render(<Greeting name="Deciffer" />);
    const el = screen.getByText('Hello, Deciffer!');
    expect(el).toBeVisible();
    expect(el).toBeInTheDocument();
  });

  it('handles user events via @testing-library/user-event', async () => {
    const user = userEvent.setup();
    render(<Counter />);
    expect(screen.getByTestId('count')).toHaveTextContent('0');
    await user.click(screen.getByRole('button', { name: /increment/i }));
    expect(screen.getByTestId('count')).toHaveTextContent('1');
  });
});
