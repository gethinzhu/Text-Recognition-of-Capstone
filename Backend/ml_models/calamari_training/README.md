# Calamari Runtime

This directory contains an isolated Calamari runtime for line-level Fraktur OCR.

## Scope

This runtime is designed for:

- input: line-level PNG images, typically segmented by Kraken
- output: merged plain text plus a JSON payload for later backend integration

This directory is intentionally isolated from the Django backend so Calamari and Django do not share one Python environment.

## Directory Layout

- `models/fraktur_19th_century/`: pretrained Calamari checkpoints
- `inference/predict_lines.py`: stable OCR entrypoint
- `input/`: temporary line PNG inputs for local testing
- `output/`: generated OCR results

Recommended line image naming:

- `0001.png`
- `0002.png`
- `0003.png`

## Prerequisites

- Docker Desktop with Linux containers enabled

Optional local path:

- Python 3.8, if you want to test without Docker

## Build the Runtime

Run these commands from the repository root:

```powershell
cd Backend\ml_models\calamari_training
docker build -t calamari-fraktur .
```

## Run OCR with Docker

Place line-level PNG files into `input/`, then run:

```powershell
cd Backend\ml_models\calamari_training
docker run --rm -v ${PWD}\input:/app/input -v ${PWD}\output:/app/output calamari-fraktur python inference/predict_lines.py --input-dir /app/input
```

## Run OCR with a Local Virtual Environment

This is optional. Docker is the preferred path.

```powershell
cd Backend\ml_models\calamari_training
py -3.8 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
python .\inference\predict_lines.py --input-dir .\input
```

## Outputs

After a successful run, the runtime writes:

- `output/result.txt`: merged OCR text in line order
- `output/result.json`: structured OCR result for backend integration

Example JSON structure:

```json
{
  "engine": "calamari",
  "model": "fraktur_19th_century",
  "checkpoint_count": 5,
  "lines": [
    {
      "line_id": "0001",
      "image": "input/0001.png",
      "prediction_file": "output/predictions/0001.pred.txt",
      "text": "..."
    }
  ],
  "full_text": "..."
}
```

## Intended Integration

The planned pipeline is:

1. Kraken segments a page into ordered line PNG images.
2. Calamari recognizes each line image.
3. The merged text is written to `result.txt` and `result.json`.
4. The backend reads `result.json` and returns the final text to the frontend.

Calamari should remain an isolated OCR engine. Do not add it to the Django backend environment.

## Notes

- `input/` and `output/` are local working directories for testing.
- Keep model files under `models/`.
- If local Windows installation causes dependency issues, use Docker instead of sharing environments with the backend.

## References

- Calamari OCR on PyPI: https://pypi.org/project/calamari-ocr/
- Calamari command-line usage: https://calamari-ocr.readthedocs.io/en/latest/doc.command-line-usage.html
