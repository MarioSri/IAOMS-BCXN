#!/usr/bin/env python3
"""
Face Registration Tool with Pinata IPFS Storage
Capture face from webcam and save to Pinata IPFS
"""

import cv2
import os
import sys
import base64
import requests
import json
from io import BytesIO

# Pinata Configuration
PINATA_API_KEY = '3187896e7a54df5fcfd2'
PINATA_SECRET_KEY = '2efd741af6c525b2127f49b2a953768688d30164584cdb33ef027572e22d476f'
PINATA_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJhYzkyYTIyZS0yZWIyLTRjODctYmE5ZC05M2U4ODlhNTkwMWIiLCJlbWFpbCI6ImNoYWl0YW55YWRhbmR1MDRAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjMxODc4OTZlN2E1NGRmNWZjZmQyIiwic2NvcGVkS2V5U2VjcmV0IjoiMmVmZDc0MWFmNmM1MjViMjEyN2Y0OWIyYTk1Mzc2ODY4OGQzMDE2NDU4NGNkYjMzZWYwMjc1NzJlMjJkNDc2ZiIsImV4cCI6MTc5NDQyMDQ0Nn0.2CNUVHWCSM5s1Up6WNKt6YBvebNQM6smR6eNw53owHs'

def upload_to_pinata(user_id, image_data):
    """Upload face image to Pinata IPFS"""
    try:
        # Prepare file data
        files = {
            'file': (f'{user_id}.jpg', image_data, 'image/jpeg')
        }
        
        # Prepare metadata
        metadata = {
            'name': f'Face-{user_id}',
            'keyvalues': {
                'userId': user_id,
                'type': 'face_recognition',
                'timestamp': '2024-01-16'
            }
        }
        
        data = {
            'pinataMetadata': json.dumps(metadata)
        }
        
        # Upload to Pinata
        response = requests.post(
            'https://api.pinata.cloud/pinning/pinFileToIPFS',
            files=files,
            data=data,
            headers={
                'Authorization': f'Bearer {PINATA_JWT}'
            }
        )
        
        if response.status_code == 200:
            result = response.json()
            ipfs_hash = result['IpfsHash']
            print(f"✅ Uploaded to IPFS: {ipfs_hash}")
            return ipfs_hash
        else:
            print(f"❌ Upload failed: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Upload error: {e}")
        return None

def store_face_mapping(user_id, ipfs_hash):
    """Store user ID to IPFS hash mapping"""
    try:
        # For now, store in local JSON file
        # In production, this would be stored in Supabase
        mapping_file = 'face_mappings.json'
        
        # Load existing mappings
        if os.path.exists(mapping_file):
            with open(mapping_file, 'r') as f:
                mappings = json.load(f)
        else:
            mappings = {}
        
        # Add new mapping
        mappings[user_id] = {
            'ipfs_hash': ipfs_hash,
            'timestamp': '2024-01-16'
        }
        
        # Save mappings
        with open(mapping_file, 'w') as f:
            json.dump(mappings, f, indent=2)
        
        print(f"✅ Mapping stored: {user_id} → {ipfs_hash}")
        return True
        
    except Exception as e:
        print(f"❌ Mapping error: {e}")
        return False

def capture_face(user_id):
    """Capture face from webcam and save to IPFS"""
    
    # Initialize webcam
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("❌ Error: Cannot access webcam")
        return False
    
    print(f"\n📸 Face Registration for: {user_id}")
    print("=" * 50)
    print("Instructions:")
    print("  • Look directly at the camera")
    print("  • Ensure good lighting")
    print("  • Press SPACE to capture")
    print("  • Press ESC to cancel")
    print("=" * 50)
    
    # Load face detector
    face_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    )
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        # Flip frame for mirror effect
        frame = cv2.flip(frame, 1)
        
        # Detect faces
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.3, 5)
        
        # Draw rectangle around faces
        for (x, y, w, h) in faces:
            cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
            cv2.putText(frame, "Face Detected", (x, y-10), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
        
        # Display instructions
        cv2.putText(frame, "Press SPACE to capture", (10, 30), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        cv2.putText(frame, "Press ESC to cancel", (10, 60), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        
        # Show frame
        cv2.imshow('Face Registration - IPFS', frame)
        
        # Handle key press
        key = cv2.waitKey(1) & 0xFF
        
        if key == 27:  # ESC
            print("\n❌ Registration cancelled")
            cap.release()
            cv2.destroyAllWindows()
            return False
        
        elif key == 32:  # SPACE
            if len(faces) == 0:
                print("⚠️  No face detected. Please try again.")
                continue
            
            # Convert frame to JPEG bytes
            _, buffer = cv2.imencode('.jpg', frame)
            image_data = BytesIO(buffer)
            
            print("\n📤 Uploading to Pinata IPFS...")
            
            # Upload to Pinata
            ipfs_hash = upload_to_pinata(user_id, image_data)
            
            if ipfs_hash:
                # Store mapping
                if store_face_mapping(user_id, ipfs_hash):
                    print(f"\n✅ Face registered successfully!")
                    print(f"🔗 IPFS Hash: {ipfs_hash}")
                    print(f"🌐 Gateway URL: https://gateway.pinata.cloud/ipfs/{ipfs_hash}")
                    
                    cap.release()
                    cv2.destroyAllWindows()
                    return True
                else:
                    print("\n❌ Failed to store mapping")
            else:
                print("\n❌ Failed to upload to IPFS")
    
    cap.release()
    cv2.destroyAllWindows()
    return False

def main():
    """Main function"""
    
    # Get user ID
    if len(sys.argv) > 1:
        user_id = sys.argv[1]
    else:
        user_id = input("Enter user ID (email): ").strip()
    
    if not user_id:
        print("❌ Error: User ID is required")
        return
    
    # Check if user already exists
    mapping_file = 'face_mappings.json'
    if os.path.exists(mapping_file):
        with open(mapping_file, 'r') as f:
            mappings = json.load(f)
        
        if user_id in mappings:
            overwrite = input(f"⚠️  User {user_id} already exists. Overwrite? (y/n): ")
            if overwrite.lower() != 'y':
                print("❌ Registration cancelled")
                return
    
    # Capture face
    success = capture_face(user_id)
    
    if success:
        print("\n🎉 Registration complete!")
        print(f"User {user_id} can now use face authentication")
        print("Face data is stored on IPFS blockchain")
    else:
        print("\n❌ Registration failed")

if __name__ == '__main__':
    main()