import { useState } from 'react';
import '../css/TranslatorPage.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faUpload, faEraser, faLanguage, faFileLines } from '@fortawesome/free-solid-svg-icons';
import { handleTranslate } from '../api';
import { jsPDF } from 'jspdf';
import { saveAs } from 'file-saver';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel
} from 'docx';
import { faFilePdf, faFileWord } from '@fortawesome/free-solid-svg-icons';

type Tab = 'text' | 'file';
type OutputItem = {
  fileName: string;
  text?: string;
  error?: string;
};

const TABS: { id: Tab; icon: any; label: string }[] = [
  { id: 'text', icon: faPenToSquare, label: 'Text' },
  { id: 'file', icon: faUpload, label: 'File' },
];

export default function TranslatorPage() {
  const [activeTab, setActiveTab] = useState<Tab>('text');
  const [inputText, setInputText] = useState('');
const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outputItems, setOutputItems] = useState<OutputItem[]>([]);

  const handleClear = () => {
    setInputText('');
    setSelectedFiles([]);
    setOutputItems([]);
    setError(null);
  };

  const buildExportText = () => {
  return outputItems
    .map((item) => {
      const body = item.error ? `Error: ${item.error}` : item.text || '';
      return `${item.fileName}\n\n${body}`;
    })
    .join('\n\n----------------------------------------\n\n');
};

