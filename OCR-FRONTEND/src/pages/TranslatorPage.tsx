import { useState } from 'react';
import '../css/TranslatorPage.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faUpload } from '@fortawesome/free-solid-svg-icons';

 
type Tab = 'text' | 'file';

const TABS: { id: Tab; icon: any; label: string }[] = [
  { id: 'text', icon: faPenToSquare, label: 'Text' },
  { id: 'file', icon: faUpload, label: 'File' },
];

export default function TranslatorPage() {
  const [activeTab, setActiveTab] = useState<Tab>('text');

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

        {/* Input Card */}
        <div className="input-card">
          <div className="input-card-title">Input</div>

          {/* Tab Bar */}
          <div className="tab-bar">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                className={`tab-btn${activeTab === tab.id ? ' active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <FontAwesomeIcon icon={tab.icon} className="tab-icon"/>
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
              />
            </>
          )}

          {/* File Tab */}
          {activeTab === 'file' && (
            <div className="file-drop-zone">
              <div className="file-drop-icon">
                <FontAwesomeIcon icon={faUpload} />
              </div>
              <div className="file-drop-title">Drop your file here</div>
              <div className="file-drop-desc">JPG, PNG, TIF, Folder(ZIP)</div>
              <button className="file-browse-btn">Browse Files</button>
            </div>
          )}

          </div>  

        {/* Output Card */}
        <div className="output-card">
          <div className="output-card-title">Translation Output</div>
          <div className="output-empty">
            <div className="output-empty-icon">
              <FontAwesomeIcon icon={faPenToSquare} />
            </div>
            <div className="output-empty-text">Your translated text will appear here</div>
          </div>
        </div>
        
      </div>
    </div>
  );
}