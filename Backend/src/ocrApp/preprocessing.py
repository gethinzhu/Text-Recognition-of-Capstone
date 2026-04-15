from PIL import Image
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

    # Resize to reduce payload (VERY IMPORTANT)
    max_size = (1200, 1200)
    img.thumbnail(max_size)

    # Save as compressed JPEG
    output = BytesIO()
    img.save(output, format="JPEG", quality=65, optimize=True)

    output.seek(0)

    # Encode to base64
    b64 = base64.b64encode(output.read()).decode("utf-8")

    return b64