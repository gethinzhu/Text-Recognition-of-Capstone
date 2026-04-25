// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/ocr';

export interface CreditsResponse {
  total_credits: number;
  total_usage: number;
  remaining: number;
}

/**
 * Fetch remaining OpenRouter credits from the backend proxy.
 */
export async function getCredits(apiKey?: string): Promise<CreditsResponse> {
  const headers: HeadersInit = {};
  if (apiKey && apiKey.trim()) {
    headers['X-User-Api-Key'] = apiKey.trim();
  }
  const response = await fetch(`${API_BASE_URL}/credits/`, { headers });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export interface TranslateResponse {
  [filename: string]: {
    text?: string;
    error?: string;
    status?: string;
    preview_b64?: string;
  };
}

/**
 * Send file or text to the backend for OCR processing
 * @param params - Object containing type ('text' or 'file') and data (string, image file, or zip file)
 * @returns Promise with recognized text results
 */
export function handleTranslate(params: {
  type: 'text' | 'file';
  data: string | File | File[];
  apiKey?: string;
  engine?: 'gemini' | 'calamari';
  onUploadDone?: () => void;
}): Promise<TranslateResponse> {
  const { type, data, apiKey, engine = 'gemini', onUploadDone } = params;

  const formData = new FormData();
  formData.append('engine', engine);

  // TEXT INPUT
  if (type === 'text' && typeof data === 'string') {
    const file = new File([data], 'text-input.txt', { type: 'text/plain' });
    formData.append('images', file);
  }

  // FILE INPUT (single OR multiple)
  else if (type === 'file') {
    const files = (Array.isArray(data) ? data : [data]) as File[];

    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/tiff', 'image/bmp', 'image/gif',
      'application/zip', 'application/x-zip-compressed'
    ];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.tif', '.tiff', '.zip'];

    files.forEach((file) => {
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      const isValidType =
        allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension);

      if (!isValidType) {
        throw new Error(
          `Unsupported file type (${file.name}). Allowed: JPEG, PNG, TIFF, BMP, GIF, ZIP`
        );
      }
      formData.append('images', file);
    });
  }

  else {
    return Promise.reject(new Error(`Invalid input: type='${type}' does not match data`));
  }

  // Use XHR so we can detect the moment upload finishes (before server processes)
  return new Promise<TranslateResponse>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('load', () => {
      onUploadDone?.();
    });

    xhr.addEventListener('load', () => {
      if (xhr.status !== 200) {
        reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
        return;
      }
      try {
        resolve(JSON.parse(xhr.responseText) as TranslateResponse);
      } catch {
        reject(new Error('Invalid response from server'));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error - could not reach server')));
    xhr.addEventListener('abort', () => reject(new Error('Request was cancelled')));

    xhr.open('POST', `${API_BASE_URL}/upload/`);
    if (apiKey?.trim()) {
      xhr.setRequestHeader('X-User-Api-Key', apiKey.trim());
    }
    xhr.send(formData);
  });
}
