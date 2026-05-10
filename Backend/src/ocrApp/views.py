import re
import zipfile
import tempfile
import os
import logging
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from io import BytesIO

import requests
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.core.validators import validate_email
from django.http import JsonResponse, Http404
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from .models import ContactMessage
from .serializers import (
    ALLOWED_IMAGE_TYPES,
    serialize_ocr_result,
    serialize_ocr_history_item,
    validate_image_file,
)
from .services import GeminiOCRService
from .calamari_ocr_service import CalamariOCRService

logger = logging.getLogger(__name__)

# OpenRouter keys follow the pattern: sk-or-v1-<hex chars>
# We validate the format so only well-formed keys are forwarded.
_API_KEY_RE = re.compile(r'^sk-or-v1-[A-Za-z0-9]{1,200}$')
_API_KEY_MAX_LEN = 220  # hard upper bound to prevent oversized header abuse
_TEXT_INPUT_MAX_CHARS = 20000


def _validate_user_api_key(raw: str | None) -> tuple[str | None, str | None]:
    """
    Return (key, None) if valid, or (None, error_message) if not.
    The raw value is never included in the returned error message.
    """
    if not raw:
        return None, None  # no key supplied — fall back to server default

    if len(raw) > _API_KEY_MAX_LEN:
        return None, "Provided API key exceeds maximum allowed length."

    if not _API_KEY_RE.match(raw):
        return None, "Provided API key has an invalid format."

    return raw, None


