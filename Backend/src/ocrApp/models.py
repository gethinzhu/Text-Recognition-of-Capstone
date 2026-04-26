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


class ContactMessage(models.Model):
    """
    Stores messages submitted from the public Contact page.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=120)
    email = models.EmailField()
    subject = models.CharField(max_length=200, blank=True, default="")
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Contact Message"
        verbose_name_plural = "Contact Messages"

    def __str__(self):
        return f"{self.name} <{self.email}>"
