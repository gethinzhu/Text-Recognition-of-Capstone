export type NavLinkItem = {
  label: string;
  path: string;
  cta?: boolean;
  end?: boolean;
};

export const NAV_LINKS: NavLinkItem[] = [
  { label: 'Home',          path: '/',             end: true },
  { label: 'Recogniser',    path: '/translator',   cta: true },
  { label: 'How It Works',  path: '/how-it-works' },
  { label: 'About',         path: '/about' },
  { label: 'Contact',       path: '/contact' },
];
