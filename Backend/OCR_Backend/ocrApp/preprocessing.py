import logging
import os

from PIL import Image

logger = logging.getLogger(__name__)


def convert_to_jpg(source_path: str, output_dir: str | None = None) -> str:
    """
    Convert any image (especially .TIF/.TIFF) to JPG format.

    If the file is already a JPG/JPEG, returns the original path unchanged.
    Otherwise, creates a .jpg copy in *output_dir* (defaults to the same
    directory as the source) and returns the new path.

    Args:
        source_path: Absolute path to the uploaded image file.
        output_dir:  Directory to write the converted file into.
                     Defaults to the same directory as *source_path*.

    Returns:
        Absolute path to the (possibly converted) JPG file.
    """
    ext = os.path.splitext(source_path)[1].lower()

    # Already a JPG — nothing to do
    if ext in (".jpg", ".jpeg"):
        return source_path

    if output_dir is None:
        output_dir = os.path.dirname(source_path)

    basename = os.path.splitext(os.path.basename(source_path))[0]
    jpg_path = os.path.join(output_dir, f"{basename}.jpg")

    try:
        with Image.open(source_path) as img:
            # TIF files can be multi-page; take only the first frame
            img.seek(0)

            # Convert to RGB (TIF may be CMYK, RGBA, palette, etc.)
            if img.mode != "RGB":
                img = img.convert("RGB")

            img.save(jpg_path, "JPEG", quality=95)

        logger.info("Converted %s -> %s", source_path, jpg_path)
        return jpg_path

    except Exception as exc:
        logger.exception("Image conversion failed for %s", source_path)
        raise RuntimeError(f"Failed to convert image to JPG: {exc}") from exc
