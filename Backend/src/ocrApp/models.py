from django.db import models
import uuid


class OCRImage(models.Model):
    """
    Stores an uploaded newspaper image and its OCR recognition result.
    """

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSING = "processing", "Processing"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    image = models.ImageField(upload_to="ocr_uploads/%Y/%m/%d/")
    original_filename = models.CharField(max_length=255, blank=True)

    # OCR result fields
    recognised_text = models.TextField(blank=True, default="")
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    error_message = models.TextField(blank=True, default="")

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "OCR Image"
        verbose_name_plural = "OCR Images"

    def __str__(self):
        return f"{self.original_filename} ({self.status})"
