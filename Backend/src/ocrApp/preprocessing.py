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

    # Convert to RGB if needed
    if img.mode != "RGB":
        img = img.convert("RGB")

    # Save to BytesIO as JPEG
    output = BytesIO()
    img.save(output, format="JPEG", quality=95)
    output.seek(0)

    # Encode as base64 and return as data URL
    b64 = base64.b64encode(output.read()).decode("utf-8")
    return f"data:image/jpeg;base64,{b64}"