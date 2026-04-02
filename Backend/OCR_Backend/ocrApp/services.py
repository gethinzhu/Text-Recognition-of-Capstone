import base64
import logging
import mimetypes

from django.conf import settings

import google.generativeai as genai

from .preprocessing import convert_to_jpg

logger = logging.getLogger(__name__)

# The prompt sent to Gemini for Fraktur OCR recognition
OCR_SYSTEM_PROMPT = (
    "You are an expert OCR system specialised in reading historical German "
    "newspapers printed in Fraktur typeface from the 1930s. "
    "Analyse the provided newspaper image and extract ALL text you can recognise. "
    "Return ONLY the extracted text, preserving the original paragraph structure. "
    "Do not add any commentary, explanation, or translation."
)


class GeminiOCRService:
    """
    Calls the Google Gemini 3.1 Pro model to perform OCR on an uploaded image.
    """

    def __init__(self):
        api_key = getattr(settings, "GEMINI_API_KEY", "")
        if not api_key:
            raise ValueError(
                "GEMINI_API_KEY is not configured. "
                "Please set it in your Django settings or .env file."
            )
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemini-3.1-pro")

    def recognise(self, image_path: str) -> str:
        """
        Send an image to Gemini and return the recognised text.

        The image is first converted to JPG (handles .TIF/.TIFF and other
        formats) before being sent to the Gemini API.

        Args:
            image_path: Absolute filesystem path to the uploaded image.

        Returns:
            The recognised text extracted from the image.

        Raises:
            RuntimeError: If the Gemini API call fails.
        """
        # Preprocessing: convert TIF/TIFF/other formats to JPG
        image_path = convert_to_jpg(image_path)

        mime_type, _ = mimetypes.guess_type(image_path)
        if mime_type is None:
            mime_type = "image/jpeg"

        with open(image_path, "rb") as f:
            image_bytes = f.read()

        image_data = {
            "mime_type": mime_type,
            "data": base64.b64encode(image_bytes).decode("utf-8"),
        }

        try:
            response = self.model.generate_content(
                [OCR_SYSTEM_PROMPT, image_data],
            )
            return response.text.strip()
        except Exception as exc:
            logger.exception("Gemini OCR request failed")
            raise RuntimeError(f"Gemini API error: {exc}") from exc
