#!/usr/bin/env python3
"""
Face Registration Tool
Capture face from webcam and save to database
"""

import cv2
import os
import sys

DATABASE_DIR = 'face_database'

def capture_face(user_id):
    """Capture face from webcam and save to database"""
    
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
        gray = cv2.cv2tColor(frame, cv2.COLOR_BGR2GRAY)
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
        cv2.imshow('Face Registration', frame)
        
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
            
            # Save image
            filename = os.path.join(DATABASE_DIR, f'{user_id}.jpg')
            cv2.imwrite(filename, frame)
            
            print(f"\n✅ Face registered successfully!")
            print(f"📁 Saved to: {filename}")
            
            cap.release()
            cv2.destroyAllWindows()
            return True
    
    cap.release()
    cv2.destroyAllWindows()
    return False

def main():
    """Main function"""
    
    # Create database directory if not exists
    os.makedirs(DATABASE_DIR, exist_ok=True)
    
    # Get user ID
    if len(sys.argv) > 1:
        user_id = sys.argv[1]
    else:
        user_id = input("Enter user ID (email): ").strip()
    
    if not user_id:
        print("❌ Error: User ID is required")
        return
    
    # Check if user already exists
    filename = os.path.join(DATABASE_DIR, f'{user_id}.jpg')
    if os.path.exists(filename):
        overwrite = input(f"⚠️  User {user_id} already exists. Overwrite? (y/n): ")
        if overwrite.lower() != 'y':
            print("❌ Registration cancelled")
            return
    
    # Capture face
    success = capture_face(user_id)
    
    if success:
        print("\n🎉 Registration complete!")
        print(f"User {user_id} can now use face authentication")
    else:
        print("\n❌ Registration failed")

if __name__ == '__main__':
    main()
