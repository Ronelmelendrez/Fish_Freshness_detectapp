# Fishdectapp Backend

AI-powered fish freshness detection backend using FastAPI and YOLOv11-seg.

## Setup

### 1. Create Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

### 4. Add Model File

Place your trained `best.pt` model file in the `models/` directory.

### 5. Run the Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

### Health Check

```
GET /health
```

Response:
```json
{
  "status": "healthy"
}
```

### Detect Fish Freshness

```
POST /api/v1/detect
```

Query Parameters:
- `target_species` (optional): Expected fish species (e.g., "Roughear_scad", "striped_red_mullet")
- `expected_part` (optional): Expected part to scan ("eye" or "skin")

Request Body:
- `image`: Multipart form data with the fish image

Response:
```json
{
  "detected_species": "Roughear_scad",
  "detected_part": "eye",
  "freshness": "fresh",
  "confidence": 0.92,
  "is_blurry": false,
  "is_centered": true,
  "blurriness_score": 245.3,
  "ready_for_capture": true,
  "reason": null
}
```

## Docker

### Build Image

```bash
docker build -t fishdectapp-backend .
```

### Run Container

```bash
docker run -p 8000:8000 fishdectapp-backend
```

## Model Classes (12)

The model should be trained with these 12 classes:

1. Roughear_scad_eye_fresh
2. Roughear_scad_eye_spoiled
3. Bigeye_scad_eye_fresh
4. Bigeye_scad_eye_spoiled
5. striped_red_mullet_eye_fresh
6. striped_red_mullet_eye_spoiled
7. Roughear_scad_skin_fresh
8. Roughear_scad_skin_spoiled
9. Bigeye_scad_skin_fresh
10. Bigeye_scad_skin_spoiled
11. striped_red_mullet_skin_fresh
12. striped_red_mullet_skin_spoiled

## Auto-Capture Conditions

The `ready_for_capture` flag is `true` when:

- ✅ Species matches target (if provided)
- ✅ Part matches expected (if provided)
- ✅ Confidence ≥ 0.8
- ✅ Image is not blurry
- ✅ Fish is centered in frame