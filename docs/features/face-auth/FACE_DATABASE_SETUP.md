# Face Database Setup Guide

## ✅ Database Created

Location: `backend/face_database/`

## How to Add Users

### Method 1: Registration Tool (Recommended)

```bash
cd backend
python register_user.py principal@university.edu
```

**Steps:**
1. Script opens webcam
2. Position face in frame
3. Press SPACE to capture
4. Image saved as `principal@university.edu.jpg`

### Method 2: Manual Upload

1. Take a clear photo of user's face
2. Save as `{userId}.jpg`
3. Copy to `backend/face_database/`

**Example:**
```
backend/face_database/
  principal@university.edu.jpg
  registrar@university.edu.jpg
  hod@university.edu.jpg
```

### Method 3: API Registration

```bash
curl -X POST http://localhost:5000/register \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user@email.com",
    "image": "data:image/jpeg;base64,/9j/4AAQ..."
  }'
```

## Image Requirements

✅ **Format**: JPG or PNG
✅ **Size**: 640x480 minimum
✅ **Quality**: Clear, well-lit
✅ **Face**: Front-facing, no sunglasses
✅ **Background**: Plain preferred

## Test Users

Create these for testing:

```bash
python register_user.py principal@university.edu
python register_user.py registrar@university.edu
python register_user.py hod@university.edu
```

## Verify Database

```bash
cd backend/face_database
dir  # Windows
ls   # Linux/Mac
```

Should see:
```
principal@university.edu.jpg
registrar@university.edu.jpg
hod@university.edu.jpg
```

## Security

- ✅ `.gitignore` added (images not committed)
- ✅ Private directory
- ⚠️ Backup regularly
- ⚠️ Keep secure

## Usage in App

1. User opens Face Auth tab
2. Clicks "Start Camera"
3. Clicks "Start Verification"
4. DeepFace compares with `{userId}.jpg`
5. Circle turns GREEN (match) or RED (no match)

## Troubleshooting

**No face detected:**
- Ensure good lighting
- Face camera directly
- Remove sunglasses

**Registration failed:**
- Check webcam permissions
- Install opencv: `pip install opencv-python`
- Try different camera: `cv2.VideoCapture(1)`

**Verification failed:**
- Ensure reference image exists
- Check filename matches userId
- Verify image quality
