#!/usr/bin/env python3
"""
YOLOv11 Segmentation Training Script
Fish Freshness Detection Project

Usage:
    python scripts/train.py --data /path/to/data.yaml --epochs 100
    python scripts/train.py --data data.yaml --config config/training_config.yaml
    python scripts/train.py --data data.yaml --resume runs/segment/fish_freshness_train
"""

from __future__ import annotations

import argparse
import shutil
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

import yaml

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _load_config(config_path: str | Path | None) -> dict[str, Any]:
    """Load YAML config file and return as dict."""
    if config_path is None:
        return {}
    path = Path(config_path)
    if not path.exists():
        print(f"⚠️  Config file not found: {path}, using defaults.")
        return {}
    with open(path, "r") as f:
        return yaml.safe_load(f) or {}


def _merge_configs(
    defaults: dict[str, Any],
    cli_args: dict[str, Any],
) -> dict[str, Any]:
    """
    Merge configuration with priority:
    CLI args > YAML config > defaults in this script.
    """
    merged: dict[str, Any] = {}

    # Start with YAML config
    for key, value in defaults.items():
        if value is not None:
            merged[key] = value

    # Override with CLI args (only non-None values)
    for key, value in cli_args.items():
        if value is not None:
            merged[key] = value

    return merged


def _copy_best_model(run_dir: Path, output_dir: Path) -> Path | None:
    """Copy best.pt from training run to output directory."""
    best_source = run_dir / "weights" / "best.pt"
    if not best_source.exists():
        print(f"⚠️  best.pt not found at {best_source}")
        return None

    output_dir.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    dest = output_dir / f"best_{timestamp}.pt"
    shutil.copy2(best_source, dest)
    print(f"✅ Best model copied to: {dest}")
    return dest


# ---------------------------------------------------------------------------
# Training
# ---------------------------------------------------------------------------

