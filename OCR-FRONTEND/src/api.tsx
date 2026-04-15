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
  data: string | File;
}): Promise<TranslateResponse> {
  try {
    const { type, data } = params;

    // Determine the file to send
    let fileToSend: File;

    if (type === 'text' && typeof data === 'string') {
      // Convert text to a File object
      fileToSend = new File([data], 'text-input.txt', { type: 'text/plain' });
    } else if (type === 'file' && data instanceof File) {
      // Validate file type for images and zip files
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/tiff', 'image/bmp', 'image/gif',
        'application/zip', 'application/x-zip-compressed'
      ];
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.tif', '.tiff', '.zip'];

      const fileExtension = data.name.toLowerCase().substring(data.name.lastIndexOf('.'));
      const isValidType = allowedTypes.includes(data.type) || allowedExtensions.includes(fileExtension);

      if (!isValidType) {
        throw new Error(`Unsupported file type. Allowed: JPEG, PNG, TIFF, BMP, GIF, ZIP`);
      }

      // Use the file directly (could be image or zip)
      fileToSend = data;
    } else {
      throw new Error(`Invalid input: type='${type}' should match data type`);
    }

    // Create FormData and append file
    const formData = new FormData();
    formData.append('images', fileToSend);

    // Send POST request to backend
    const response = await fetch(`${API_BASE_URL}/upload/`, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type, let the browser set it with the boundary
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result: TranslateResponse = await response.json();
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to translate: ${errorMessage}`);
  }
}
