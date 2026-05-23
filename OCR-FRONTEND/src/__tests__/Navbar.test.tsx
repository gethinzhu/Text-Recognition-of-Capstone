import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Navbar from '../components/Navbar';
import * as api from '../api';
import { NAV_LINKS } from '../constants';

// Mock the API module
vi.mock('../api', () => ({
  getCredits: vi.fn(),
}));

const renderNavbar = (initialPath = '/') =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Navbar />
    </MemoryRouter>
  );

const credits = (remaining: number) => ({
  total_credits: remaining,
  total_usage: 0,
  remaining,
});

describe('Navbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Default: credits fetch fails silently
    vi.mocked(api.getCredits).mockRejectedValue(new Error('Network error'));
  });

  it('renders the brand name', () => {
    renderNavbar();
    expect(screen.getByText('Deciffer')).toBeInTheDocument();
  });

  it('renders all nav links', () => {
    renderNavbar();
    NAV_LINKS.forEach((link) => {
      expect(screen.getByText(link.label)).toBeInTheDocument();
    });
  });

  it('applies active class to the current route link', () => {
    const homeLink = NAV_LINKS.find((l) => l.path === '/');
    if (!homeLink) return;

    renderNavbar('/');
    const link = screen.getByText(homeLink.label).closest('a');
    expect(link?.className).toContain('active');
  });

  it('does not apply active class to non-current route links', () => {
    renderNavbar('/');
    const nonHomeLinks = NAV_LINKS.filter((l) => l.path !== '/');
    nonHomeLinks.forEach((link) => {
      const el = screen.getByText(link.label).closest('a');
      expect(el?.className).not.toContain('active');
    });
  });

  it('shows credits when API returns a value', async () => {
    vi.mocked(api.getCredits).mockResolvedValue(credits(3.75));
    renderNavbar();
    await waitFor(() => {
      expect(screen.getByText('$3.75')).toBeInTheDocument();
    });
  });

  it('hides credits display when API call fails', async () => {
    vi.mocked(api.getCredits).mockRejectedValue(new Error('fail'));
    renderNavbar();
    await waitFor(() => {
      expect(screen.queryByText(/\$\d/)).not.toBeInTheDocument();
    });
  });

  it('applies cta class to the designated CTA link', () => {
    renderNavbar();
    const ctaLink = NAV_LINKS.find((l) => l.cta);
    if (!ctaLink) return;
    const el = screen.getByText(ctaLink.label).closest('a');
    expect(el?.className).toContain('cta');
  });

  it('passes the api key from localStorage to getCredits', async () => {
    localStorage.setItem('openrouter_api_key', 'sk-my-key');
    vi.mocked(api.getCredits).mockResolvedValue(credits(2.0));
    renderNavbar();
    await waitFor(() => {
      expect(api.getCredits).toHaveBeenCalledWith('sk-my-key');
    });
  });

  it('re-fetches credits when apikey-changed event fires', async () => {
    vi.mocked(api.getCredits)
      .mockResolvedValueOnce(credits(1.0))
      .mockResolvedValueOnce(credits(3.0));
    renderNavbar();
    await waitFor(() => expect(screen.getByText('$1.00')).toBeInTheDocument());
    window.dispatchEvent(new Event('apikey-changed'));
    await waitFor(() => expect(screen.getByText('$3.00')).toBeInTheDocument());
  });

  it('re-fetches credits when credits-refresh event fires', async () => {
    vi.mocked(api.getCredits)
      .mockResolvedValueOnce(credits(5.0))
      .mockResolvedValueOnce(credits(4.0));
    renderNavbar();
    await waitFor(() => expect(screen.getByText('$5.00')).toBeInTheDocument());
    window.dispatchEvent(new Event('credits-refresh'));
    await waitFor(() => expect(screen.getByText('$4.00')).toBeInTheDocument());
  });
});
