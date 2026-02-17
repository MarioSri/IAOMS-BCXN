from flask import Flask, request, jsonify
from flask_cors import CORS
from deepface import DeepFace
import base64
import os
import tempfile

app = Flask(__name__)
CORS(app)

# Database directory for storing reference face images
DATABASE_DIR = 'face_database'
os.makedirs(DATABASE_DIR, exist_ok=True)

@app.route('/verify', methods=['POST'])
def verify_face():
    """Verify face using DeepFace"""
    try:
        data = request.json
        img1_data = data.get('img1_path')  # Base64 captured image
        img2_path = data.get('img2_path')  # Path to reference image
        model_name = data.get('model_name', 'VGG-Face')
        detector_backend = data.get('detector_backend', 'opencv')
        
        # Decode base64 image
        if img1_data.startswith('data:image'):
            img1_data = img1_data.split(',')[1]
        
        img1_bytes = base64.b64decode(img1_data)
        
        # Save to temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp:
            tmp.write(img1_bytes)
            tmp_path = tmp.name
        
        try:
            # Perform face verification
            result = DeepFace.verify(
                img1_path=tmp_path,
                img2_path=img2_path,
                model_name=model_name,
                detector_backend=detector_backend
            )
            
            return jsonify({
                'verified': result['verified'],
                'distance': result['distance'],
                'threshold': result['threshold'],
                'model': model_name
            })
        finally:
            # Clean up temp file
            os.unlink(tmp_path)
            
    except Exception as e:
        return jsonify({
            'error': str(e),
            'verified': False
        }), 500

@app.route('/find', methods=['POST'])
def find_face():
    """Find matching face in database"""
    try:
        data = request.json
        img_data = data.get('img_path')
        model_name = data.get('model_name', 'VGG-Face')
        
        # Decode base64 image
        if img_data.startswith('data:image'):
            img_data = img_data.split(',')[1]
        
        img_bytes = base64.b64decode(img_data)
        
        # Save to temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp:
            tmp.write(img_bytes)
            tmp_path = tmp.name
        
        try:
            # Find face in database
            result = DeepFace.find(
                img_path=tmp_path,
                db_path=DATABASE_DIR,
                model_name=model_name
            )
            
            if len(result) > 0 and len(result[0]) > 0:
                match = result[0].iloc[0]
                return jsonify({
                    'found': True,
                    'identity': match['identity'],
                    'distance': float(match['distance'])
                })
            else:
                return jsonify({'found': False})
                
        finally:
            os.unlink(tmp_path)
            
    except Exception as e:
        return jsonify({
            'error': str(e),
            'found': False
        }), 500

@app.route('/register', methods=['POST'])
def register_face():
    """Register new face in database"""
    try:
        data = request.json
        user_id = data.get('userId')
        img_data = data.get('image')
        
        if not user_id or not img_data:
            return jsonify({'error': 'Missing userId or image'}), 400
        
        # Decode base64 image
        if img_data.startswith('data:image'):
            img_data = img_data.split(',')[1]
        
        img_bytes = base64.b64decode(img_data)
        
        # Save to database
        img_path = os.path.join(DATABASE_DIR, f'{user_id}.jpg')
        with open(img_path, 'wb') as f:
            f.write(img_bytes)
        
        return jsonify({
            'success': True,
            'message': f'Face registered for user {user_id}'
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

if __name__ == '__main__':
    print('🚀 DeepFace API Server starting...')
    print(f'📁 Face database directory: {os.path.abspath(DATABASE_DIR)}')
    app.run(host='0.0.0.0', port=5000, debug=True)