@method_decorator(csrf_exempt, name="dispatch")
class ContactMessageView(View):
    """
    POST /api/contact/
    Store a Contact page message after server-side validation.
    """

    def post(self, request):
        try:
            payload = json.loads(request.body.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON body."}, status=400)

        name = str(payload.get("name", "")).strip()
        email = str(payload.get("email", "")).strip()
        subject = str(payload.get("subject", "")).strip()
        message = str(payload.get("message", "")).strip()

        errors = {}

        if not name:
            errors["name"] = "Name is required."
        elif len(name) > 120:
            errors["name"] = "Name must be 120 characters or fewer."

        if not email:
            errors["email"] = "Email is required."
        else:
            try:
                validate_email(email)
            except ValidationError:
                errors["email"] = "Enter a valid email address."

        if len(subject) > 200:
            errors["subject"] = "Subject must be 200 characters or fewer."

        if not message:
            errors["message"] = "Message is required."

        if errors:
            return JsonResponse({"errors": errors}, status=400)

        contact_message = ContactMessage.objects.create(
            name=name,
            email=email,
            subject=subject,
            message=message,
        )

        email_subject = subject or "New Deciffer contact message"
        email_subject = " ".join(email_subject.splitlines())
        email_body = (
            "A new message was submitted from the Deciffer Contact page.\n\n"
            f"Name: {name}\n"
            f"Email: {email}\n"
            f"Subject: {subject or '(No subject)'}\n\n"
            "Message:\n"
            f"{message}\n\n"
            f"Saved message ID: {contact_message.id}"
        )

        try:
            send_mail(
                subject=email_subject,
                message=email_body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[settings.CONTACT_RECIPIENT_EMAIL],
                fail_silently=False,
            )
        except Exception as exc:
            logger.exception("Failed to send contact message notification email.")
            return JsonResponse(
                {
                    "error": "Message was saved, but the email notification could not be sent.",
                    "id": str(contact_message.id),
                },
                status=502,
            )

        return JsonResponse(
            {
                "id": str(contact_message.id),
                "name": contact_message.name,
                "email": contact_message.email,
                "subject": contact_message.subject,
                "message": contact_message.message,
                "created_at": contact_message.created_at.isoformat(),
            },
            status=201,
        )


@method_decorator(csrf_exempt, name="dispatch")
class TextRecogniseView(View):
    """
    POST /api/ocr/text/
    Process direct text input without routing it through image upload validation.
    """

    def post(self, request):
        try:
            payload = json.loads(request.body.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON body."}, status=400)

        text = str(payload.get("text", "")).strip()
        if not text:
            return JsonResponse({"error": "No text provided."}, status=400)

        if len(text) > _TEXT_INPUT_MAX_CHARS:
            return JsonResponse(
                {"error": f"Text input exceeds {_TEXT_INPUT_MAX_CHARS} characters."},
                status=400,
            )

        raw_key = request.headers.get("X-User-Api-Key") or None
        user_api_key, key_error = _validate_user_api_key(raw_key)
        if key_error:
            return JsonResponse({"error": key_error}, status=400)

        service = GeminiOCRService(api_key=user_api_key)

        try:
            processed_text = service.process_text(text)
        except Exception as exc:
            logger.exception("Failed to process direct text input.")
            return JsonResponse(
                {"text-input.txt": {"error": str(exc)}},
                status=200,
            )

        return JsonResponse(
            {"text-input.txt": {"text": processed_text}},
            status=200,
        )


@method_decorator(csrf_exempt, name="dispatch")
class ImageUploadAndRecogniseView(View):

    def post(self, request):

        engine = request.POST.get("engine", "gemini").lower()
        print("Selected engine:", engine)

        if engine not in ["gemini", "calamari"]:
            return JsonResponse({"error": "Invalid OCR engine selected."}, status=400)

        if not request.FILES:
            return JsonResponse({"error": "No files uploaded."}, status=400)

        files = request.FILES.getlist("images")

        if not files:
            return JsonResponse({"error": "No image files found."}, status=400)

        raw_key = request.headers.get("X-User-Api-Key") or None
        user_api_key, key_error = _validate_user_api_key(raw_key)

        if key_error:
            return JsonResponse({"error": key_error}, status=400)

        if engine == "gemini":
            if user_api_key:
                logger.info("Request is using a user-supplied API key.")
            else:
                logger.info("Request is using the server default API key.")

            service = GeminiOCRService(api_key=user_api_key)

        else:
            service = CalamariOCRService()

        tasks: list[tuple[str, bytes]] = []
        results = {}

        for file in files:
            try:
                file.seek(0)

                if file.name.lower().endswith(".zip"):

                    with tempfile.TemporaryDirectory() as temp_dir:
                        zip_path = os.path.join(temp_dir, file.name)

                        with open(zip_path, "wb") as f:
                            for chunk in file.chunks():
                                f.write(chunk)

                        with zipfile.ZipFile(zip_path, "r") as zip_ref:
                            for extracted_name in zip_ref.namelist():

                                base_filename = os.path.basename(extracted_name)

                                if extracted_name.startswith("__MACOSX/") or base_filename.startswith("._"):
                                    continue

                                extracted_path = os.path.realpath(os.path.join(temp_dir, extracted_name))

                                if not extracted_path.startswith(os.path.realpath(temp_dir)):
                                    results[extracted_name] = {"error": "Blocked: path traversal detected."}
                                    continue

                                zip_ref.extract(extracted_name, temp_dir)

                                if not os.path.isfile(extracted_path):
                                    continue

                                if not extracted_name.lower().endswith(
                                    (".jpg", ".jpeg", ".png", ".tif", ".tiff", ".bmp", ".gif")
                                ):
                                    continue

                                with open(extracted_path, "rb") as img_file:
                                    tasks.append((extracted_name, img_file.read()))

                else:
                    error = validate_image_file(file)

                    if error:
                        results[file.name] = {"error": error}
                        continue

                    tasks.append((file.name, file.read()))

            except Exception as exc:
                results[file.name] = {"error": str(exc)}

        def recognise_task(name: str, file_bytes: bytes) -> tuple[str, dict]:
            try:
                text, preview_b64 = service.recognise(BytesIO(file_bytes))

                return name, {
                    "text": text,
                    "preview_b64": preview_b64,
                    "engine": engine
                }

            except Exception as e:
                return name, {"error": str(e)}

        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = {
                executor.submit(recognise_task, name, data): name 
                for name, data in tasks
            }

            for future in as_completed(futures):
                name, result = future.result()
                results[name] = result

        return JsonResponse(results, status=200) 


@method_decorator(csrf_exempt, name="dispatch")
class CreditsView(View):
    """
    GET /api/ocr/credits/
    Proxy request to OpenRouter to fetch remaining account credits.
    Returns: { "total_credits": float, "total_usage": float, "remaining": float }
    """

    def get(self, request):
        raw_key = request.headers.get("X-User-Api-Key") or None
        user_api_key, key_error = _validate_user_api_key(raw_key)
        if key_error:
            return JsonResponse({"error": key_error}, status=400)

        api_key = user_api_key or settings.OPENROUTER_API_KEY
        if not api_key:
            return JsonResponse({"error": "API key not configured."}, status=500)

        try:
            response = requests.get(
                "https://openrouter.ai/api/v1/credits",
                headers={"Authorization": f"Bearer {api_key}"},
                timeout=10,
            )
        except requests.RequestException as exc:
            return JsonResponse({"error": f"Failed to reach OpenRouter: {exc}"}, status=502)

        if response.status_code != 200:
            return JsonResponse({"error": f"OpenRouter returned {response.status_code}"}, status=502)

        data = response.json().get("data", {})
        total_credits = data.get("total_credits", 0)
        total_usage = data.get("total_usage", 0)

        return JsonResponse({
            "total_credits": total_credits,
            "total_usage": total_usage,
            "remaining": round(total_credits - total_usage, 4),
        })


# @method_decorator(csrf_exempt, name="dispatch")
# class OCRResultDetailView(View):
#     """
#     GET    /api/ocr/result/<uuid>/   — Retrieve a single OCR result.
#     DELETE /api/ocr/result/<uuid>/   — Delete an OCR record and its image.
#     """

#     def _get_object(self, pk):
#         try:
#             return OCRImage.objects.get(pk=pk)
#         except OCRImage.DoesNotExist:
#             raise Http404

#     def get(self, request, pk):
#         ocr_image = self._get_object(pk)
#         return JsonResponse(serialize_ocr_result(ocr_image))

#     def delete(self, request, pk):
#         ocr_image = self._get_object(pk)
#         ocr_image.delete()
#         return JsonResponse({}, status=204)


# class OCRHistoryListView(View):
#     """
#     GET /api/ocr/history/
#     List all OCR records, newest first.
#     """

#     def get(self, request):
#         records = OCRImage.objects.all()
#         data = [serialize_ocr_history_item(r) for r in records]
#         return JsonResponse(data, safe=False)
