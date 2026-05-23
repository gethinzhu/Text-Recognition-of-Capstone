from PIL import Image, ImageFilter
from io import BytesIO
import base64

def convert_file_to_base64_jpg(file) -> str:
    """
    Takes a Django UploadedFile (TIF/TIFF/etc),
    converts to JPEG in memory, and returns a base64 string
    ready to pass to OpenRouter.
    """
    # Open the uploaded image
    img = Image.open(file)
    
    # If multi-frame TIF, just take the first frame
    try:
        img.seek(0)
    except EOFError:
        pass  # single-frame image

    # Convert to RGB 
    if img.mode != "RGB":
        img = img.convert("RGB")

    # Resize only if image is too large
    # Preserve aspect ratio to maintain newspaper readability
    MAX_WIDTH = 1800

    if img.width > MAX_WIDTH:
        ratio = MAX_WIDTH / img.width
        new_height = int(img.height * ratio)

        img = img.resize(
            (MAX_WIDTH, new_height),
            Image.LANCZOS
        )

    # Apply sharpening for better Fraktur readability
    img = img.filter(
        ImageFilter.UnsharpMask(
            radius=1,
            percent=150,
            threshold=3
        )
    )

    # Save as compressed JPEG
    output = BytesIO()
    img.save(output, format="JPEG", quality=90, optimize=True)

    output.seek(0)

    # Encode to base64
    b64 = base64.b64encode(output.read()).decode("utf-8")

    return b64