# DeepFace Face Recognition Setup

## Installation

### 1. Install Python Dependencies
```bash
cd backend
pip install deepface flask flask-cors
```

### 2. Start DeepFace Server
```bash
python deepface_server.py
```

Server runs on: http://localhost:5000

## API Endpoints

### Verify Face
```
POST /verify
{
  "img1_path": "base64_image_data",
  "img2_path": "database/user@email.com.jpg",
  "model_name": "VGG-Face",
  "detector_backend": "opencv"
}
```

### Find Face
```
POST /find
{
  "img_path": "base64_image_data",
  "model_name": "VGG-Face"
}
```

### Register Face
```
POST /register
{
  "userId": "user@email.com",
  "image": "base64_image_data"
}
```

## How It Works

1. User clicks "Start Camera" in Face Auth tab
2. Webcam stream appears INSIDE circular frame
3. User clicks "Start Verification"
4. System captures frame and sends to DeepFace API
5. DeepFace compares with stored reference image
6. Circle turns GREEN (Verified) or RED (Failed)
7. Result shown for 2 seconds inside circle

## Features

✅ Live webcam inside circular frame
✅ DeepFace API integration
✅ Green circle on success
✅ Red circle on failure
✅ Confidence score display
✅ Liveness detection (blink check)

## Models Available

- VGG-Face (default)
- Facenet
- OpenFace
- DeepFace
- ArcFace
