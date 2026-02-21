# Face Authentication Setup Guide

## Overview
Face Authentication has been integrated into the Documenso verification section with blink-based liveness detection and face matching capabilities.

## Features Implemented

### 1. Face Capture
- ✅ Live selfie capture using device webcam
- ✅ Real-time video preview with face frame overlay
- ✅ High-quality image capture (640x480)

### 2. Liveness Detection
- ✅ Blink-based liveness check (2 blinks required)
- ✅ Visual feedback with blink counter
- ✅ Frame difference analysis to prevent photo spoofing

### 3. Face Matching
- ✅ Server-side face comparison using embeddings
- ✅ Cosine similarity calculation (threshold: 0.6)
- ✅ Secure embedding storage in local database

### 4. UI Integration
- ✅ Seamlessly integrated into Documenso Verify tab
- ✅ Status indicators (Idle, Capturing, Liveness, Matching, Success, Failed)
- ✅ Retry functionality on verification failure
- ✅ Blocks signing until face is verified

## Architecture

### Frontend Components
```
src/components/FaceAuthentication.tsx
├── Camera capture with webcam access
├── Blink detection UI
├── Status management (idle → capturing → liveness → matching → success/failed)
└── Integration with Documenso verification flow
```

### Backend Services
```
backend/src/routes/faceAuth.ts
├── POST /api/face-auth/verify
│   ├── Fetch stored face embedding from local database
│   ├── Generate embedding from captured image
│   ├── Compare embeddings using cosine similarity
│   └── Log verification attempt
└── Face embedding generation service

backend/src/services/faceRecognition.ts
├── ONNX Runtime integration
├── InsightFace/FaceNet model support
├── Image preprocessing (resize, normalize)
├── Embedding generation (128-512 dimensions)
└── Liveness detection
```

### Database Schema
```sql
user_profiles
├── id (TEXT, PRIMARY KEY)
├── email (TEXT, UNIQUE)
├── name (TEXT)
├── face_embedding (FLOAT8[]) -- Encrypted embedding vector
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

face_auth_logs
├── id (UUID, PRIMARY KEY)
├── user_id (TEXT, FOREIGN KEY)
├── matched (BOOLEAN)
├── similarity_score (FLOAT8)
├── timestamp (TIMESTAMP)
├── ip_address (TEXT)
└── user_agent (TEXT)
```

## Setup Instructions

### 1. Install Dependencies

```bash
# Frontend
npm install

# Backend
cd backend
npm install onnxruntime-node sharp
```

### 2. Download Face Recognition Model

Download a pre-trained FaceNet or InsightFace model:

```bash
# Option 1: FaceNet (Recommended)
wget https://github.com/nyoki-mtl/keras-facenet/releases/download/v0.1/facenet_keras.h5
# Convert to ONNX format using keras2onnx

# Option 2: InsightFace
# Download from: https://github.com/deepinsight/insightface/tree/master/model_zoo
```

Place the model file in `backend/models/facenet.onnx`

### 3. Configure Database

The face authentication data schema is initialized automatically through the application's local data store. The required data structures (`user_profiles` and `face_auth_logs`) are created on first use.

### 4. Environment Variables

Add to `.env`:

```env
# Face Recognition
FACE_MODEL_PATH=./models/facenet.onnx
FACE_SIMILARITY_THRESHOLD=0.6
```

### 5. Register Backend Route

In `backend/src/index.ts`:

```typescript
import faceAuthRouter from './routes/faceAuth';

app.use('/api/face-auth', faceAuthRouter);
```

## Usage Flow

### 1. User Registration (One-time)
```typescript
// Capture user's face during registration
const faceImage = await captureUserFace();
const embedding = await generateEmbedding(faceImage);

// Store encrypted embedding in local database
await userProfilesStore.insert({
  id: userId,
  email: userEmail,
  name: userName,
  face_embedding: embedding
});
```

### 2. Document Signing Verification
```typescript
// In Documenso Verify tab
1. User clicks "Start Face Verification"
2. Camera activates → captures live video
3. User clicks "Capture & Verify"
4. Liveness check → prompts user to blink twice
5. Captures frame → sends to backend
6. Backend compares with stored embedding
7. Returns match result (success/failed)
8. If verified → enables "Complete Signing" button
9. If failed → shows retry option
```

## Security Features

### 1. Encrypted Storage
- Face embeddings stored as encrypted vectors (not raw images)
- Only embedding vectors transmitted over network
- No raw face images stored in database

### 2. Liveness Detection
- Blink-based challenge prevents photo spoofing
- Frame difference analysis detects video replay attacks
- Real-time capture required (no pre-recorded videos)

### 3. Audit Trail
- All verification attempts logged in `face_auth_logs`
- Includes timestamp, similarity score, and match result
- IP address and user agent tracking

### 4. Row Level Security
- Application-level access control policies enforce user data isolation
- Users can only access their own profile and logs

## Model Integration Options

### Option 1: InsightFace (Recommended)
```bash
pip install insightface onnx
python -m insightface.model_zoo.get_model arcface_r100_v1
```

### Option 2: FaceNet
```bash
pip install facenet-pytorch
# Use pre-trained model from: https://github.com/timesler/facenet-pytorch
```

### Option 3: Custom Model
- Train your own model using TensorFlow/PyTorch
- Convert to ONNX format for Node.js compatibility
- Ensure output is normalized embedding vector (128-512 dims)

## Testing

### Test Face Verification
```bash
curl -X POST http://localhost:3000/api/face-auth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user@example.com",
    "capturedImage": "data:image/jpeg;base64,..."
  }'
```

### Expected Response
```json
{
  "matched": true,
  "similarity": 0.87,
  "message": "Face verified successfully"
}
```

## Troubleshooting

### Camera Not Working
- Check browser permissions (chrome://settings/content/camera)
- Ensure HTTPS connection (required for getUserMedia)
- Test with different browsers

### Low Similarity Scores
- Adjust threshold in `faceAuth.ts` (default: 0.6)
- Ensure good lighting during capture
- Verify model is loaded correctly

### Model Loading Errors
- Check model path in environment variables
- Ensure ONNX Runtime is installed correctly
- Verify model format compatibility

## Performance Optimization

### 1. Model Optimization
- Use quantized models for faster inference
- Consider edge deployment (TensorFlow Lite)
- Cache embeddings for repeat verifications

### 2. Image Processing
- Resize images before transmission
- Use JPEG compression (quality: 80)
- Implement client-side preprocessing

### 3. Database Optimization
- Index on user_id for fast lookups
- Partition logs table by timestamp
- Archive old verification logs

## Future Enhancements

- [ ] Multi-factor authentication (Face + PIN)
- [ ] Anti-spoofing with depth detection
- [ ] Support for multiple registered faces
- [ ] Real-time face tracking during signing
- [ ] Passive liveness detection (no blink required)
- [ ] Integration with hardware security modules

## References

- InsightFace: https://github.com/deepinsight/insightface
- FaceNet: https://github.com/davidsandberg/facenet
- ONNX Runtime: https://onnxruntime.ai/
