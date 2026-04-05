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
        # Check if any files are uploaded
        if not request.FILES:
            return JsonResponse({"error": "No files uploaded."}, status=400)

        # Get all files
        files = request.FILES.getlist("images")

        if not files:
            return JsonResponse({"error": "No image files found."}, status=400)

        service = GeminiOCRService()
        results = {}

        for file in files:
            # Validate each file (optional)
            error = validate_image_file(file)
            if error:
                results[file.name] = {"error": error}
                continue

            try:
                # Run OCR
                recognised_text = service.recognise(file)
                results[file.name] = {"text": recognised_text}

            except Exception as exc:
                results[file.name] = {"error": str(exc)}

        return JsonResponse(results, status=200)


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
