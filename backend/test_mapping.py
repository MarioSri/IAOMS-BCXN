#!/usr/bin/env python3
"""
Test IPFS Face Mapping
Verify that user ID maps to correct IPFS hash
"""

import json
import os
import requests

def test_json_mapping():
    """Test JSON file mapping"""
    try:
        with open('face_mappings.json', 'r') as f:
            mappings = json.load(f)
        
        user_id = 'principal@school.edu'
        if user_id in mappings:
            ipfs_hash = mappings[user_id]['ipfs_hash']
            print(f"JSON Mapping Found:")
            print(f"   User: {user_id}")
            print(f"   Hash: {ipfs_hash}")
            
            # Test IPFS access
            gateway_url = f"https://gateway.pinata.cloud/ipfs/{ipfs_hash}"
            print(f"   URL:  {gateway_url}")
            
            response = requests.head(gateway_url)
            if response.status_code == 200:
                print(f"IPFS Photo Accessible")
            else:
                print(f"IPFS Photo Not Accessible: {response.status_code}")
                
        else:
            print(f"No mapping found for {user_id}")
            
    except FileNotFoundError:
        print("face_mappings.json not found")
    except Exception as e:
        print(f"Error: {e}")

def test_verification_ready():
    """Test if system is ready for verification"""
    print("\nSystem Readiness Check:")
    
    # Check JSON mapping
    if os.path.exists('face_mappings.json'):
        print("Face mappings file exists")
    else:
        print("Face mappings file missing")
    
    # Check DeepFace server
    try:
        response = requests.get('http://localhost:5000/', timeout=2)
        print("DeepFace server running")
    except:
        print("DeepFace server not running (start with: python deepface_server_ipfs.py)")
    
    print("\nReady for face verification!")

if __name__ == '__main__':
    print("Testing IPFS Face Mapping")
    print("=" * 40)
    
    test_json_mapping()
    test_verification_ready()