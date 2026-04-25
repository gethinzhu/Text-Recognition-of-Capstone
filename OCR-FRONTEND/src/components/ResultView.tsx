import { useEffect, useState } from 'react';
import { CreditsErrorCard, isInsufficientCreditsError } from './CreditsErrorCard';
import './ResultView.css';

export type ResultItem = {
  fileName: string;
  text?: string;
  error?: string;
};

type Props = {
  items: ResultItem[];
  previews: Record<string, string>;
};

export default function ResultView({ items, previews }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [items]);

  if (items.length === 0) return null;

  const safeIndex = Math.min(activeIndex, items.length - 1);
  const active = items[safeIndex];
  const activePreview = previews[active.fileName];

  const renderOutput = () => {
    if (active.error) {
      return isInsufficientCreditsError(active.error) ? (
        <CreditsErrorCard />
      ) : (
        <div className="output-error-text">Error: {active.error}</div>
      );
    }
    return <pre className="output-text">{active.text}</pre>;
  };

  return (
    <div className="result-view">
      {items.length > 1 && (
        <div className="result-view-tabs">
          {items.map((item, i) => (
            <button
              key={item.fileName + i}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`result-view-tab${i === safeIndex ? ' active' : ''}`}
              title={item.fileName}
            >
              <span className="tab-index">{i + 1}</span>
              <span className="tab-name">{item.fileName}</span>
              {item.error && <span className="tab-error-dot" aria-label="error" />}
            </button>
          ))}
        </div>
      )}

      <div className="result-view-panels">
        <div className="panel result-source-panel">
          <div className="panel-title">Source File</div>
          <div className="result-source-filename">{active.fileName}</div>
          {activePreview ? (
            <a
              className="result-source-link"
              href={activePreview}
              target="_blank"
              rel="noopener noreferrer"
              title="Open full size"
            >
              <img src={activePreview} alt={active.fileName} />
            </a>
          ) : (
            <div className="result-source-missing">Preview not available</div>
          )}
        </div>

        <div className="panel result-output-panel">
          <div className="panel-title">Recognised Text</div>
          <div className="result-output-scroll">
            {renderOutput()}
          </div>
        </div>
      </div>
    </div>
  );
}