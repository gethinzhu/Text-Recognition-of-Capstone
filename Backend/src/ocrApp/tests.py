import io
import zipfile
from unittest.mock import Mock, patch

import requests
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client, TestCase
from PIL import Image


def create_test_image(name="page.jpg", fmt="JPEG", content_type="image/jpeg"):
    """Create a small valid image file for upload API tests."""
    buffer = io.BytesIO()
    Image.new("RGB", (50, 50), color="white").save(buffer, fmt)
    buffer.seek(0)

    return SimpleUploadedFile(
        name=name,
        content=buffer.read(),
        content_type=content_type,
    )


def create_test_zip(name="pages.zip"):
    """Create a ZIP containing one valid image file."""
    image_buffer = io.BytesIO()
    Image.new("RGB", (50, 50), color="white").save(image_buffer, "JPEG")
    image_buffer.seek(0)

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w") as archive:
        archive.writestr("page-001.jpg", image_buffer.read())
    zip_buffer.seek(0)

    return SimpleUploadedFile(
        name=name,
        content=zip_buffer.read(),
        content_type="application/zip",
    )


class UploadApiTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.url = "/api/ocr/upload/"

    @patch("ocrApp.views.GeminiOCRService")
    def test_upload_single_image_returns_mocked_ocr_result(self, mock_service_class):
        mock_service = mock_service_class.return_value
        mock_service.recognise.return_value = ("Mock OCR text", "mock_preview_base64")

        image = create_test_image()
        response = self.client.post(self.url, {"images": [image]})

        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertIn("page.jpg", data)
        self.assertEqual(data["page.jpg"]["text"], "Mock OCR text")
        self.assertEqual(data["page.jpg"]["preview_b64"], "mock_preview_base64")
        mock_service.recognise.assert_called_once()

    @patch("ocrApp.views.GeminiOCRService")
    def test_upload_multiple_images_returns_result_per_file(self, mock_service_class):
        mock_service = mock_service_class.return_value
        mock_service.recognise.return_value = ("Mock OCR text", "mock_preview_base64")

        first_image = create_test_image(name="page-001.jpg")
        second_image = create_test_image(name="page-002.jpg")
        response = self.client.post(self.url, {"images": [first_image, second_image]})

        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertEqual(set(data.keys()), {"page-001.jpg", "page-002.jpg"})
        self.assertEqual(data["page-001.jpg"]["text"], "Mock OCR text")
        self.assertEqual(data["page-002.jpg"]["preview_b64"], "mock_preview_base64")
        self.assertEqual(mock_service.recognise.call_count, 2)

    @patch("ocrApp.views.GeminiOCRService")
    def test_upload_zip_extracts_image_and_returns_result(self, mock_service_class):
        mock_service = mock_service_class.return_value
        mock_service.recognise.return_value = ("ZIP OCR text", "zip_preview_base64")

        archive = create_test_zip()
        response = self.client.post(self.url, {"images": [archive]})

        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertIn("page-001.jpg", data)
        self.assertEqual(data["page-001.jpg"]["text"], "ZIP OCR text")
        self.assertEqual(data["page-001.jpg"]["preview_b64"], "zip_preview_base64")

    def test_upload_without_files_returns_400(self):
        response = self.client.post(self.url, {})

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["error"], "No files uploaded.")

    def test_upload_invalid_file_type_returns_per_file_error(self):
        text_file = SimpleUploadedFile(
            name="notes.txt",
            content=b"not an image",
            content_type="text/plain",
        )

        response = self.client.post(self.url, {"images": [text_file]})

        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertIn("notes.txt", data)
        self.assertIn("error", data["notes.txt"])

    def test_invalid_user_api_key_returns_400(self):
        image = create_test_image()

        response = self.client.post(
            self.url,
            {"images": [image]},
            HTTP_X_USER_API_KEY="invalid-key",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("invalid format", response.json()["error"])

    @patch("ocrApp.views.GeminiOCRService")
    def test_valid_user_api_key_is_passed_to_service(self, mock_service_class):
        mock_service = mock_service_class.return_value
        mock_service.recognise.return_value = ("Mock OCR text", "mock_preview_base64")
        image = create_test_image()

        response = self.client.post(
            self.url,
            {"images": [image]},
            HTTP_X_USER_API_KEY="sk-or-v1-test123",
        )

        self.assertEqual(response.status_code, 200)
        mock_service_class.assert_called_once_with(api_key="sk-or-v1-test123")

    @patch("ocrApp.views.GeminiOCRService")
    def test_ocr_service_failure_returns_per_file_error(self, mock_service_class):
        mock_service = mock_service_class.return_value
        mock_service.recognise.side_effect = RuntimeError("OpenRouter unavailable")
        image = create_test_image()

        response = self.client.post(self.url, {"images": [image]})

        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertIn("page.jpg", data)
        self.assertIn("OpenRouter unavailable", data["page.jpg"]["error"])


class CreditsApiTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.url = "/api/ocr/credits/"

    @patch("ocrApp.views.requests.get")
    def test_credits_endpoint_returns_mocked_remaining_balance(self, mock_get):
        fake_response = Mock()
        fake_response.status_code = 200
        fake_response.json.return_value = {
            "data": {
                "total_credits": 10,
                "total_usage": 3.25,
            }
        }
        mock_get.return_value = fake_response

        response = self.client.get(
            self.url,
            HTTP_X_USER_API_KEY="sk-or-v1-test123",
        )

        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertEqual(data["total_credits"], 10)
        self.assertEqual(data["total_usage"], 3.25)
        self.assertEqual(data["remaining"], 6.75)
        mock_get.assert_called_once()

    def test_credits_invalid_user_api_key_returns_400(self):
        response = self.client.get(
            self.url,
            HTTP_X_USER_API_KEY="invalid-key",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("invalid format", response.json()["error"])

    @patch("ocrApp.views.requests.get")
    def test_credits_openrouter_failure_returns_502(self, mock_get):
        mock_get.return_value.status_code = 500

        response = self.client.get(
            self.url,
            HTTP_X_USER_API_KEY="sk-or-v1-test123",
        )

        self.assertEqual(response.status_code, 502)
        self.assertIn("OpenRouter returned 500", response.json()["error"])

    @patch("ocrApp.views.requests.get")
    def test_credits_network_error_returns_502(self, mock_get):
        mock_get.side_effect = requests.RequestException("network down")

        response = self.client.get(
            self.url,
            HTTP_X_USER_API_KEY="sk-or-v1-test123",
        )

        self.assertEqual(response.status_code, 502)
        self.assertIn("Failed to reach OpenRouter", response.json()["error"])