const exportToPDF = () => {
  if (outputItems.length === 0) return;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const maxLineWidth = pageWidth - margin * 2;
  let y = 20;

  outputItems.forEach((item, itemIndex) => {
    const title = item.fileName;
    const content = item.error ? `Error: ${item.error}` : item.text || '';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    const titleLines = doc.splitTextToSize(title, maxLineWidth);

    titleLines.forEach((line: string) => {
      if (y > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, margin, y);
      y += 8;
    });

    y += 2;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const contentLines = doc.splitTextToSize(content, maxLineWidth);

    contentLines.forEach((line: string) => {
      if (y > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, margin, y);
      y += 6;
    });

    if (itemIndex !== outputItems.length - 1) {
      y += 8;
      if (y > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;
    }
  });

  doc.save('fraktur-output.pdf');
};

const exportToDocx = async () => {
  if (outputItems.length === 0) return;

  const children = outputItems.flatMap((item, index) => {
    const content = item.error ? `Error: ${item.error}` : item.text || '';
    const paragraphs = content
      .split('\n')
      .map((line) => new Paragraph({ children: [new TextRun(line || ' ')] }));

    const block = [
      new Paragraph({
        text: item.fileName,
        heading: HeadingLevel.HEADING_1,
      }),
      ...paragraphs,
    ];

    if (index !== outputItems.length - 1) {
      block.push(new Paragraph({ text: ' ' }));
    }

    return block;
  });

  const doc = new Document({
    sections: [
      {
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, 'fraktur-output.docx');
};

  const hasInput = activeTab === 'text' ? inputText.trim().length > 0 : selectedFiles.length > 0;

  return (
    <div className="translator-page">
      <div className="translator-container">

        {/* Header */}
        <div className="translator-header">
          <h1 className="translator-title">Fraktur Translator</h1>
          <p className="translator-subtitle">
            Convert historical Fraktur font documents into readable modern German text
          </p>
        </div>

        {/* Side by side panel */}
        <div className="translator-panels">

          {/* Left — Input Panel */}
          <div className="panel input-panel">
            <div className="panel-title">Input</div>

            {/* Tab Bar */}
            <div className="tab-bar">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  className={`tab-btn${activeTab === tab.id ? ' active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <FontAwesomeIcon icon={tab.icon} className="tab-icon" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Text Tab */}
            {activeTab === 'text' && (
              <>
                <div className="input-label">Enter Fraktur Text</div>
                <textarea
                  className="fraktur-textarea"
                  placeholder="Paste or type your Fraktur text here..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
              </>
            )}

            {/* File Tab */}
            {activeTab === 'file' && (
              <div className="file-drop-zone">
              <div className="file-drop-icon">
                <FontAwesomeIcon icon={faUpload} />
              </div>
              {selectedFiles.length > 0 ? (
              <div className="file-drop-title">
                {selectedFiles.map(f => f.name).join(', ')}
              </div>
              ) : (
                <>
                <div className="file-drop-title">Click to upload or drag and drop</div>
                <div className="file-drop-desc">JPG, PNG, TIF, Folder(ZIP)</div>
                </>
              )}
              <input
              type="file"
              id="file-input"
              style={{ display: 'none' }}
              multiple
              onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
              accept=".jpg,.jpeg,.png,.tif,.tiff,.zip"
              />
              <label htmlFor="file-input" style={{ display: 'none' }} />
              <button 
              className="file-browse-btn" 
              onClick={() => document.getElementById('file-input')?.click()}
              >
              Select File
              </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="input-actions">
              <button 
              className="btn-translate" 
              disabled={!hasInput || loading}
              onClick={async () => {
                setLoading(true);
                setError(null);
                setOutputItems([]);

                try {
                  const result = await handleTranslate({
                    type: activeTab,
                    data: activeTab === 'text' ? inputText : selectedFiles
                  });

                  console.log('Translation API response:', result);

                  const formattedResults: OutputItem[] = Object.entries(result).map(
                    ([fileName, value]: [string, any]) => ({
                      fileName,
                      text: value?.text,
                      error: value?.error
                    })
                  );

                  if (formattedResults.length === 0) {
                    setError('No output received from server.');
                  } else {
                    setOutputItems(formattedResults);
                  }
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Unknown error occurred');
                } finally {
                setLoading(false);
                }
              }}
              >
              <FontAwesomeIcon icon={faLanguage} />
              {loading ? 'Processing...' : (activeTab === 'file' ? 'Process & Translate' : 'Translate')}
              </button>
              <button
                className="btn-clear"
                onClick={handleClear}
                disabled={!hasInput && outputItems.length === 0 && !error}
              >
                <FontAwesomeIcon icon={faEraser} />
                Clear
              </button>
            </div>
          </div>

          {/* Right — Output Panel */}
          <div className="panel output-panel">
            <div className="panel-title">Translation Output</div>
            {outputItems.length > 0 && !loading && (
              <div className="output-actions">
                <button className="btn-export pdf" onClick={exportToPDF}>
                  <FontAwesomeIcon icon={faFilePdf} />
                  Download PDF
                </button>
                <button className="btn-export docx" onClick={exportToDocx}>
                  <FontAwesomeIcon icon={faFileWord} />
                  Download DOCX
                </button>
              </div>
            )}
            {loading ? (
              <div className="output-empty">
                <div className="output-empty-icon">
                  <FontAwesomeIcon icon={faFileLines} />
                </div>
                <div className="output-empty-text">Processing...</div>
              </div>
            ) : error ? (
              <div className="output-error">
                {error}
              </div>
            ) : outputItems.length > 0 ? (
              <div className="output-results">
                {outputItems.map((item, index) => (
                  <div key={index} className="output-result-card">
                    <div className="output-file-name">{item.fileName}</div>
                    {item.error ? (
                      <div className="output-error-text">Error: {item.error}</div>
                    ) : (
                      <pre className="output-text">{item.text}</pre>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="output-empty">
                <div className="output-empty-icon">
                  <FontAwesomeIcon icon={faFileLines} />
                </div>
                <div className="output-empty-text">Your translated text will appear here</div>
              </div>
            )}
          </div>

        </div>

        {/* Supported Formats Bar */}
        <div className="formats-bar">
          <span className="formats-bar-label">Supported Formats</span>
          <div className="formats-chips">
            {['JPG', 'PNG', 'TIF', 'ZIP', 'Direct Text'].map((f) => (
              <span className="format-chip" key={f}>{f}</span>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}