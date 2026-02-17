import { Request, Response } from 'express';
import { GoogleDriveService } from '../services/googleDriveService';
import { ApiResponse } from '../types';

export async function uploadFile(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided'
      } as ApiResponse);
    }

    const result = await GoogleDriveService.uploadFile(
      req.file.originalname,
      req.file.buffer,
      req.file.mimetype
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      } as ApiResponse);
    }

    return res.json({
      success: true,
      data: result.data
    } as ApiResponse);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'File upload failed'
    } as ApiResponse);
  }
}