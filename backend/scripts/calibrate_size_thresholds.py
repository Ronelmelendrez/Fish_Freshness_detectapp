from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image


def _load_coco_bbox_areas(path: Path, class_id: int | None) -> list[float]:
    data = json.loads(path.read_text())
    areas = []
    for ann in data.get("annotations", []):
        if class_id is not None and ann.get("category_id") != class_id:
            continue
        bbox = ann.get("bbox")
        if not bbox or len(bbox) != 4:
            continue
        _, _, w, h = bbox
        areas.append(float(w) * float(h))
    return areas


def _load_yolo_bbox_areas(label_dir: Path, image_dir: Path, class_id: int | None) -> list[float]:
    areas = []
    for label_path in label_dir.glob("*.txt"):
        image_path = image_dir / f"{label_path.stem}.jpg"
        if not image_path.exists():
            image_path = image_dir / f"{label_path.stem}.png"
        if not image_path.exists():
            continue

        with Image.open(image_path) as img:
            width, height = img.size

        for line in label_path.read_text().strip().splitlines():
            parts = line.split()
            if len(parts) < 5:
                continue
            cls_id = int(parts[0])
            if class_id is not None and cls_id != class_id:
                continue
            w = float(parts[3]) * width
            h = float(parts[4]) * height
            areas.append(w * h)
    return areas


def _summarize(areas: list[float]) -> None:
    if not areas:
        raise SystemExit("No areas found. Check dataset paths or class id.")

    arr = np.array(areas, dtype=float)
    mean = float(arr.mean())
    std = float(arr.std())
    min_area = float(mean - std)
    max_area = float(mean + std)

    print(f"samples={len(areas)}")
    print(f"mean={mean:.2f}")
    print(f"std={std:.2f}")
    print(f"suggested_min={min_area:.2f}")
    print(f"suggested_max={max_area:.2f}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Calibrate size thresholds from dataset.")
    parser.add_argument("--coco-json", type=Path, help="Path to COCO annotations.json")
    parser.add_argument("--yolo-labels", type=Path, help="Path to YOLO label .txt files")
    parser.add_argument("--images", type=Path, help="Path to images folder (for YOLO)")
    parser.add_argument("--class-id", type=int, help="Optional class id filter")

    args = parser.parse_args()

    if args.coco_json:
        areas = _load_coco_bbox_areas(args.coco_json, args.class_id)
        _summarize(areas)
        return

    if args.yolo_labels and args.images:
        areas = _load_yolo_bbox_areas(args.yolo_labels, args.images, args.class_id)
        _summarize(areas)
        return

    raise SystemExit("Provide --coco-json or both --yolo-labels and --images")


if __name__ == "__main__":
    main()
