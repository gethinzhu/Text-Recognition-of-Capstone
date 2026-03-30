import json
import logging

from django.http import JsonResponse, Http404
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from .models import OCRImage
from .serializers import (
    ALLOWED_IMAGE_TYPES,
    serialize_ocr_result,
    serialize_ocr_history_item,
    validate_image_file,
)
from .services import GeminiOCRService

logger = logging.getLogger(__name__)


@method_decorator(csrf_exempt, name="dispatch")
class ImageUploadAndRecogniseView(View):
    """
    POST /api/ocr/upload/
    Upload a newspaper image and run OCR via Gemini.
    Returns the recognised text in the response.
    """

    def post(self, request):
        # Validate file present
        if "image" not in request.FILES:
            return JsonResponse({"image": ["This field is required."]}, status=400)

        image_file = request.FILES["image"]

        # Validate file type
        error = validate_image_file(image_file)
        if error:
            return JsonResponse({"image": [error]}, status=400)

        # Save the record
        ocr_image = OCRImage.objects.create(
            image=image_file,
            original_filename=image_file.name,
        )

        # Run OCR
        ocr_image.status = OCRImage.Status.PROCESSING
        ocr_image.save(update_fields=["status"])

        try:
            service = GeminiOCRService()
            recognised_text = service.recognise(ocr_image.image.path)

            ocr_image.recognised_text = recognised_text
            ocr_image.status = OCRImage.Status.COMPLETED
            ocr_image.save(update_fields=["recognised_text", "status", "updated_at"])

        except Exception as exc:
            logger.exception("OCR processing failed for %s", ocr_image.id)
            ocr_image.status = OCRImage.Status.FAILED
            ocr_image.error_message = str(exc)
            ocr_image.save(update_fields=["status", "error_message", "updated_at"])

        http_status = (
            200 if ocr_image.status == OCRImage.Status.COMPLETED else 500
        )
        return JsonResponse(serialize_ocr_result(ocr_image), status=http_status)


@method_decorator(csrf_exempt, name="dispatch")
class OCRResultDetailView(View):
    """
    GET    /api/ocr/result/<uuid>/   — Retrieve a single OCR result.
    DELETE /api/ocr/result/<uuid>/   — Delete an OCR record and its image.
    """

    def _get_object(self, pk):
        try:
            return OCRImage.objects.get(pk=pk)
        except OCRImage.DoesNotExist:
            raise Http404

    def get(self, request, pk):
        ocr_image = self._get_object(pk)
        return JsonResponse(serialize_ocr_result(ocr_image))

    def delete(self, request, pk):
        ocr_image = self._get_object(pk)
        ocr_image.delete()
        return JsonResponse({}, status=204)


class OCRHistoryListView(View):
    """
    GET /api/ocr/history/
    List all OCR records, newest first.
    """

    def get(self, request):
        records = OCRImage.objects.all()
        data = [serialize_ocr_history_item(r) for r in records]
        return JsonResponse(data, safe=False)
