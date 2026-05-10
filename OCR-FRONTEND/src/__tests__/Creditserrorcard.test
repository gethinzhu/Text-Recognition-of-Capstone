import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CreditsErrorCard, isInsufficientCreditsError } from '../components/CreditsErrorCard';

describe('CreditsErrorCard', () => {
  it('renders the error title', () => {
    render(<CreditsErrorCard />);
    expect(screen.getByText('Insufficient Balance')).toBeInTheDocument();
  });

  it('renders the error body message', () => {
    render(<CreditsErrorCard />);
    expect(
      screen.getByText(/does not have enough credits/i)
    ).toBeInTheDocument();
  });

  it('renders the top up link pointing to OpenRouter', () => {
    render(<CreditsErrorCard />);
    const link = screen.getByRole('link', { name: /top up on openrouter/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://openrouter.ai/credits');
  });

  it('opens the top up link in a new tab', () => {
    render(<CreditsErrorCard />);
    const link = screen.getByRole('link', { name: /top up on openrouter/i });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});

describe('isInsufficientCreditsError', () => {
  it('returns true for message containing "insufficient"', () => {
    expect(isInsufficientCreditsError('insufficient funds')).toBe(true);
  });

  it('returns true for message containing "credit"', () => {
    expect(isInsufficientCreditsError('no credit remaining')).toBe(true);
  });

  it('returns true for message containing "balance"', () => {
    expect(isInsufficientCreditsError('low balance')).toBe(true);
  });

  it('returns true for message containing "402"', () => {
    expect(isInsufficientCreditsError('error 402')).toBe(true);
  });

  it('returns true for message containing "payment required"', () => {
    expect(isInsufficientCreditsError('Payment Required')).toBe(true);
  });

  it('returns false for unrelated error messages', () => {
    expect(isInsufficientCreditsError('network timeout')).toBe(false);
    expect(isInsufficientCreditsError('file too large')).toBe(false);
    expect(isInsufficientCreditsError('unknown error')).toBe(false);
  });

  it('is case insensitive', () => {
    expect(isInsufficientCreditsError('INSUFFICIENT BALANCE')).toBe(true);
    expect(isInsufficientCreditsError('Credit Error')).toBe(true);
  });
});