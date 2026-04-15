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


class GeminiOCRService:
    """
    Calls the Google Gemini 3.1 Pro model to perform OCR on an uploaded image.
    """

    def __init__(self):
        self.api_key = settings.OPENROUTER_API_KEY
        self.model = settings.OPENROUTER_MODEL
        self.base_url = settings.OPENROUTER_BASE_URL
        self.url = f"{self.base_url}/chat/completions"

    def recognise(self, file) -> str:

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

        response = requests.post(self.url, headers=headers, json=payload)

        if response.status_code != 200:
            raise Exception(f"API request failed: {response.text}")

        try:
            response_json = response.json()
        except ValueError:
            raise Exception(f"Invalid JSON response: {response.text}")

        if "choices" not in response_json:
            raise Exception(f"Invalid API response: {response_json}")

        return response_json['choices'][0]['message']['content'].strip()