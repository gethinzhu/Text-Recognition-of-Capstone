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
export async function getCredits(): Promise<CreditsResponse> {
  const response = await fetch(`${API_BASE_URL}/credits/`);
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
  };
}

/**
 * Send file or text to the backend for OCR processing
 * @param params - Object containing type ('text' or 'file') and data (string, image file, or zip file)
 * @returns Promise with recognized text results
 */
export async function handleTranslate(params: {
  type: 'text' | 'file';
  data: string | File | File[];
}): Promise<TranslateResponse> {
  try {
    const { type, data } = params;

    const formData = new FormData();

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
          allowedTypes.includes(file.type) ||
          allowedExtensions.includes(fileExtension);

        if (!isValidType) {
          throw new Error(
            `Unsupported file type (${file.name}). Allowed: JPEG, PNG, TIFF, BMP, GIF, ZIP`
          );
        }

        // append each file
        formData.append('images', file);
      });
    }

    else {
      throw new Error(`Invalid input: type='${type}' does not match data`);
    }

    // API CALL
    const response = await fetch(`${API_BASE_URL}/upload/`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result: TranslateResponse = await response.json();
    return result;

  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to translate: ${errorMessage}`);
  }
}