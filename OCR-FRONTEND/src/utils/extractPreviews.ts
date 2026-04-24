import type { TranslateResponse } from '../api';

/**
 * Turn a backend OCR response into a {fileName -> data URL} map
 * using the base64 JPEG preview included for each file.
 */
export function extractPreviews(result: TranslateResponse): Record<string, string> {
  const previews: Record<string, string> = {};
  for (const [fileName, value] of Object.entries(result)) {
    if (value?.preview_b64) {
      previews[fileName] = `data:image/jpeg;base64,${value.preview_b64}`;
    }
  }
  return previews;
}
