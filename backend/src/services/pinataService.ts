import axios from 'axios';
import FormData from 'form-data';

export class PinataFaceStorage {
  private apiKey = '3187896e7a54df5fcfd2';
  private secretKey = '2efd741af6c525b2127f49b2a953768688d30164584cdb33ef027572e22d476f';
  private jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJhYzkyYTIyZS0yZWIyLTRjODctYmE5ZC05M2U4ODlhNTkwMWIiLCJlbWFpbCI6ImNoYWl0YW55YWRhbmR1MDRAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjMxODc4OTZlN2E1NGRmNWZjZmQyIiwic2NvcGVkS2V5U2VjcmV0IjoiMmVmZDc0MWFmNmM1MjViMjEyN2Y0OWIyYTk1Mzc2ODY4OGQzMDE2NDU4NGNkYjMzZWYwMjc1NzJlMjJkNDc2ZiIsImV4cCI6MTc5NDQyMDQ0Nn0.2CNUVHWCSM5s1Up6WNKt6YBvebNQM6smR6eNw53owHs';
  private baseURL = 'https://api.pinata.cloud';

  async uploadFaceImage(userId: string, imageBuffer: Buffer): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', imageBuffer, {
        filename: `${userId}.jpg`,
        contentType: 'image/jpeg'
      });

      const metadata = JSON.stringify({
        name: `Face-${userId}`,
        keyvalues: {
          userId: userId,
          type: 'face_recognition',
          timestamp: new Date().toISOString()
        }
      });
      formData.append('pinataMetadata', metadata);

      const response = await axios.post(
        `${this.baseURL}/pinning/pinFileToIPFS`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'Authorization': `Bearer ${this.jwt}`
          }
        }
      );

      console.log(`✅ Face uploaded to IPFS: ${userId} → ${response.data.IpfsHash}`);
      return response.data.IpfsHash;
    } catch (error) {
      console.error('❌ Pinata upload error:', error);
      throw new Error(`Failed to upload face to IPFS: ${error}`);
    }
  }

  async getFaceImage(ipfsHash: string): Promise<Buffer> {
    try {
      const response = await axios.get(
        `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
        { responseType: 'arraybuffer' }
      );
      
      console.log(`✅ Face downloaded from IPFS: ${ipfsHash}`);
      return Buffer.from(response.data);
    } catch (error) {
      console.error('❌ Pinata download error:', error);
      throw new Error(`Failed to download face from IPFS: ${error}`);
    }
  }

  async listUserFaces(): Promise<Array<{userId: string, ipfsHash: string}>> {
    try {
      const response = await axios.get(
        `${this.baseURL}/data/pinList?status=pinned&metadata[keyvalues][type]=face_recognition`,
        {
          headers: {
            'Authorization': `Bearer ${this.jwt}`
          }
        }
      );

      return response.data.rows.map((item: any) => ({
        userId: item.metadata.keyvalues.userId,
        ipfsHash: item.ipfs_pin_hash
      }));
    } catch (error) {
      console.error('❌ Pinata list error:', error);
      return [];
    }
  }

  async deleteFaceImage(ipfsHash: string): Promise<boolean> {
    try {
      await axios.delete(
        `${this.baseURL}/pinning/unpin/${ipfsHash}`,
        {
          headers: {
            'Authorization': `Bearer ${this.jwt}`
          }
        }
      );
      
      console.log(`✅ Face deleted from IPFS: ${ipfsHash}`);
      return true;
    } catch (error) {
      console.error('❌ Pinata delete error:', error);
      return false;
    }
  }
}

export const pinataStorage = new PinataFaceStorage();