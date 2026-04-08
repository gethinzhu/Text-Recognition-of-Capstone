import type { ReactNode } from 'react';

type Props = {
  icon: ReactNode;
  title: string;
  desc: string;
};

export default function FeatureCard({ icon, title, desc }: Props) {
  return (
    <div className="feature-card">
      <div className="feature-icon-wrap">{icon}</div>
      <h3 className="feature-card-title">{title}</h3>
      <p className="feature-card-desc">{desc}</p>
    </div>
  );
}
