import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCopy,
  faFilePdf,
  faFileWord,
  faEraser,
  faArrowLeft,
} from '@fortawesome/free-solid-svg-icons';
import ResultView, { type ResultItem } from './ResultView';

type Props = {
  items: ResultItem[];
  previews: Record<string, string>;
  copied: boolean;
  onBack: () => void;
  onCopy: () => void;
  onExportPdf: () => void;
  onExportDocx: () => void;
  onClear: () => void;
};

export default function ResultsSection({
  items,
  previews,
  copied,
  onBack,
  onCopy,
  onExportPdf,
  onExportDocx,
  onClear,
}: Props) {
  return (
    <div className="result-view-container">
      <div className="output-actions result-view-actions">
        <button className="btn-back" type="button" onClick={onBack}>
          <FontAwesomeIcon icon={faArrowLeft} />
          Back to Input
        </button>
        <div className="result-view-actions-spacer" />
        <button className="btn-export copy" onClick={onCopy}>
          <FontAwesomeIcon icon={faCopy} />
          {copied ? 'Copied!' : 'Copy Text'}
        </button>
        <button className="btn-export pdf" onClick={onExportPdf}>
          <FontAwesomeIcon icon={faFilePdf} />
          Download PDF
        </button>
        <button className="btn-export docx" onClick={onExportDocx}>
          <FontAwesomeIcon icon={faFileWord} />
          Download DOCX
        </button>
        <button className="btn-clear result-clear-btn" onClick={onClear}>
          <FontAwesomeIcon icon={faEraser} />
          New Translation
        </button>
      </div>
      <ResultView items={items} previews={previews} />
    </div>
  );
}