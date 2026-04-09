import argparse
import json
import re
import shutil
import subprocess
from pathlib import Path


def natural_sort_key(value: Path):
    parts = re.split(r"(\d+)", value.name)
    return [int(part) if part.isdigit() else part.lower() for part in parts]


def discover_checkpoints(model_dir: Path):
    checkpoints = sorted(
        [path for path in model_dir.iterdir() if path.name.endswith(".ckpt")],
        key=natural_sort_key,
    )
    if not checkpoints:
        raise FileNotFoundError(f"No '*.ckpt' checkpoints found in: {model_dir}")
    return checkpoints


def discover_images(input_dir: Path, glob_pattern: str):
    images = sorted(input_dir.glob(glob_pattern), key=natural_sort_key)
    if not images:
        raise FileNotFoundError(f"No input images matched '{glob_pattern}' in: {input_dir}")
    return images


def ensure_binary_exists(binary_name: str):
    resolved = shutil.which(binary_name)
    if not resolved:
        raise FileNotFoundError(
            f"Could not find '{binary_name}' in PATH. Install Calamari in this environment first."
        )
    return resolved


def build_command(predict_binary, checkpoints, images, output_dir):
    command = [predict_binary, "--checkpoint"]
    command.extend(str(path) for path in checkpoints)
    command.extend(["--data.images"])
    command.extend(str(path) for path in images)
    command.extend(["--output_dir", str(output_dir)])
    return command


def read_prediction_file(output_dir: Path, image_path: Path):
    prediction_path = output_dir / f"{image_path.stem}.pred.txt"
    if not prediction_path.exists():
        return "", str(prediction_path)
    return prediction_path.read_text(encoding="utf-8").strip(), str(prediction_path)


def write_outputs(lines, output_txt: Path, output_json: Path, model_dir: Path, checkpoints):
    full_text = "\n".join(line["text"] for line in lines).strip()
    output_txt.parent.mkdir(parents=True, exist_ok=True)
    output_json.parent.mkdir(parents=True, exist_ok=True)
    output_txt.write_text(full_text, encoding="utf-8")
    payload = {
        "engine": "calamari",
        "model": model_dir.name,
        "checkpoint_count": len(checkpoints),
        "lines": lines,
        "full_text": full_text,
    }
    output_json.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def main():
    script_dir = Path(__file__).resolve().parent
    project_dir = script_dir.parent

    parser = argparse.ArgumentParser(
        description="Run line-level Fraktur OCR with Calamari and merge results into txt/json outputs."
    )
    parser.add_argument("--input-dir", type=Path, required=True)
    parser.add_argument(
        "--model-dir",
        type=Path,
        default=project_dir / "models" / "fraktur_19th_century",
    )
    parser.add_argument("--glob", default="*.png")
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=project_dir / "output" / "predictions",
    )
    parser.add_argument(
        "--output-txt",
        type=Path,
        default=project_dir / "output" / "result.txt",
    )
    parser.add_argument(
        "--output-json",
        type=Path,
        default=project_dir / "output" / "result.json",
    )
    parser.add_argument("--predict-binary", default="calamari-predict")
    args = parser.parse_args()

    input_dir = args.input_dir.resolve()
    model_dir = args.model_dir.resolve()
    output_dir = args.output_dir.resolve()
    output_txt = args.output_txt.resolve()
    output_json = args.output_json.resolve()

    if not input_dir.exists():
        raise FileNotFoundError(f"Input directory does not exist: {input_dir}")
    if not model_dir.exists():
        raise FileNotFoundError(f"Model directory does not exist: {model_dir}")

    binary_path = ensure_binary_exists(args.predict_binary)
    checkpoints = discover_checkpoints(model_dir)
    images = discover_images(input_dir, args.glob)
    output_dir.mkdir(parents=True, exist_ok=True)

    command = build_command(binary_path, checkpoints, images, output_dir)
    subprocess.run(command, check=True)

    lines = []
    for index, image_path in enumerate(images, start=1):
        text, prediction_file = read_prediction_file(output_dir, image_path)
        lines.append(
            {
                "line_id": f"{index:04d}",
                "image": str(image_path),
                "prediction_file": prediction_file,
                "text": text,
            }
        )

    write_outputs(lines, output_txt, output_json, model_dir, checkpoints)

    print(f"Processed {len(images)} line images with model '{model_dir.name}'.")
    print(f"Merged text: {output_txt}")
    print(f"Merged json: {output_json}")


if __name__ == "__main__":
    main()
