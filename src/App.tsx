import { useReducer, useCallback, useMemo, useState } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  Container,
  Box,
  Grid,
  Paper,
  Snackbar,
  Alert,
} from '@mui/material';
import theme from './theme';
import Masthead from './components/Masthead';
import UploadZone from './components/UploadZone';
import FileList from './components/FileList';
import PipelineControl from './components/PipelineControl';
import ResultsPanel from './components/ResultsPanel';
import TextPreviewModal from './components/TextPreviewModal';
import StampAnimation from './components/StampAnimation';
import Footer from './components/Footer';
import BauhausShapes from './components/BauhausShapes';
import OrnamentalRule from './components/OrnamentalRule';
import LoginModal from './components/LoginModal';
import InfoSection from './components/InfoSection';
import type { PipelineState, PipelineAction, FileItem, FileResult, ProcessingResult } from './types';
import { generateId, simulateOcrProcessing, createThumbnail } from './utils';
import { LanguageProvider } from './contexts/LanguageContext';

import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import '@fontsource/jetbrains-mono/400.css';

const initialState: PipelineState = {
  files: [],
  results: [],
  isProcessing: false,
  currentFileIndex: -1,
  pipelineStatus: 'idle',
};

function pipelineReducer(state: PipelineState, action: PipelineAction): PipelineState {
  switch (action.type) {
    case 'ADD_FILES':
      return {
        ...state,
        files: [...state.files, ...action.payload],
      };

    case 'REMOVE_FILE':
      return {
        ...state,
        files: state.files.filter((f) => f.id !== action.payload),
      };

    case 'UPDATE_FILE':
      return {
        ...state,
        files: state.files.map((f) =>
          f.id === action.payload.id ? { ...f, ...action.payload.updates } : f
        ),
      };

    case 'START_PROCESSING':
      return {
        ...state,
        isProcessing: true,
        pipelineStatus: 'processing',
        currentFileIndex: 0,
      };

    case 'PROCESSING_PROGRESS':
      return {
        ...state,
        files: state.files.map((f) =>
          f.id === action.payload.id ? { ...f, progress: action.payload.progress } : f
        ),
      };

    case 'FILE_COMPLETE':
      return {
        ...state,
        files: state.files.map((f) =>
          f.id === action.payload.fileId ? { ...f, status: 'complete', progress: 100 } : f
        ),
        results: [...state.results, action.payload.result],
      };

    case 'FILE_ERROR':
      return {
        ...state,
        files: state.files.map((f) =>
          f.id === action.payload.id
            ? { ...f, status: 'error', errorMessage: action.payload.error }
            : f
        ),
      };

    case 'STOP_PROCESSING':
      return {
        ...state,
        isProcessing: false,
        pipelineStatus: 'idle',
        currentFileIndex: -1,
        files: state.files.map((f) =>
          f.status === 'processing' ? { ...f, status: 'queued', progress: 0 } : f
        ),
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

function AppContent() {
  const [state, dispatch] = useReducer(pipelineReducer, initialState);
  const { files, results, isProcessing, pipelineStatus } = state;

  const [previewResult, setPreviewResult] = useState<ProcessingResult | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [showStamp, setShowStamp] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  const handleFilesAdded = useCallback(async (newFiles: FileItem[]) => {
    const filesWithThumbnails = await Promise.all(
      newFiles.map(async (f) => {
        try {
          const thumbnail = await createThumbnail(f.file);
          return { ...f, thumbnail };
        } catch {
          return f;
        }
      })
    );

    dispatch({ type: 'ADD_FILES', payload: filesWithThumbnails });
  }, []);

  const handleRemoveFile = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_FILE', payload: id });
  }, []);

  const handleRetryFile = useCallback((id: string) => {
    dispatch({
      type: 'UPDATE_FILE',
      payload: { id, updates: { status: 'queued', progress: 0, errorMessage: undefined } },
    });
  }, []);

  const handleStartProcessing = useCallback(async () => {
    const queuedFiles = files.filter((f) => f.status === 'queued' || f.status === 'error');
    if (queuedFiles.length === 0) return;

    dispatch({ type: 'START_PROCESSING' });

    const processNextFile = async (fileIndex: number) => {
      if (fileIndex >= queuedFiles.length) {
        dispatch({ type: 'STOP_PROCESSING' });
        dispatch({ type: 'UPDATE_FILE', payload: { id: 'pipeline', updates: { status: 'complete' } } });
        setShowStamp(true);
        setTimeout(() => setShowStamp(false), 2000);
        return;
      }

      const fileToProcess = queuedFiles[fileIndex];

      dispatch({
        type: 'UPDATE_FILE',
        payload: { id: fileToProcess.id, updates: { status: 'processing', progress: 0 } },
      });

      try {
        const text = await simulateOcrProcessing(fileToProcess.id, (progress) => {
          dispatch({
            type: 'PROCESSING_PROGRESS',
            payload: { id: fileToProcess.id, progress },
          });
        });

        const baseName = fileToProcess.name.replace(/\.[^/.]+$/, '');

        const txtResult: FileResult = {
          id: generateId(),
          fileId: fileToProcess.id,
          fileName: baseName + '.txt',
          format: 'plaintext',
          size: text.length * 2,
          text,
          timestamp: new Date(),
        };

        const pdfResult: FileResult = {
          id: generateId(),
          fileId: fileToProcess.id,
          fileName: baseName + '.pdf',
          format: 'pdf',
          size: Math.floor(text.length * 1.5),
          text,
          timestamp: new Date(),
        };

        dispatch({
          type: 'FILE_COMPLETE',
          payload: { fileId: fileToProcess.id, result: txtResult },
        });

        dispatch({
          type: 'FILE_COMPLETE',
          payload: { fileId: fileToProcess.id, result: pdfResult },
        });

        setSnackbar({
          open: true,
          message: `${fileToProcess.name} verarbeitet`,
          severity: 'success',
        });
      } catch (error) {
        dispatch({
          type: 'FILE_ERROR',
          payload: {
            id: fileToProcess.id,
            error: error instanceof Error ? error.message : 'Unbekannter Fehler',
          },
        });
      }

      await processNextFile(fileIndex + 1);
    };

    await processNextFile(0);
  }, [files]);

  const handleStopProcessing = useCallback(() => {
    dispatch({ type: 'STOP_PROCESSING' });
  }, []);

  const handlePreview = useCallback((result: ProcessingResult) => {
    setPreviewResult(result);
    setPreviewOpen(true);
  }, []);

  const handleClosePreview = useCallback(() => {
    setPreviewOpen(false);
  }, []);

  const currentFileName = useMemo(() => {
    if (isProcessing) {
      const processingFile = files.find((f) => f.status === 'processing');
      return processingFile?.name;
    }
    return undefined;
  }, [isProcessing, files]);

  const completedFiles = useMemo(
    () => files.filter((f) => f.status === 'complete').length,
    [files]
  );

  const hasProcessedFiles = completedFiles > 0;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BauhausShapes backgroundOnly />

      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
        <Masthead
          pipelineStatus={pipelineStatus}
          onLoginClick={() => setLoginModalOpen(true)}
        />

        <Container maxWidth="lg" sx={{ flex: 1, py: 4 }}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={5}>
              <Paper
                sx={{
                  p: 3,
                  height: '100%',
                  backgroundColor: 'bgCard',
                }}
              >
                <UploadZone
                  onFilesAdded={handleFilesAdded}
                  disabled={isProcessing}
                  onError={(message) => setSnackbar({ open: true, message, severity: 'error' })}
                />

                <FileList
                  files={files}
                  onRemoveFile={handleRemoveFile}
                  onRetryFile={handleRetryFile}
                />

                <PipelineControl
                  isProcessing={isProcessing}
                  totalFiles={files.length}
                  completedFiles={completedFiles}
                  currentFileName={currentFileName}
                  onStartProcessing={handleStartProcessing}
                  onStopProcessing={handleStopProcessing}
                  disabled={files.length === 0}
                />
              </Paper>
            </Grid>

            <Grid item xs={12} md={7}>
              <Paper sx={{ p: 3, backgroundColor: 'bgCard' }}>
                <ResultsPanel
                  results={results}
                  onPreview={handlePreview}
                  hasProcessedFiles={hasProcessedFiles}
                />
              </Paper>
            </Grid>
          </Grid>

          <Box sx={{ mt: 6 }}>
            <OrnamentalRule variant="thick" />
            <InfoSection />
          </Box>
        </Container>

        <OrnamentalRule variant="double" />

        <Footer />

        <TextPreviewModal
          open={previewOpen}
          result={previewResult}
          onClose={handleClosePreview}
        />

        <StampAnimation
          show={showStamp}
          onComplete={() => setShowStamp(false)}
        />

        <LoginModal
          open={loginModalOpen}
          onClose={() => setLoginModalOpen(false)}
        />

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;
