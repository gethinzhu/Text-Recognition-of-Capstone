import io
import uuid
from unittest.mock import patch

from django.test import TestCase, Client
from django.core.files.uploadedfile import SimpleUploadedFile

from PIL import Image

from .models import OCRImage


def _create_test_image(fmt="JPEG", ext="jpg", size=(100, 100)):
    """Helper: generate a tiny in-memory image file."""
    buf = io.BytesIO()
    Image.new("RGB", size, color="white").save(buf, fmt)
    buf.seek(0)
    return SimpleUploadedFile(
        name=f"test_image.{ext}",
        content=buf.read(),
        content_type=f"image/{fmt.lower()}",
    )


def _create_test_tif(size=(100, 100)):
    """Helper: generate a tiny TIF image file."""
    buf = io.BytesIO()
    Image.new("RGB", size, color="white").save(buf, "TIFF")
    buf.seek(0)
    return SimpleUploadedFile(
        name="test_image.tif",
        content=buf.read(),
        content_type="image/tiff",
    )


# ---------------------------------------------------------------------------
# Model tests
# ---------------------------------------------------------------------------
class OCRImageModelTest(TestCase):

    def test_create_ocr_image(self):
        """OCRImage can be created with default status 'pending'."""
        img = OCRImage.objects.create(original_filename="sample.tif")
        self.assertEqual(img.status, OCRImage.Status.PENDING)
        self.assertEqual(str(img), "sample.tif (pending)")

    def test_ordering_newest_first(self):
        """Records are returned newest-first by default."""
        a = OCRImage.objects.create(original_filename="a.tif")
        b = OCRImage.objects.create(original_filename="b.tif")
        records = list(OCRImage.objects.all())
        self.assertEqual(records[0].id, b.id)


# ---------------------------------------------------------------------------
# Upload endpoint tests
# ---------------------------------------------------------------------------
class UploadEndpointTest(TestCase):

    def setUp(self):
        self.client = Client()
        self.url = "/api/ocr/upload/"

    @patch("ocrApp.services.GeminiOCRService.recognise")
    def test_upload_jpg_success(self, mock_recognise):
        """POST a JPEG image -> 200 with recognised text."""
        mock_recognise.return_value = "Erkannter Text"

        image = _create_test_image()
        response = self.client.post(self.url, {"image": image})

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["recognised_text"], "Erkannter Text")
        self.assertEqual(data["status"], "completed")

    @patch("ocrApp.services.GeminiOCRService.recognise")
    def test_upload_tif_success(self, mock_recognise):
        """POST a TIF image -> 200 (preprocessing converts to JPG)."""
        mock_recognise.return_value = "Fraktur Text"

        image = _create_test_tif()
        response = self.client.post(self.url, {"image": image})

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "completed")

    def test_upload_no_image_returns_400(self):
        """POST without an image file -> 400."""
        response = self.client.post(self.url, {})
        self.assertEqual(response.status_code, 400)

    def test_upload_invalid_file_type_returns_400(self):
        """POST with a non-image file -> 400."""
        txt = SimpleUploadedFile("notes.txt", b"hello", content_type="text/plain")
        response = self.client.post(self.url, {"image": txt})
        self.assertEqual(response.status_code, 400)

    @patch("ocrApp.services.GeminiOCRService.recognise")
    def test_upload_gemini_failure_returns_500(self, mock_recognise):
        """If Gemini API fails, response status should be 'failed'."""
        mock_recognise.side_effect = RuntimeError("API down")

        image = _create_test_image()
        response = self.client.post(self.url, {"image": image})

        self.assertEqual(response.status_code, 500)
        data = response.json()
        self.assertEqual(data["status"], "failed")
        self.assertIn("API down", data["error_message"])


# ---------------------------------------------------------------------------
# History endpoint tests
# ---------------------------------------------------------------------------
class HistoryEndpointTest(TestCase):

    def setUp(self):
        self.client = Client()

    def test_history_list_empty(self):
        """GET /history/ returns an empty list when there are no records."""
        response = self.client.get("/api/ocr/history/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_history_list_returns_records(self):
        """GET /history/ returns existing OCR records."""
        OCRImage.objects.create(original_filename="page1.tif")
        OCRImage.objects.create(original_filename="page2.tif")

        response = self.client.get("/api/ocr/history/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 2)


# ---------------------------------------------------------------------------
# Result detail endpoint tests
# ---------------------------------------------------------------------------
class ResultDetailEndpointTest(TestCase):

    def setUp(self):
        self.client = Client()

    def test_get_result_detail(self):
        """GET /result/<uuid>/ returns the full OCR record."""
        record = OCRImage.objects.create(
            original_filename="page.tif",
            recognised_text="Hello",
            status=OCRImage.Status.COMPLETED,
        )
        response = self.client.get(f"/api/ocr/result/{record.id}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["recognised_text"], "Hello")

    def test_get_nonexistent_result_returns_404(self):
        """GET /result/<random-uuid>/ returns 404."""
        fake_id = uuid.uuid4()
        response = self.client.get(f"/api/ocr/result/{fake_id}/")
        self.assertEqual(response.status_code, 404)

    def test_delete_result(self):
        """DELETE /result/<uuid>/ removes the record."""
        record = OCRImage.objects.create(original_filename="old.tif")
        response = self.client.delete(f"/api/ocr/result/{record.id}/")
        self.assertEqual(response.status_code, 204)
        self.assertFalse(OCRImage.objects.filter(id=record.id).exists())
