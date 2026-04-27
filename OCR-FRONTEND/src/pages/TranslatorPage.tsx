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
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faPenToSquare,
  faUpload,
  faCamera,
  faStop,
  faRotateLeft,
  faEraser,
  faLanguage,
  faFileLines,
  faKey,
  faEye,
  faEyeSlash
} from '@fortawesome/free-solid-svg-icons';
import { type ResultItem } from '../components/ResultView';
import ResultsSection from '../components/ResultsSection';
import {
  CreditsErrorCard,
  isInsufficientCreditsError,
} from '../components/CreditsErrorCard';
import { extractPreviews } from '../utils/extractPreviews';

type Tab = 'text' | 'file' | 'camera';
type CameraOption = {
  deviceId: string;
  label: string;
};

type OcrEngine = 'gemini' | 'calamari';

const TABS: { id: Tab; icon: IconDefinition; label: string }[] = [
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
  const [cameraDevices, setCameraDevices] = useState<CameraOption[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [ocrEngine, setOcrEngine] = useState<OcrEngine>('gemini');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('openrouter_api_key') ?? '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<'idle' | 'uploading' | 'processing'>('idle');
  const [error, setError] = useState<string | null>(null);
  const loading = loadingPhase !== 'idle';
  const [outputItems, setOutputItems] = useState<ResultItem[]>(() => {
    try {
      const saved = sessionStorage.getItem('ocr_output_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [filePreviews, setFilePreviews] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<'input' | 'results'>('input');
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const requestStartedAtRef = useRef<number | null>(null);
  const progressValueRef = useRef(0);
  const elapsedMsRef = useRef(0);
  const apiPanelRef = useRef<HTMLDivElement | null>(null);
  const supportsLiveCamera =
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia);
  const prefersNativeCameraCapture =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: coarse)').matches;
  const supportsDeviceEnumeration =
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices?.enumerateDevices);
  const [showApiPanel, setShowApiPanel] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (outputItems.length > 0) {
      sessionStorage.setItem('ocr_output_items', JSON.stringify(outputItems));
    } else {
      sessionStorage.removeItem('ocr_output_items');
    }
  }, [outputItems]);

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
    progressValueRef.current = progressValue;
  }, [progressValue]);

  useEffect(() => {
    elapsedMsRef.current = elapsedMs;
  }, [elapsedMs]);

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
      if (progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!loading) {
      if (progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      return;
    }

    requestStartedAtRef.current = performance.now();

    const tickProgress = () => {
      if (requestStartedAtRef.current === null) {
        return;
      }

      const nextElapsedMs = performance.now() - requestStartedAtRef.current;
      let nextProgress = 12;

      if (nextElapsedMs < 800) {
        nextProgress = 12 + (nextElapsedMs / 800) * 24;
      } else if (nextElapsedMs < 2500) {
        nextProgress = 36 + ((nextElapsedMs - 800) / 1700) * 28;
      } else if (nextElapsedMs < 6000) {
        nextProgress = 64 + ((nextElapsedMs - 2500) / 3500) * 18;
      } else {
        nextProgress = 82 + Math.min(((nextElapsedMs - 6000) / 12000) * 10, 10);
      }

      setElapsedMs(nextElapsedMs);
      setProgressValue((current) => Math.max(current, Math.min(nextProgress, 92)));
    };

    tickProgress();
    progressIntervalRef.current = window.setInterval(tickProgress, 120);

    return () => {
      if (progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [loading]);

  useEffect(() => {
    if (!showApiPanel) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        apiPanelRef.current &&
        !apiPanelRef.current.contains(event.target as Node)
      ) {
        setShowApiPanel(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showApiPanel]);

  const finishProgressAnimation = async () => {
    if (progressIntervalRef.current) {
      window.clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    setProgressValue(100);

    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, 280);
    });
  };

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

  useEffect(() => {
    if (!supportsDeviceEnumeration || prefersNativeCameraCapture) {
      return;
    }

    const syncDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices
          .filter((device) => device.kind === 'videoinput')
          .map((device, index) => ({
            deviceId: device.deviceId,
            label: device.label || `Camera ${index + 1}`,
          }));

        setCameraDevices(videoInputs);

        if (!selectedCameraId && videoInputs.length > 0) {
          setSelectedCameraId(videoInputs[0].deviceId);
        }
      } catch {
        // Ignore enumeration failures and continue with facingMode fallback.
      }
    };

    void syncDevices();

    const handleDeviceChange = () => {
      void syncDevices();
    };

    navigator.mediaDevices.addEventListener?.('devicechange', handleDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener?.('devicechange', handleDeviceChange);
    };
  }, [prefersNativeCameraCapture, selectedCameraId, supportsDeviceEnumeration]);

  const refreshCameraDevices = async (activeStream?: MediaStream) => {
    if (!supportsDeviceEnumeration || prefersNativeCameraCapture) {
      return;
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices
        .filter((device) => device.kind === 'videoinput')
        .map((device, index) => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${index + 1}`,
        }));

      setCameraDevices(videoInputs);

      const activeDeviceId = activeStream?.getVideoTracks?.()[0]?.getSettings?.().deviceId;
      if (activeDeviceId) {
        setSelectedCameraId(activeDeviceId);
        return;
      }

      if (!selectedCameraId && videoInputs.length > 0) {
        setSelectedCameraId(videoInputs[0].deviceId);
      }
    } catch {
      // Ignore enumeration failures and continue with the active stream.
    }
  };

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
    setFilePreviews({});
    setViewMode('input');
    setCopied(false);
    setError(null);
    setProgressValue(0);
    setElapsedMs(0);
    requestStartedAtRef.current = null;

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

  const startCamera = async (deviceIdOverride?: string) => {
    if (!supportsLiveCamera) {
      setCameraError('Live camera preview is not supported in this browser.');
      return;
    }

    try {
      stopCamera();
      const preferredFacingMode = prefersNativeCameraCapture ? 'environment' : 'user';

      let stream: MediaStream;

      try {
        const preferredDeviceId = deviceIdOverride || selectedCameraId;
        const videoConstraints = preferredDeviceId
          ? { deviceId: { exact: preferredDeviceId } }
          : { facingMode: { ideal: preferredFacingMode } };

        stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
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
      await refreshCameraDevices(stream);
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

  const handleCameraSelectionChange = async (deviceId: string) => {
    setSelectedCameraId(deviceId);
    setCameraError(null);

    if (!cameraActive) {
      return;
    }

    try {
      await startCamera(deviceId);
    } catch {
      // startCamera already reports a user-facing error.
    }
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
  } catch {
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
  const isCalamariMode = ocrEngine === 'calamari';
  const engineDisplayName = isCalamariMode ? 'Calamari' : 'Gemini';
  const nextEngineDisplayName = isCalamariMode ? 'Gemini' : 'Calamari';
  const engineHoverText = isCalamariMode
    ? 'Using Calamari (free, no token usage). OCR quality can be lower than Gemini.'
    : 'Using Gemini (best OCR quality, uses API credits/tokens).';

  return (
    <div className={`translator-page${viewMode === 'results' ? ' results-mode' : ''}`}>
      <div className="translator-container">

        {/* Header */}
        {viewMode !== 'results' && (
        <div className="translator-header">
          <h1 className="translator-title">Fraktur Text Recogniser</h1>
          <p className="translator-subtitle">
            Recognise historical Fraktur documents and convert them into readable modern text
          </p>
          <div className="translator-api-floating" ref={apiPanelRef}>
            <div className="translator-engine-controls">
              <button
                type="button"
                className={`translator-api-trigger${showApiPanel ? ' open' : ''}`}
                onClick={() => {
                  if (isCalamariMode) {
                    setOcrEngine('gemini');
                    setShowApiPanel(true);
                    return;
                  }
                  setShowApiPanel((v) => !v);
                }}
                title="API key settings"
              >
                <FontAwesomeIcon icon={faKey} />
                <span>API Key</span>
              </button>

              <div className="translator-engine-trigger-wrap">
                {isCalamariMode ? (
                  <button
                    type="button"
                    className="translator-engine-trigger mode-pill mode-calamari"
                    onClick={() => {
                      setOcrEngine('gemini');
                      setShowApiPanel(false);
                    }}
                    role="switch"
                    aria-checked="true"
                    aria-label={`OCR engine is ${engineDisplayName}. Click to switch to ${nextEngineDisplayName}.`}
                  >
                    <span className="engine-switch-track" aria-hidden="true">
                      <span className="engine-switch-thumb" />
                    </span>
                    <span>{engineDisplayName}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="translator-engine-trigger mode-pill mode-gemini"
                    onClick={() => {
                      setOcrEngine('calamari');
                      setShowApiPanel(false);
                    }}
                    role="switch"
                    aria-checked="false"
                    aria-label={`OCR engine is ${engineDisplayName}. Click to switch to ${nextEngineDisplayName}.`}
                  >
                    <span className="engine-switch-track" aria-hidden="true">
                      <span className="engine-switch-thumb" />
                    </span>
                    <span>{engineDisplayName}</span>
                  </button>
                )}
                <div className="translator-engine-tooltip">
                  {engineHoverText} Click to switch to {nextEngineDisplayName}.
                </div>
              </div>
            </div>

            {showApiPanel && (
              <div className="translator-api-popover">
                <div className="translator-api-popover-header">
                  <div className="translator-api-popover-title">OpenRouter API Key</div>
                  <span className={`api-key-optional${isCalamariMode ? ' disabled' : ''}`}>
                    {isCalamariMode ? 'inactive in Calamari mode' : 'optional'}
                  </span>
                </div>

                <div className="api-key-input-wrapper">
                  <div
                    className={`api-key-status ${
                      apiKey.trim() ? 'saved' : 'empty'
                    }`}
                  >
                    {isCalamariMode
                      ? (apiKey.trim() ? 'Saved, but not used in Calamari mode' : 'No key needed in Calamari mode')
                      : (apiKey.trim() ? 'Key saved in this browser' : 'No key saved')}
                  </div>
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
                    disabled={isCalamariMode}
                  />
                  <button
                    className="api-key-toggle"
                    type="button"
                    onClick={() => setShowApiKey((v) => !v)}
                    title={showApiKey ? 'Hide key' : 'Show key'}
                    disabled={isCalamariMode}
                  >
                    <FontAwesomeIcon icon={showApiKey ? faEyeSlash : faEye} />
                  </button>
                </div>

                <p className="translator-api-popover-hint">
                  {isCalamariMode
                    ? 'Calamari mode does not use an OpenRouter key. Switch back to Gemini when you want to use your own API key.'
                    : 'Your key is sent per request and stored only in your browser. Clear it when using a shared computer.'}
                </p>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Side by side panel */}
        {viewMode === 'results' && !loading && outputItems.length > 0 ? (
          <ResultsSection
            items={outputItems}
            previews={filePreviews}
            copied={copied}
            onBack={() => setViewMode('input')}
            onCopy={copyOutputToClipboard}
            onExportPdf={exportToPDF}
            onExportDocx={exportToDocx}
            onClear={handleClear}
          />
        ) : (
        <>
        {!loading && outputItems.length > 0 && (
          <div className="view-results-banner">
            <span>
              You have {outputItems.length} recognised {outputItems.length === 1 ? 'file' : 'files'}.
            </span>
            <button
              type="button"
              className="view-results-link"
              onClick={() => setViewMode('results')}
            >
              View results →
            </button>
          </div>
        )}
        {loadingPhase === 'uploading' && (
          <div className="processing-banner">
            <div className="processing-spinner" />
            <span>Uploading your file... Please wait.</span>
          </div>
        )}

        {loadingPhase === 'processing' && (
          <div className="processing-banner">
            <div className="processing-spinner" />
            <span>
              Recognising your file with {engineDisplayName}... This may take a few moments.
            </span>
          </div>
        )}

        {error && !loading && (
          <div className="processing-banner error">
            {isInsufficientCreditsError(error) ? (
              <CreditsErrorCard />
            ) : (
              <span>{error}</span>
            )}
          </div>
        )}
        <div className="translator-panels translator-panels-single">

          {/* Left Input Panel */}
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
                  {isCalamariMode && (
                    <span className="text-input-note" role="note">
                      <span className="text-input-note-icon" aria-hidden="true">!</span>
                      Calamari only works with image data and cannot recognise typed text. Text input is processed with the Gemini API only.
                    </span>
                  )}
                <textarea
                id="fraktur-textarea"
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
              aria-label="Upload OCR source files"
              title="Upload OCR source files"
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

                {!prefersNativeCameraCapture && cameraDevices.length > 1 && (
                  <div className="camera-device-row">
                    <label className="camera-device-label" htmlFor="camera-device-select">
                      Camera source
                    </label>
                    <select
                      id="camera-device-select"
                      className="camera-device-select"
                      value={selectedCameraId}
                      onChange={(e) => {
                        void handleCameraSelectionChange(e.target.value);
                      }}
                    >
                      {cameraDevices.map((device) => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  aria-label="Capture or upload a camera image"
                  title="Capture or upload a camera image"
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
                setLoadingPhase('uploading');
                setError(null);
                setOutputItems([]);
                setFilePreviews({});
                setProgressValue(0);
                setElapsedMs(0);

                try {
                  const uploadPayload: string | File[] =
                    activeTab === 'text'
                      ? inputText
                      : activeTab === 'file'
                        ? selectedFiles
                        : cameraFile
                          ? [cameraFile]
                          : [];

                  const result = await handleTranslate({
                    type: activeTab === 'text' ? 'text' : 'file',
                    data: uploadPayload,
                    apiKey: apiKey.trim() || undefined,
                    engine: ocrEngine,
                    onUploadDone: () => {
                      setLoadingPhase('processing');
                      if (activeTab !== 'text') {
                        window.dispatchEvent(new Event('credits-refresh'));
                      }
                    },
                  });

                  const formattedResults: ResultItem[] = Object.entries(result).map(
                    ([fileName, value]) => ({
                      fileName,
                      text: value?.text,
                      error: value?.error,
                    })
                  );

                  await finishProgressAnimation();

                  if (formattedResults.length === 0) {
                    setError('No output received from server.');
                  } else {
                    setOutputItems(formattedResults);
                    setFilePreviews(extractPreviews(result));
                    setViewMode('results');
                  }
                } catch (err) {
                  await finishProgressAnimation();
                  setError(err instanceof Error ? err.message : 'Unknown error occurred');
                } finally {
                  setLoadingPhase('idle');
                }
              }}
              >
              <FontAwesomeIcon icon={faLanguage} />
              {loading ? `Recognising with ${engineDisplayName}...` : 'Recognise Text'}
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
        </div>
        </>
        )}

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

