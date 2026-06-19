# 🐟 Fish Freshness – YOLOv11 Segmentation Training

Train a YOLOv11 segmentation model for fish freshness detection using
[Ultralytics](https://docs.ultralytics.com/) on **Google Colab** (free T4 GPU).

---

## 📁 Project Structure

```
fish_freshness_training/
├── config/
│   └── training_config.yaml   # Hyperparameters & training settings
├── scripts/
│   └── train.py               # Main training script
├── requirements.txt           # Python dependencies (GPU)
└── README.md                  # This file
```

---

## 🚀 Quick Start (Google Colab)

### 1. Open Colab

Go to [https://colab.research.google.com](https://colab.research.google.com)
and create a new notebook. Make sure to select **GPU** under
*Runtime → Change runtime type → T4 GPU*.

### 2. Clone the Repository

```python
!git clone https://github.com/Ronelmelendrez/Fish_Freshness_detectapp.git
%cd Fish_Freshness_detectapp/fish_freshness_training
```

### 3. Install Dependencies

```python
!pip install -r requirements.txt
```

### 4. Download Dataset (Roboflow)

If your dataset is hosted on Roboflow, download it directly:

```python
!pip install roboflow

from roboflow import Roboflow
rf = Roboflow(api_key="YOUR_API_KEY")
project = rf.workspace("YOUR_WORKSPACE").project("YOUR_PROJECT")
version = project.version(YOUR_VERSION)
dataset = version.download("yolov11-segmentation")
```

> The `dataset.location` variable will point to the downloaded folder
> containing `data.yaml`.

### 5. Run Training

```python
!python scripts/train.py \
    --data {dataset.location}/data.yaml \
    --epochs 100 \
    --batch 16 \
    --imgsz 640
```

### 6. Retrieve the Trained Model

After training completes, download `output/best_*.pt`:

```python
from google.colab import files
import glob

best_models = glob.glob("output/best_*.pt")
if best_models:
    files.download(best_models[0])
else:
    print("No best model found – check runs/segment/ for results.")
```

---

## 🖥️ Local / VS Code Setup

### Prerequisites

- Python 3.10+
- NVIDIA GPU with CUDA 11.8+ (for GPU training)
- [Google Colab VS Code Extension](https://marketplace.visualstudio.com/items?itemName=ms-toolsai.colab) (optional, for Colab from VS Code)

### Install

```bash
cd fish_freshness_training
pip install -r requirements.txt
```

### Train

```bash
python scripts/train.py \
    --data /path/to/dataset/data.yaml \
    --epochs 100 \
    --batch 16 \
    --imgsz 640 \
    --device 0
```

---

## 🔗 Connect VS Code to Google Colab

### Method A – Colab Extension (Recommended)

1. Install the **"Google Colab"** extension from the VS Code Marketplace.
2. Create a new `.ipynb` notebook in your project.
3. Run the command **"Colab: Connect to Colab"** from the Command Palette.
4. Sign in with your Google account and select a **T4 GPU** runtime.
5. Execute notebook cells directly on Colab's GPU from VS Code.

> This is the simplest method — no ngrok tokens or SSH setup required.

### Method B – SSH Tunnel via colab-ssh (Advanced)

1. In a Colab notebook, run:

```python
!pip install colab-ssh
from colab_ssh import launch_ssh
launch_ssh('YOUR_NGROK_TOKEN')
```

2. Use the **Remote – SSH** VS Code extension to connect to the tunnel.
3. Run `python scripts/train.py` directly in the Colab terminal.

> Requires a free [ngrok](https://ngrok.com) account and token.

---

## ⚙️ Configuration

### YAML Config File

Edit `config/training_config.yaml` to customize hyperparameters:

```yaml
model: "yolov11n-seg.pt"    # n/s/m/l/x variants
epochs: 100
batch: 16
imgsz: 640
lr0: 0.01                   # Initial learning rate
cos_lr: true                 # Cosine annealing scheduler
patience: 50                 # Early stopping
mosaic: 1.0                  # Mosaic augmentation
mixup: 0.2                   # Mixup augmentation
amp: true                    # Mixed precision (faster on GPU)
save_period: 10              # Checkpoint every 10 epochs
```

### CLI Overrides

Any YAML parameter can be overridden from the command line:

```bash
python scripts/train.py \
    --data data.yaml \
    --config config/training_config.yaml \
    --epochs 50 \
    --batch 8 \
    --model yolov11s-seg.pt
```

### Resume Training

```bash
python scripts/train.py \
    --data data.yaml \
    --resume runs/segment/fish_freshness_train/weights/last.pt
```

---

## 📦 Export Trained Model

Export to ONNX for deployment:

```bash
python scripts/train.py \
    --data data.yaml \
    --resume runs/segment/fish_freshness_train/weights/best.pt \
    --export onnx
```

Or export directly from Python:

```python
from ultralytics import YOLO

model = YOLO("output/best.pt")
model.export(format="onnx")       # ONNX
model.export(format="engine")     # TensorRT
```

---

## 📂 Using the Trained Model

After training, copy `best.pt` into the backend:

```bash
cp output/best_*.pt ../backend/models/best-seg.pt
```

The backend (`app/config.py`) expects the model at `./models/best-seg.pt`.

---

## 🏷️ Class Naming Convention

Labels follow the pattern: **`Species_Part_Freshness`**

| Example Class Name              | Species        | Part | Freshness |
|---------------------------------|----------------|------|-----------|
| Roughear_scad_eye_fresh         | Roughear scad  | eye  | fresh     |
| Roughear_scad_eye_spoiled       | Roughear scad  | eye  | spoiled   |
| Round_scad_skin_fresh           | Round scad     | skin | fresh     |
| Tulingan_skin_spoiled           | Tulingan       | skin | spoiled   |

---

## 📊 Optional: TensorBoard

Enable TensorBoard logging in the config:

```yaml
tensorboard: true
```

Then launch:

```bash
tensorboard --logdir runs/segment
```

---

## 📊 Optional: Weights & Biases

1. Uncomment `wandb>=0.15.0` in `requirements.txt` and install.
2. Set `wandb: true` in `training_config.yaml`.
3. On first run, wandb will prompt for API key (sign up at [wandb.ai](https://wandb.ai)).

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `CUDA out of memory` | Reduce `batch` size (e.g., `--batch 8`) |
| `No module named 'ultralytics'` | Run `pip install -r requirements.txt` |
| Training is slow | Ensure GPU is enabled: Runtime → Change runtime type → T4 GPU |
| `data.yaml not found` | Check the path from `dataset.location` in Colab |
| Model not loading in backend | Ensure file is saved as `backend/models/best-seg.pt` |