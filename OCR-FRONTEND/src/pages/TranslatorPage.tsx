import { useEffect, useRef, useState } from 'react';
import '../css/TranslatorPage.css';
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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPenToSquare,
  faUpload,
  faCamera,
  faStop,
  faRotateLeft,
  faEraser,
  faLanguage,
  faFileLines,
  faFilePdf,
  faFileWord,
  faCopy,
  faKey,
  faEye,
  faEyeSlash
} from '@fortawesome/free-solid-svg-icons';

type Tab = 'text' | 'file' | 'camera';
type OutputItem = {
  fileName: string;
  text?: string;
  error?: string;
};

const TABS: { id: Tab; icon: any; label: string }[] = [
  { id: 'text', icon: faPenToSquare, label: 'Text' },
  { id: 'file', icon: faUpload, label: 'File' },
  { id: 'camera', icon: faCamera, label: 'Camera' },
];

export default function TranslatorPage() {
  const [activeTab, setActiveTab] = useState<Tab>('text');
  const [inputText, setInputText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [cameraFile, setCameraFile] = useState<File | null>(null);
  const [cameraPreviewUrl, setCameraPreviewUrl] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('openrouter_api_key') ?? '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outputItems, setOutputItems] = useState<OutputItem[]>([]);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const supportsLiveCamera =
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia);
  const prefersNativeCameraCapture =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: coarse)').matches;

  useEffect(() => {
    if (!cameraFile) {
      setCameraPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(cameraFile);
    setCameraPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [cameraFile]);

  useEffect(() => {
    if (activeTab === 'camera' || !streamRef.current) {
      return;
    }

    streamRef.current.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
  }, [activeTab]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!cameraActive || !videoRef.current || !streamRef.current) {
      return;
    }

    const videoElement = videoRef.current;
    videoElement.srcObject = streamRef.current;

    const playPreview = async () => {
      try {
        await videoElement.play();
      } catch (playbackError) {
        const message =
          playbackError instanceof Error
            ? playbackError.message
            : 'Unable to start the camera preview.';

        setCameraError(`Camera preview failed: ${message}`);
      }
    };

    void playPreview();
  }, [cameraActive]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
  };

  const handleClear = () => {
    stopCamera();
    setInputText('');
    setSelectedFiles([]);
    setCameraFile(null);
    setCameraPreviewUrl(null);
    setCameraError(null);
    setOutputItems([]);
    setCopied(false);
    setError(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  const handleFileChange = (files: FileList | null) => {
    setSelectedFiles(Array.from(files || []));
  };

  const handleCameraFileChange = (files: FileList | null) => {
    const photo = Array.from(files || [])[0];

    if (!photo) {
      return;
    }

    stopCamera();
    setCameraError(null);
    setCameraFile(photo);

    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  const startCamera = async () => {
    if (!supportsLiveCamera) {
      setCameraError('Live camera preview is not supported in this browser.');
      return;
    }

    try {
      stopCamera();
      const preferredFacingMode = prefersNativeCameraCapture ? 'environment' : 'user';

      let stream: MediaStream;

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: preferredFacingMode },
          },
          audio: false,
        });
      } catch {
        // Fall back to the default camera if the preferred facing mode is unavailable.
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      setCameraActive(true);
      setCameraError(null);
    } catch (cameraAccessError) {
      const message =
        cameraAccessError instanceof Error
          ? cameraAccessError.message
          : 'Unable to access the camera.';

      setCameraError(`Camera access failed: ${message}`);
      stopCamera();
    }
  };

  const openCameraCapture = async () => {
    setCameraError(null);

    if (prefersNativeCameraCapture && cameraInputRef.current) {
      cameraInputRef.current.click();
      return;
    }

    await startCamera();
  };

  const capturePhoto = () => {
    if (!videoRef.current) {
      setCameraError('Camera preview is not ready yet.');
      return;
    }

    const width = videoRef.current.videoWidth;
    const height = videoRef.current.videoHeight;

    if (!width || !height) {
      setCameraError('Camera preview is not ready yet.');
      return;
    }

    const canvas = canvasRef.current;

    if (!canvas) {
      setCameraError('Photo capture is not available right now.');
      return;
    }

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      setCameraError('Could not prepare the capture canvas.');
      return;
    }

    context.drawImage(videoRef.current, 0, 0, width, height);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError('Failed to capture the current frame.');
          return;
        }

        setCameraFile(
          new File([blob], `camera-capture-${Date.now()}.jpg`, {
            type: 'image/jpeg',
          })
        );
        setCameraError(null);
        stopCamera();
      },
      'image/jpeg',
      0.92
    );
  };

  const retakePhoto = () => {
    setCameraFile(null);
    setCameraError(null);
  };

