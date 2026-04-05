import base64
import logging
import mimetypes
import requests
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
        self.api_key = settings.OPENROUTER_API_KEY
        self.model = settings.OPENROUTER_MODEL
        self.url = settings.OPENROUTER_BASE_URL

    def recognise(self, image_path: str) -> str:
        # Convert TIF/TIFF to JPG if needed
        image_path = convert_to_jpg(image_path)

        # Get MIME type
        mime_type, _ = mimetypes.guess_type(image_path)
        if mime_type is None:
            mime_type = "image/jpeg"

        # Read image bytes and encode in base64
        with open(image_path, "rb") as f:
            image_bytes = f.read()
        image_b64 = base64.b64encode(image_bytes).decode("utf-8")

        # Prepare payload for OpenRouter
        messages = [
            {
                "role": "user",
                "content": OCR_SYSTEM_PROMPT,
                "image": f"data:{mime_type};base64,{image_b64}"
            }
        ]

        payload = {
            "model": self.model,
            "messages": messages,
            "reasoning": {"enabled": False}  # OCR doesn’t need reasoning
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        try:
            response = requests.post(self.url, headers=headers, json=payload)
            response_json = response.json()
            text = response_json['choices'][0]['message']['content']
            return text.strip()
        except Exception as exc:
            logger.exception("Gemini OCR request failed for image %s", image_path)
            raise RuntimeError(f"Gemini API error: {exc}") from exc