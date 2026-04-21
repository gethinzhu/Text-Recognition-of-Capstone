import '../css/Howitworkspage.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faLanguage } from '@fortawesome/free-solid-svg-icons';

export default function HowItWorksPage() {
  return (
    <div className="page">
      <div className="page-content">
        {/* Header */}
        <div className="how-header">
          <h1 className="how-title">How It Works</h1>
          <p className="how-subtitle">Understanding the translation process</p>
        </div>

        {/* Steps */}
        <div className="how-steps">

          {/* Step 1 */}
          <div className="how-step-card">
            <div className="how-step-header">
              <div className="how-step-num">1</div>
              <div className="how-step-icon">
                <FontAwesomeIcon icon={faUpload} />
              </div>
              <h2 className="how-step-title">Choose Your Input Method</h2>
            </div>
            <p className="how-step-desc">
              Select from multiple input options to best suit your needs.
            </p>
            <div className="how-sub-grid">
              <div className="how-sub-item">
                <div className="how-sub-title">File Upload</div>
                <div className="how-sub-desc">Support for JPG, PNG, TIF, and ZIP files.</div>
              </div>
              <div className="how-sub-item">
                <div className="how-sub-title">Direct Text</div>
                <div className="how-sub-desc">Paste or type Fraktur text directly into the input field.</div>
              </div>
              <div className="how-sub-item">
                <div className="how-sub-title"> Camera Capture </div>
                <div className="how-sub-desc">
                  Capture an image directly using your device camera for quick OCR processing.
                </div>
              </div>
            </div> 
            </div>
              {/* Step 2 */}
              <div className="how-step-card">
                <div className="how-step-header">
                  <div className="how-step-num">2</div>
                  <div className="how-step-icon">
                    <FontAwesomeIcon icon={faLanguage} />
                  </div>
                  <h2 className="how-step-title">Process & Recognise Text</h2>
                </div>

                <p className="how-step-desc">
                  Once your input is submitted, the system processes the content using OCR technology to recognise Fraktur text.
                </p>

                <div className="how-sub-grid">
                  <div className="how-sub-item">
                    <div className="how-sub-title">OCR Processing</div>
                    <div className="how-sub-desc">
                      The system scans and extracts text from images or documents.
                    </div>
                  </div>

                  <div className="how-sub-item">
                    <div className="how-sub-title">Text Recognition</div>
                    <div className="how-sub-desc">
                      Fraktur characters are identified and converted into readable modern text.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
  );
}