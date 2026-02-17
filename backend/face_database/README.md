# Face Database

Store reference face images here for DeepFace verification.

## File Naming Convention

Use email or user ID as filename:
- `user@email.com.jpg`
- `principal@university.edu.jpg`
- `registrar@university.edu.jpg`

## Image Requirements

- **Format**: JPG or PNG
- **Size**: 640x480 or higher
- **Quality**: Clear, well-lit face photo
- **Face**: Front-facing, no sunglasses
- **Background**: Plain background preferred

## How to Add Users

### Method 1: Manual Upload
1. Take a clear photo of the user's face
2. Save as `{userId}.jpg`
3. Place in this directory

### Method 2: Registration API
```bash
curl -X POST http://localhost:5000/register \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user@email.com",
    "image": "data:image/jpeg;base64,..."
  }'
```

### Method 3: Web Interface (Coming Soon)
Admin panel to register users via webcam capture.

## Sample Users

Create these files for testing:
- `principal@university.edu.jpg` - Principal's face
- `registrar@university.edu.jpg` - Registrar's face
- `hod@university.edu.jpg` - HOD's face

## Security Notes

- Keep this directory secure
- Do not commit to public repositories
- Add to .gitignore
- Backup regularly
