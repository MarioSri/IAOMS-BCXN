from flask import Flask, request, jsonify
from flask_cors import CORS
from deepface import DeepFace
import base64
import os
import tempfile
import requests
import json

app = Flask(__name__)
CORS(app)

# Pinata Configuration
PINATA_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJhYzkyYTIyZS0yZWIyLTRjODctYmE5ZC05M2U4ODlhNTkwMWIiLCJlbWFpbCI6ImNoYWl0YW55YWRhbmR1MDRAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjMxODc4OTZlN2E1NGRmNWZjZmQyIiwic2NvcGVkS2V5U2VjcmV0IjoiMmVmZDc0MWFmNmM1MjViMjEyN2Y0OWIyYTk1Mzc2ODY4OGQzMDE2NDU4NGNkYjMzZWYwMjc1NzJlMjJkNDc2ZiIsImV4cCI6MTc5NDQyMDQ0Nn0.2CNUVHWCSM5s1Up6WNKt6YBvebNQM6smR6eNw53owHs'

def get_face_hash(user_id):
    """Get IPFS hash for user from mapping file"""
    try:
        mapping_file = 'face_mappings.json'
        if os.path.exists(mapping_file):
            with open(mapping_file, 'r') as f:
                mappings = json.load(f)
            return mappings.get(user_id, {}).get('ipfs_hash')
        return None
    except Exception as e:
        print(f"❌ Error getting face hash: {e}")
        return None

def download_from_ipfs(ipfs_hash):
    """Download face image from Pinata IPFS"""
    try:
        response = requests.get(f'https://gateway.pinata.cloud/ipfs/{ipfs_hash}')
        if response.status_code == 200:
            return response.content
        return None
    except Exception as e:
        print(f"❌ Error downloading from IPFS: {e}")
        return None

def upload_to_ipfs(user_id, image_data):
    """Upload face image to Pinata IPFS"""
    try:
        files = {
            'file': (f'{user_id}.jpg', image_data, 'image/jpeg')
        }
        
        metadata = {
            'name': f'Face-{user_id}',
            'keyvalues': {
                'userId': user_id,
                'type': 'face_recognition'
            }
        }
        
        data = {
            'pinataMetadata': json.dumps(metadata)
        }
        
        response = requests.post(
            'https://api.pinata.cloud/pinning/pinFileToIPFS',
            files=files,
            data=data,
            headers={'Authorization': f'Bearer {PINATA_JWT}'}
        )
        
        if response.status_code == 200:
            return response.json()['IpfsHash']
        return None
    except Exception as e:
        print(f"❌ Error uploading to IPFS: {e}")
        return None

def store_face_mapping(user_id, ipfs_hash):
    """Store user ID to IPFS hash mapping"""
    try:
        mapping_file = 'face_mappings.json'
        
        if os.path.exists(mapping_file):
            with open(mapping_file, 'r') as f:
                mappings = json.load(f)
        else:
            mappings = {}
        
        mappings[user_id] = {
            'ipfs_hash': ipfs_hash,
            'timestamp': '2024-01-16'
        }
        
        with open(mapping_file, 'w') as f:
            json.dump(mappings, f, indent=2)
        
        return True
    except Exception as e:
        print(f"❌ Error storing mapping: {e}")
        return False

@app.route('/verify', methods=['POST'])
def verify_face():
    """Verify face using DeepFace with IPFS storage"""
    try:
        data = request.json
        img1_data = data.get('img1_path')  # Base64 captured image
        user_id = data.get('user_id')      # User ID to verify against
        model_name = data.get('model_name', 'VGG-Face')
        detector_backend = data.get('detector_backend', 'opencv')
        
        # Get IPFS hash for user
        ipfs_hash = get_face_hash(user_id)
        if not ipfs_hash:
            return jsonify({
                'error': f'No face data found for user {user_id}',
                'verified': False
            }), 404
        
        # Download reference image from IPFS
        reference_image = download_from_ipfs(ipfs_hash)
        if not reference_image:
            return jsonify({
                'error': 'Failed to download reference image from IPFS',
                'verified': False
            }), 500
        
        # Decode base64 live image
        if img1_data.startswith('data:image'):
            img1_data = img1_data.split(',')[1]
        img1_bytes = base64.b64decode(img1_data)
        
        # Save both images to temp files
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as live_tmp:
            live_tmp.write(img1_bytes)
            live_path = live_tmp.name
        
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as ref_tmp:
            ref_tmp.write(reference_image)
            ref_path = ref_tmp.name
        
        try:
            # Perform face verification
            result = DeepFace.verify(
                img1_path=live_path,
                img2_path=ref_path,
                model_name=model_name,
                detector_backend=detector_backend
            )
            
            return jsonify({
                'verified': result['verified'],
                'distance': result['distance'],
                'threshold': result['threshold'],
                'model': model_name,
                'ipfs_hash': ipfs_hash
            })
        finally:
            # Clean up temp files
            os.unlink(live_path)
            os.unlink(ref_path)
            
    except Exception as e:
        return jsonify({
            'error': str(e),
            'verified': False
        }), 500

@app.route('/register', methods=['POST'])
def register_face():
    """Register new face in IPFS"""
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
        
        # Upload to IPFS
        ipfs_hash = upload_to_ipfs(user_id, img_bytes)
        if not ipfs_hash:
            return jsonify({
                'error': 'Failed to upload to IPFS',
                'success': False
            }), 500
        
        # Store mapping
        if not store_face_mapping(user_id, ipfs_hash):
            return jsonify({
                'error': 'Failed to store mapping',
                'success': False
            }), 500
        
        return jsonify({
            'success': True,
            'message': f'Face registered for user {user_id}',
            'ipfs_hash': ipfs_hash,
            'gateway_url': f'https://gateway.pinata.cloud/ipfs/{ipfs_hash}'
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

@app.route('/list_faces', methods=['GET'])
def list_faces():
    """List all registered faces"""
    try:
        mapping_file = 'face_mappings.json'
        if os.path.exists(mapping_file):
            with open(mapping_file, 'r') as f:
                mappings = json.load(f)
            return jsonify({
                'success': True,
                'faces': mappings
            })
        else:
            return jsonify({
                'success': True,
                'faces': {}
            })
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

if __name__ == '__main__':
    print('🚀 DeepFace IPFS API Server starting...')
    print('🔗 Using Pinata IPFS for face storage')
    app.run(host='0.0.0.0', port=5000, debug=True)