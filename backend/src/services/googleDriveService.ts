import { google } from 'googleapis';
import { Readable } from 'stream';

const drive = google.drive({
  version: 'v3',
  auth: process.env.GOOGLE_API_KEY
});

export class GoogleDriveService {
  static async uploadFile(fileName: string, fileBuffer: Buffer, mimeType: string) {
    try {
      const fileMetadata = {
        name: fileName,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID!]
      };

      const media = {
        mimeType,
        body: Readable.from(fileBuffer)
      };

      const response = await drive.files.create({
        requestBody: fileMetadata,
        media,
        fields: 'id,name,webViewLink'
      });

      return {
        success: true,
        data: {
          id: response.data.id,
          name: response.data.name,
          url: response.data.webViewLink
        }
      };
    } catch (error) {
      console.error('Google Drive upload error:', error);
      return { success: false, error: 'Upload failed' };
    }
  }

  static async deleteFile(fileId: string) {
    try {
      await drive.files.delete({ fileId });
      return { success: true };
    } catch (error) {
      console.error('Google Drive delete error:', error);
      return { success: false, error: 'Delete failed' };
    }
  }
}