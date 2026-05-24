import logging
import time

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

    @staticmethod
    def _extract_completion_text(response_json) -> str:
        if "choices" not in response_json or not response_json["choices"]:
            raise Exception(f"Invalid API response: {response_json}")

        choice = response_json["choices"][0]
        content = choice.get("message", {}).get("content")

        if isinstance(content, list):
            content = "".join(
                part.get("text", "")
                for part in content
                if isinstance(part, dict)
            )

        if not isinstance(content, str) or not content.strip():
            finish_reason = choice.get("finish_reason", "unknown")
            raise Exception(
                f"Model returned empty content "
                f"(finish_reason: {finish_reason})."
            )

        return content.strip()

    def _request_chat_completion(self, messages) -> str:
        if not self.api_key:
            raise Exception("OpenRouter API key is not configured.")

        payload = {
            "model": self.model,
            "messages": messages,
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        response = requests.post(
            self.url,
            headers=headers,
            json=payload,
            timeout=300,
        )

        if response.status_code != 200:
            raise Exception(f"API request failed: {response.text}")

        try:
            response_json = response.json()
        except ValueError:
            raise Exception(f"Invalid JSON response: {response.text}")

        return self._extract_completion_text(response_json)

    def recognise(self, file) -> tuple[str, str]:
        """
        Returns (recognised_text, preview_b64).
        Retries Gemini/OpenRouter once or twice if the model returns empty content.
        """

        max_attempts = 3
        last_error = None

        for attempt in range(max_attempts):
            try:
                file.seek(0)
                image_b64 = convert_file_to_base64_jpg(file)

                messages = [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": OCR_SYSTEM_PROMPT,
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_b64}"
                                },
                            },
                        ],
                    }
                ]

                content = self._request_chat_completion(messages)
                return content, image_b64

            except Exception as e:
                last_error = e
                print(f"Gemini OCR attempt {attempt + 1} failed: {e}")

                if attempt < max_attempts - 1:
                    time.sleep(2)

        raise Exception(f"Gemini OCR failed after {max_attempts} attempts: {last_error}")

    def process_text(self, text: str) -> str:
        """
        Refine direct Fraktur/transcribed text input through Gemini/OpenRouter.
        """

        cleaned_text = text.strip()
        if not cleaned_text:
            raise ValueError("No text provided.")

        messages = [
            {
                "role": "system",
                "content": TEXT_SYSTEM_PROMPT,
            },
            {
                "role": "user",
                "content": cleaned_text,
            },
        ]

        max_attempts = 3
        last_error = None

        for attempt in range(max_attempts):
            try:
                return self._request_chat_completion(messages)

            except Exception as e:
                last_error = e
                print(f"Gemini text refinement attempt {attempt + 1} failed: {e}")

                if attempt < max_attempts - 1:
                    time.sleep(2)

        raise Exception(
            f"Gemini text refinement failed after {max_attempts} attempts: {last_error}"
        )
