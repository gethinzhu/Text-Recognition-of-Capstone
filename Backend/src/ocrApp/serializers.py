# Allowed image MIME types for upload
ALLOWED_IMAGE_TYPES = {
    "image/jpeg",
    "image/png",
    "image/tiff",
    "image/bmp",
    "image/gif",
}


def validate_image_file(image_file):
    """
    Validate the uploaded file is an allowed image type.
    Returns an error string if invalid, or None if valid.
    """
    if image_file.content_type not in ALLOWED_IMAGE_TYPES:
        return (
            f"Unsupported file type '{image_file.content_type}'. "
            f"Allowed types: JPEG, PNG, TIFF, BMP, GIF."
        )
    return None


def serialize_ocr_result(ocr_image):
    """Full result serialization — used for upload response and detail view."""
    return {
        "id": str(ocr_image.id),
        "original_filename": ocr_image.original_filename,
        "image": ocr_image.image.url if ocr_image.image else None,
        "recognised_text": ocr_image.recognised_text,
        "status": ocr_image.status,
        "error_message": ocr_image.error_message,
        "created_at": ocr_image.created_at.isoformat(),
        "updated_at": ocr_image.updated_at.isoformat(),
    }


def serialize_ocr_history_item(ocr_image):
    """Lightweight serialization — used for the history list."""
    return {
        "id": str(ocr_image.id),
        "original_filename": ocr_image.original_filename,
        "status": ocr_image.status,
        "created_at": ocr_image.created_at.isoformat(),
    }
