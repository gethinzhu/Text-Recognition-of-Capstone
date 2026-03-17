export type FileStatus = 'queued' | 'processing' | 'complete' | 'error';

export type ResultFormat = 'plaintext' | 'pdf';

export interface FileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: FileStatus;
  progress: number;
  thumbnail?: string;
  errorMessage?: string;
}

export type UploadedFile = FileItem;

export interface FileResult {
  id: string;
  fileId: string;
  fileName: string;
  format: ResultFormat;
  size: number;
  text?: string;
  downloadUrl?: string;
  timestamp: Date;
}

export type ProcessingResult = FileResult;

export interface PipelineState {
  files: FileItem[];
  results: FileResult[];
  isProcessing: boolean;
  currentFileIndex: number;
  pipelineStatus: PipelineStatus;
}

export type PipelineStatus = 'idle' | 'processing' | 'complete' | 'error';

export type PipelineAction =
  | { type: 'ADD_FILES'; payload: FileItem[] }
  | { type: 'REMOVE_FILE'; payload: string }
  | { type: 'UPDATE_FILE'; payload: { id: string; updates: Partial<FileItem> } }
  | { type: 'START_PROCESSING' }
  | { type: 'PROCESSING_PROGRESS'; payload: { id: string; progress: number } }
  | { type: 'FILE_COMPLETE'; payload: { fileId: string; result: FileResult } }
  | { type: 'FILE_ERROR'; payload: { id: string; error: string } }
  | { type: 'STOP_PROCESSING' }
  | { type: 'RESET' };
