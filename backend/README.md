# Fish Detection Backend

Minimal FastAPI backend for fish species detection using YOLOv8.

## Requirements

- Python 3.10+
- A YOLOv8 model file at `models/yolov8_fish.pt`

## Setup (Local)

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Windows activation:

```powershell
\venv\Scripts\Activate.ps1
```

```cmd
venv\Scripts\activate.bat
```

Copy environment settings:

```bash
cp .env.example .env
```

Run the API:

```bash
uvicorn app.main:app --reload
```

Open http://localhost:8000/docs.

## Endpoint

`POST /detect`

- Multipart form-data field: `image` (file)
- Optional query params: `target_species`, `expected_part` (eye or skin)

Example response:

```json
{
  "detected_species": "Bangus",
  "detected_part": "eye",
  "confidence": 0.92,
  "is_blurry": false,
  "is_centered": true,
  "blurriness_score": 245.3,
  "ready_for_capture": true,
  "reason": null
}
```

## Docker

```bash
docker build -t fish-detect-backend .
docker run --rm -p 8000:8000 fish-detect-backend
```

## Notes

- The response never returns bounding box coordinates.
- `ready_for_capture` is true only when detection passes all quality checks.
- This project pins CPU-only PyTorch wheels in `requirements.txt` for Windows stability.
