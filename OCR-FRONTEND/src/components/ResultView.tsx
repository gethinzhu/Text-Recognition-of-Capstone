import { useEffect, useRef, useState, type PointerEvent, type WheelEvent } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { CreditsErrorCard, isInsufficientCreditsError } from './CreditsErrorCard';
import './ResultView.css';

export type ResultItem = {
  fileName: string;
  text?: string;
  sourceText?: string;
  error?: string;
  engine?: 'gemini' | 'calamari';
};

type Props = {
  items: ResultItem[];
  previews: Record<string, string>;
};

export default function ResultView({ items, previews }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const isPanningRef = useRef(false);
  const lastPointerRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setActiveIndex(0);
  }, [items]);

  if (items.length === 0) return null;

  const safeIndex = Math.min(activeIndex, items.length - 1);
  const active = items[safeIndex];
  const activePreview = previews[active.fileName];
  const hasSourceText = typeof active.sourceText === 'string' && active.sourceText.length > 0;
  const isCalamariResult = active.engine === 'calamari';
  const minZoom = 1;
  const maxZoom = 4;

  useEffect(() => {
    setZoom(minZoom);
    setPan({ x: 0, y: 0 });
    setIsPanning(false);
    isPanningRef.current = false;
  }, [active.fileName]);

  const clampZoom = (value: number) => Math.min(maxZoom, Math.max(minZoom, value));
  const changeZoom = (next: number) => {
    const clamped = clampZoom(next);
    setZoom(clamped);
    if (clamped === minZoom) {
      setPan({ x: 0, y: 0 });
    }
  };

  const zoomAtCursor = (nextZoom: number, clientX: number, clientY: number) => {
    const clamped = clampZoom(nextZoom);
    if (!viewportRef.current) {
      changeZoom(clamped);
      return;
    }

    const rect = viewportRef.current.getBoundingClientRect();
    const cursor = {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };

    setPan((prevPan) => {
      if (clamped === minZoom) {
        return { x: 0, y: 0 };
      }
      const ratio = clamped / zoom;
      return {
        x: cursor.x - (cursor.x - prevPan.x) * ratio,
        y: cursor.y - (cursor.y - prevPan.y) * ratio,
      };
    });
    setZoom(clamped);
  };

  const handleWheelZoom = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const delta = event.deltaY < 0 ? 0.15 : -0.15;
    zoomAtCursor(zoom + delta, event.clientX, event.clientY);
  };

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const stopBrowserZoomOrScroll = (event: Event) => {
      event.preventDefault();
    };

    // Non-passive listeners ensure browser/page zoom cannot steal gestures.
    viewport.addEventListener('wheel', stopBrowserZoomOrScroll, { passive: false });
    viewport.addEventListener('gesturestart', stopBrowserZoomOrScroll as EventListener, { passive: false });
    viewport.addEventListener('gesturechange', stopBrowserZoomOrScroll as EventListener, { passive: false });
    viewport.addEventListener('gestureend', stopBrowserZoomOrScroll as EventListener, { passive: false });

    return () => {
      viewport.removeEventListener('wheel', stopBrowserZoomOrScroll);
      viewport.removeEventListener('gesturestart', stopBrowserZoomOrScroll as EventListener);
      viewport.removeEventListener('gesturechange', stopBrowserZoomOrScroll as EventListener);
      viewport.removeEventListener('gestureend', stopBrowserZoomOrScroll as EventListener);
    };
  }, [active.fileName]);

  const startPan = (event: PointerEvent<HTMLDivElement>) => {
    if (zoom <= minZoom) return;
    event.preventDefault();
    event.stopPropagation();
    setIsPanning(true);
    isPanningRef.current = true;
    lastPointerRef.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const movePan = (event: PointerEvent<HTMLDivElement>) => {
    if (!isPanningRef.current || zoom <= minZoom) return;
    event.preventDefault();
    const dx = event.clientX - lastPointerRef.current.x;
    const dy = event.clientY - lastPointerRef.current.y;
    setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    lastPointerRef.current = { x: event.clientX, y: event.clientY };
  };

  const endPan = (event: PointerEvent<HTMLDivElement>) => {
    setIsPanning(false);
    isPanningRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

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
          <div className="panel-title">{hasSourceText ? 'Input Text' : 'Source File'}</div>
          {!hasSourceText && <div className="result-source-filename">{active.fileName}</div>}
          {hasSourceText ? (
            <pre className="result-source-text">{active.sourceText}</pre>
          ) : activePreview ? (
            <div
              ref={viewportRef}
              className={`result-source-viewport${zoom > minZoom ? ' zoomed' : ''}${isPanning ? ' panning' : ''}`}
              onWheel={handleWheelZoom}
              onPointerDown={startPan}
              onPointerMove={movePan}
              onPointerUp={endPan}
              onPointerCancel={endPan}
              onPointerLeave={endPan}
            >
              <img
                src={activePreview}
                alt={active.fileName}
                draggable={false}
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                }}
              />
            </div>
          ) : (
            <div className="result-source-missing">Preview not available</div>
          )}
        </div>

        <div className="panel result-output-panel">
          <div className="panel-title">Recognised Text</div>
          {isCalamariResult && (
            <div className="calamari-result-warning" role="alert">
              <span className="calamari-result-warning-icon" aria-hidden="true">
                <FontAwesomeIcon icon={faTriangleExclamation} />
              </span>
              <span>
                Calamari recognition quality may be poor for this input. For better OCR results, please use the Gemini API.
              </span>
            </div>
          )}
          <div className="result-output-scroll">
            {renderOutput()}
          </div>
        </div>
      </div>
    </div>
  );
}
