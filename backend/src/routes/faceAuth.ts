import express from 'express';
import { pinataStorage } from '../services/pinataService';
import { faceDatabase } from '../services/faceDatabase';
import axios from 'axios';

const router = express.Router();

router.post('/verify', async (req, res) => {
  try {
    const { userId, capturedImage } = req.body;

    if (!userId || !capturedImage) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const ipfsHash = await faceDatabase.getFaceHash(userId);
    if (!ipfsHash) {
      return res.status(404).json({ error: 'No face data found for user' });
    }

    const deepfaceResponse = await axios.post('http://localhost:5000/verify', {
      img1_path: capturedImage,
      user_id: userId,
      model_name: 'VGG-Face',
      detector_backend: 'opencv'
    });

    const { verified, distance, threshold } = deepfaceResponse.data;

    console.log(`[FaceAuth Log] User: ${userId}, Verified: ${verified}, Distance: ${distance}`);

    return res.json({
      verified,
      distance,
      threshold,
      ipfsHash,
      message: verified ? 'Face verified successfully' : 'Face verification failed'
    });
  } catch (error) {
    console.error('Face verification error:', error);
    return res.status(500).json({ error: 'Face verification failed' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { userId, imageData } = req.body;

    if (!userId || !imageData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    const ipfsHash = await pinataStorage.uploadFaceImage(userId, imageBuffer);

    await faceDatabase.storeFaceMapping(userId, ipfsHash);

    return res.json({
      success: true,
      message: `Face registered for user ${userId}`,
      ipfsHash,
      gatewayUrl: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`
    });
  } catch (error) {
    console.error('Face registration error:', error);
    return res.status(500).json({ error: 'Face registration failed' });
  }
});

router.get('/list', async (req, res) => {
  try {
    const faces = await faceDatabase.getAllFaceMappings();
    res.json({
      success: true,
      faces
    });
  } catch (error) {
    console.error('List faces error:', error);
    res.status(500).json({ error: 'Failed to list faces' });
  }
});

router.delete('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const ipfsHash = await faceDatabase.getFaceHash(userId);

    if (ipfsHash) {
      await pinataStorage.deleteFaceImage(ipfsHash);
    }

    await faceDatabase.deleteFaceMapping(userId);

    res.json({
      success: true,
      message: `Face data deleted for user ${userId}`
    });
  } catch (error) {
    console.error('Delete face error:', error);
    res.status(500).json({ error: 'Failed to delete face data' });
  }
});

export default router;