const copyOutputToClipboard = async () => {
  if (outputItems.length === 0) return;

  const textToCopy = outputItems
    .map((item) => {
      const content = item.error ? `Error: ${item.error}` : item.text || '';
      return `${item.fileName}\n\n${content}`;
    })
    .join('\n\n----------------------------------------\n\n');

  try {
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  } catch (err) {
    setError('Failed to copy output to clipboard.');
  }
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

  const hasInput =
    activeTab === 'text'
      ? inputText.trim().length > 0
      : activeTab === 'file'
        ? selectedFiles.length > 0
        : Boolean(cameraFile);

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

        {/* API Key Input */}
        <div className="api-key-bar">
          <div className="api-key-bar-left">
            <FontAwesomeIcon icon={faKey} className="api-key-icon" />
            <span className="api-key-label">Your OpenRouter API Key</span>
            <span className="api-key-optional">optional</span>
          </div>
          <div className="api-key-input-wrapper">
            <input
              className="api-key-input"
              type={showApiKey ? 'text' : 'password'}
              placeholder="sk-or-v1-..."
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                if (e.target.value.trim()) {
                  localStorage.setItem('openrouter_api_key', e.target.value);
                } else {
                  localStorage.removeItem('openrouter_api_key');
                }
                window.dispatchEvent(new Event('apikey-changed'));
              }}
              autoComplete="off"
              spellCheck={false}
            />
            <button
              className="api-key-toggle"
              type="button"
              onClick={() => setShowApiKey((v) => !v)}
              title={showApiKey ? 'Hide key' : 'Show key'}
            >
              <FontAwesomeIcon icon={showApiKey ? faEyeSlash : faEye} />
            </button>
          </div>
          <p className="api-key-hint">
            Your key is sent per request and never stored on the server. It is saved in your browser only.
            If you are on a shared or public computer, clear the key when done.
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
              ref={fileInputRef}
              type="file"
              id="file-input"
              style={{ display: 'none' }}
              multiple
              onChange={(e) => handleFileChange(e.target.files)}
              accept=".jpg,.jpeg,.png,.tif,.tiff,.zip"
              />
              <label htmlFor="file-input" style={{ display: 'none' }} />
              <button 
              className="file-browse-btn" 
              onClick={() => fileInputRef.current?.click()}
              >
              Select File
              </button>
              </div>
            )}

            {activeTab === 'camera' && (
              <div className="camera-panel">
                <div className="input-label">Capture a scanned page photo</div>

                <div className="camera-actions-row">
                  <button
                    type="button"
                    className="camera-action-btn primary"
                    onClick={openCameraCapture}
                  >
                    <FontAwesomeIcon icon={faCamera} />
                    Open Camera
                  </button>

                  {cameraActive && (
                    <button
                      type="button"
                      className="camera-action-btn subtle"
                      onClick={stopCamera}
                    >
                      <FontAwesomeIcon icon={faStop} />
                      Stop
                    </button>
                  )}

                  {cameraFile && (
                    <button
                      type="button"
                      className="camera-action-btn subtle"
                      onClick={retakePhoto}
                    >
                      <FontAwesomeIcon icon={faRotateLeft} />
                      Retake
                    </button>
                  )}
                </div>

                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{ display: 'none' }}
                  onChange={(e) => handleCameraFileChange(e.target.files)}
                />

                <canvas ref={canvasRef} style={{ display: 'none' }} />

                {cameraError && <div className="camera-error">{cameraError}</div>}

                {cameraActive ? (
                  <div className="camera-preview-card">
                    <video
                      ref={videoRef}
                      className="camera-video"
                      autoPlay
                      muted
                      playsInline
                    />
                    <div className="camera-preview-actions">
                      <button
                        type="button"
                        className="file-browse-btn"
                        onClick={capturePhoto}
                      >
                        <FontAwesomeIcon icon={faCamera} />
                        Capture
                      </button>
                    </div>
                  </div>
                ) : cameraPreviewUrl ? (
                  <div className="camera-preview-card">
                    <img
                      src={cameraPreviewUrl}
                      alt="Captured preview"
                      className="camera-image-preview"
                    />
                    <div className="camera-preview-meta">
                      Ready to upload: {cameraFile?.name}
                    </div>
                  </div>
                ) : (
                  <div className="camera-empty-state">
                    <div className="camera-empty-icon">
                      <FontAwesomeIcon icon={faCamera} />
                    </div>
                    <div className="camera-empty-title">Use your phone or webcam</div>
                    <div className="camera-empty-text">
                      Open Camera to take a fresh photo on mobile or desktop.
                    </div>
                  </div>
                )}
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
                    type: activeTab === 'text' ? 'text' : 'file',
                    data:
                      activeTab === 'text'
                        ? inputText
                        : activeTab === 'file'
                          ? selectedFiles
                          : cameraFile
                            ? [cameraFile]
                            : [],
                    apiKey: apiKey.trim() || undefined,
                  });

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
              {loading ? 'Processing...' : (activeTab === 'text' ? 'Translate' : 'Process & Translate')}
              </button>
              <button
                className="btn-clear"
                onClick={handleClear}
                disabled={!hasInput && outputItems.length === 0 && !error && !cameraError && !cameraActive}
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
                <button className="btn-export copy" onClick={copyOutputToClipboard}>
                  <FontAwesomeIcon icon={faCopy} />
                  {copied ? 'Copied!' : 'Copy Text'}
                </button>
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
            {['JPG', 'PNG', 'TIF', 'ZIP', 'Direct Text', 'Camera Photo'].map((f) => (
              <span className="format-chip" key={f}>{f}</span>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
