# ocrApp/calamari_ocr_service.py

import subprocess
import tempfile
from io import BytesIO
from pathlib import Path

import kraken
from PIL import Image, ImageFilter, ImageOps
from kraken import blla, binarization
from kraken.lib import vgsl

from .preprocessing import convert_file_to_base64_jpg


class CalamariOCRService:
    def __init__(self):
        self.model_path = (
            Path(__file__).resolve().parents[2]
            / "ml_models"
            / "calamari_training"
            / "models"
            / "fraktur_19th_century"
            / "4.ckpt"
        )

        print("Calamari model path:", self.model_path)
        print("Model exists:", self.model_path.exists())

    def recognise(self, file) -> tuple[str, str]:
        """
        Must return same format as Gemini:
        (recognised_text, preview_b64)
        """

        file.seek(0)

        # UI preview image
        preview_b64 = convert_file_to_base64_jpg(file) 

        # Use original image for Kraken/Calamari
        file.seek(0)
        image = Image.open(file).convert("RGB")

        with tempfile.TemporaryDirectory() as temp_dir:
            temp_dir_path = Path(temp_dir)

            line_paths = self._segment_with_kraken(image, temp_dir_path)

            if not line_paths:
                return "", preview_b64

            text = self._recognise_with_calamari_batch(line_paths, temp_dir_path)

        return text, preview_b64

    def _segment_with_kraken(self, image: Image.Image, output_dir: Path) -> list[Path]:
        lines_dir = output_dir / "lines"
        lines_dir.mkdir(exist_ok=True)

        gray = image.convert("L")
        gray = ImageOps.autocontrast(gray)
        gray = gray.filter(ImageFilter.MedianFilter(size=3))

        binary = binarization.nlbin(gray)

        kraken_package_dir = Path(kraken.__file__).resolve().parent
        blla_model_path = kraken_package_dir / "blla.mlmodel"

        print("BLLA model path:", blla_model_path)

        model = vgsl.TorchVGSLModel.load_model(str(blla_model_path))

        result = blla.segment(binary, model=model)

        if isinstance(result, dict):
            lines = result.get("lines", [])
        else:
            lines = getattr(result, "lines", [])

        print(f"Kraken lines detected: {len(lines)}")

        line_paths = []

        for index, line in enumerate(lines):
            left = top = right = bottom = None

            if isinstance(line, dict):
                if line.get("boundary"):
                    boundary = line["boundary"]

                    xs = [p[0] for p in boundary]
                    ys = [p[1] for p in boundary]

                    left = max(min(xs) - 5, 0)
                    top = max(min(ys) - 5, 0)
                    right = min(max(xs) + 5, image.width)
                    bottom = min(max(ys) + 5, image.height)

                elif line.get("bbox"):
                    left, top, right, bottom = line["bbox"]

            else:
                if hasattr(line, "boundary") and line.boundary:
                    boundary = line.boundary

                    xs = [p[0] for p in boundary]
                    ys = [p[1] for p in boundary]

                    left = max(min(xs) - 5, 0)
                    top = max(min(ys) - 5, 0)
                    right = min(max(xs) + 5, image.width)
                    bottom = min(max(ys) + 5, image.height)

                elif hasattr(line, "bbox") and line.bbox:
                    left, top, right, bottom = line.bbox

            if left is None or top is None or right is None or bottom is None:
                continue

            left = max(int(left) - 5, 0)
            top = max(int(top) - 5, 0)
            right = min(int(right) + 5, image.width)
            bottom = min(int(bottom) + 5, image.height)

            if right <= left or bottom <= top:
                continue

            line_image = image.crop((left, top, right, bottom))

            line_path = lines_dir / f"line_{index:04d}.png"
            line_image.save(line_path)

            line_paths.append(line_path)

        print(f"Saved cropped line images: {len(line_paths)}")

        return line_paths

    def _recognise_with_calamari_batch(self, line_paths: list[Path], output_dir: Path) -> str:
        if not self.model_path.exists():
            raise FileNotFoundError(f"Calamari model not found: {self.model_path}")

        command = [
            "calamari-predict",
            "--checkpoint",
            str(self.model_path),
            "--data",
            "File",
            "--data.images",
        ]

        command.extend([str(path) for path in line_paths])

        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
        )

        # print("Calamari STDOUT:", result.stdout)
        # print("Calamari STDERR:", result.stderr)

        if result.returncode != 0:
            raise Exception(f"Calamari failed: {result.stderr}")

        recognised_lines = []

        for line_path in line_paths:
            possible_files = [
                Path(str(line_path) + ".pred.txt"),
                line_path.with_suffix(".pred.txt"),
                line_path.with_name(line_path.name + ".pred.txt"),
            ]

            for pred_file in possible_files:
                if pred_file.exists():
                    text = pred_file.read_text(encoding="utf-8").strip()

                    if text:
                        recognised_lines.append(text)

                    break

        return "\n".join(recognised_lines)