import base64
import logging
import mimetypes
from urllib import response
import requests
from django.conf import settings
from .preprocessing import convert_file_to_base64_jpg

logger = logging.getLogger(__name__)

# The prompt sent to Gemini for Fraktur OCR recognition
OCR_SYSTEM_PROMPT = (
    "You are an expert OCR system specialised in reading historical German "
    "newspapers printed in Fraktur typeface from the 1930s. "
    "Analyse the provided newspaper image and extract ALL text you can recognise. "
    "Return ONLY the extracted text, preserving the original paragraph structure. "
    "Do not add any commentary, explanation, or translation."
)

TEXT_SYSTEM_PROMPT = (
    "You are an expert assistant for historical German newspaper text printed "
    "or transcribed from Fraktur sources. The user will provide plain text, not "
    "an image. Convert the input into readable modern German text while "
    "preserving meaning, names, dates, spelling uncertainty and paragraph "
    "structure as much as possible. Correct obvious OCR or transcription errors "
    "only when the context supports the correction. Do not translate into "
    "English. Return only the corrected text, with no commentary."
)


class GeminiOCRService:
    """
    Calls the Google Gemini 3.1 Pro model to perform OCR on an uploaded image.

    If api_key is provided it is used only for this request and never stored.
    Falls back to the server-configured key when no user key is supplied.
    """

    def __init__(self, api_key: str | None = None):
        # Use caller-supplied key if present; never persist it beyond this object's lifetime.
        self.api_key = api_key if api_key else settings.OPENROUTER_API_KEY
        self.model = settings.OPENROUTER_MODEL
        self.base_url = settings.OPENROUTER_BASE_URL
        self.url = f"{self.base_url}/chat/completions"

    def recognise(self, file) -> tuple[str, str]:
        """
        Returns (recognised_text, preview_b64). The preview JPEG is the same
        normalised image that was sent to Gemini, so the user sees exactly
        what the model saw.
        """
        # Reset file pointer
        file.seek(0)

        # Convert file to JPEG base64 in memory
        image_b64 = convert_file_to_base64_jpg(file)

        # Prepare OpenRouter payload
        messages = [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": OCR_SYSTEM_PROMPT
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                            "url": f"data:image/jpeg;base64,{image_b64}"
                            }
                        }
                    ]
                }
            ]

        payload = {
            "model": self.model,
            "messages": messages,
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        response = requests.post(self.url, headers=headers, json=payload, timeout=300)

        if response.status_code != 200:
            raise Exception(f"API request failed: {response.text}")

        try:
            response_json = response.json()
        except ValueError:
            raise Exception(f"Invalid JSON response: {response.text}")

        if "choices" not in response_json:
            raise Exception(f"Invalid API response: {response_json}")

        choice = response_json['choices'][0]
        content = choice['message']['content']
        if content is None:
            finish_reason = choice.get('finish_reason', 'unknown')
            raise Exception(f"Model returned empty content (finish_reason: {finish_reason}).")

        return content.strip(), image_b64

    def process_text(self, text: str) -> str:
        """
        Process direct text input without using image preprocessing or file
        validation. This keeps the image/ZIP OCR pipeline independent.
        """
        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": TEXT_SYSTEM_PROMPT,
                },
                {
                    "role": "user",
                    "content": text,
                },
            ],
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        response = requests.post(self.url, headers=headers, json=payload, timeout=300)

        if response.status_code != 200:
            raise Exception(f"API request failed: {response.text}")

        try:
            response_json = response.json()
        except ValueError:
            raise Exception(f"Invalid JSON response: {response.text}")

        if "choices" not in response_json:
            raise Exception(f"Invalid API response: {response_json}")

        choice = response_json["choices"][0]
        content = choice["message"]["content"]
        if content is None:
            finish_reason = choice.get("finish_reason", "unknown")
            raise Exception(f"Model returned empty content (finish_reason: {finish_reason}).")

        return content.strip()