def train(config: dict[str, Any]) -> None:
    """Run YOLOv11 segmentation training with the given config."""
    # Lazy import so argparse / config parsing works without GPU
    from ultralytics import YOLO

    # ---- Required ----
    data_path = config.get("data")
    if not data_path:
        print("❌ --data is required. Provide a path to data.yaml")
        sys.exit(1)

    model_name = config.get("model", "yolov11n-seg.pt")
    task = config.get("task", "segment")

    # ---- Print run info ----
    print("=" * 60)
    print("🐟 Fish Freshness – YOLOv11 Segmentation Training")
    print("=" * 60)
    print(f"  Model      : {model_name}")
    print(f"  Data       : {data_path}")
    print(f"  Epochs     : {config.get('epochs', 100)}")
    print(f"  Batch      : {config.get('batch', 16)}")
    print(f"  Image size : {config.get('imgsz', 640)}")
    print(f"  Device     : {config.get('device', '0')}")
    print(f"  AMP        : {config.get('amp', True)}")
    print(f"  Patience   : {config.get('patience', 50)}")
    print(f"  Cos LR     : {config.get('cos_lr', True)}")
    print(f"  Mosaic     : {config.get('mosaic', 1.0)}")
    print(f"  Mixup      : {config.get('mixup', 0.2)}")
    print("=" * 60)

    # ---- Load model ----
    resume = config.pop("resume", None)
    if resume:
        print(f"🔄 Resuming from checkpoint: {resume}")
        model = YOLO(resume)
    else:
        model = YOLO(model_name)

    # ---- Build train() kwargs ----
    train_kwargs: dict[str, Any] = {
        "data": data_path,
        "epochs": config.get("epochs", 100),
        "imgsz": config.get("imgsz", 640),
        "batch": config.get("batch", 16),
        "device": config.get("device", "0"),
        "workers": config.get("workers", 8),
        "patience": config.get("patience", 50),
        "amp": config.get("amp", True),

        # Optimizer
        "optimizer": config.get("optimizer", "auto"),
        "lr0": config.get("lr0", 0.01),
        "lrf": config.get("lrf", 0.01),
        "momentum": config.get("momentum", 0.937),
        "weight_decay": config.get("weight_decay", 0.0005),
        "cos_lr": config.get("cos_lr", True),

        # Augmentation
        "hsv_h": config.get("hsv_h", 0.015),
        "hsv_s": config.get("hsv_s", 0.7),
        "hsv_v": config.get("hsv_v", 0.4),
        "degrees": config.get("degrees", 0.0),
        "translate": config.get("translate", 0.1),
        "scale": config.get("scale", 0.5),
        "shear": config.get("shear", 0.0),
        "perspective": config.get("perspective", 0.0),
        "flipud": config.get("flipud", 0.0),
        "fliplr": config.get("fliplr", 0.5),
        "mosaic": config.get("mosaic", 1.0),
        "mixup": config.get("mixup", 0.2),
        "copy_paste": config.get("copy_paste", 0.0),

        # Data loading
        "cache": config.get("cache", False),
        "rect": config.get("rect", False),
        "multi_scale": config.get("multi_scale", False),

        # Saving & logging
        "project": config.get("project", "runs/segment"),
        "name": config.get("name", "fish_freshness_train"),
        "exist_ok": config.get("exist_ok", True),
        "save_period": config.get("save_period", 10),
        "plots": config.get("plots", True),
        "tensorboard": config.get("tensorboard", False),
        "wandb": config.get("wandb", False),
    }

    # ---- Train ----
    results = model.train(**train_kwargs)

    # ---- Copy best model to output/ ----
    run_dir = Path(train_kwargs["project"]) / train_kwargs["name"]
    output_dir = Path("output")
    best_path = _copy_best_model(run_dir, output_dir)

    # ---- Optional: Export model ----
    export_format = config.get("export_format")
    if export_format and best_path:
        print(f"📦 Exporting model to {export_format}...")
        export_model = YOLO(str(best_path))
        export_model.export(format=export_format)
        print(f"✅ Export complete.")

    # ---- Summary ----
    print("\n" + "=" * 60)
    print("🎉 Training Complete!")
    print(f"  Run directory : {run_dir}")
    if best_path:
        print(f"  Best model    : {best_path}")
    print("=" * 60)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Train YOLOv11 segmentation for fish freshness detection.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Basic training
  python scripts/train.py --data /content/dataset/data.yaml --epochs 100

  # Custom config
  python scripts/train.py --data data.yaml --config config/training_config.yaml

  # Override specific params
  python scripts/train.py --data data.yaml --epochs 50 --batch 8 --model yolov11s-seg.pt

  # Resume from checkpoint
  python scripts/train.py --data data.yaml --resume runs/segment/fish_freshness_train/weights/last.pt
        """,
    )

    parser.add_argument(
        "--data",
        type=str,
        default=None,
        help="Path to dataset data.yaml (required).",
    )
    parser.add_argument(
        "--config",
        type=str,
        default=None,
        help="Path to YAML config file with hyperparameters.",
    )
    parser.add_argument(
        "--model",
        type=str,
        default=None,
        help="Pretrained model weights (e.g., yolov11n-seg.pt, yolov11s-seg.pt).",
    )
    parser.add_argument(
        "--epochs",
        type=int,
        default=None,
        help="Number of training epochs.",
    )
    parser.add_argument(
        "--batch",
        type=int,
        default=None,
        help="Batch size.",
    )
    parser.add_argument(
        "--imgsz",
        type=int,
        default=None,
        help="Input image size (pixels).",
    )
    parser.add_argument(
        "--device",
        type=str,
        default=None,
        help="Device: GPU index (0, 1, …) or 'cpu'.",
    )
    parser.add_argument(
        "--resume",
        type=str,
        default=None,
        help="Path to last.pt checkpoint to resume training.",
    )
    parser.add_argument(
        "--patience",
        type=int,
        default=None,
        help="Early stopping patience (epochs without improvement).",
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=None,
        help="DataLoader worker threads.",
    )
    parser.add_argument(
        "--export",
        type=str,
        default=None,
        choices=["onnx", "engine", "tflite", "pb", "paddle", "ncnn"],
        help="Export format after training.",
    )

    return parser.parse_args()


def main() -> None:
    args = parse_args()

    # 1. Load YAML config
    yaml_config = _load_config(args.config)

    # 2. Convert CLI args to dict (ignore None values)
    cli_config = {}
    for key, value in vars(args).items():
        if value is not None:
            # Map --export to export_format for YAML compatibility
            if key == "export":
                cli_config["export_format"] = value
            else:
                cli_config[key] = value

    # 3. Merge: CLI > YAML > defaults
    config = _merge_configs(yaml_config, cli_config)

    # 4. Train
    train(config)


if __name__ == "__main__":
    main()