const faceStore = new Map<string, FaceRecord>();

export interface FaceRecord {
  user_id: string;
  ipfs_hash: string;
  created_at: string;
  updated_at: string;
}

export class FaceDatabase {
  async storeFaceMapping(userId: string, ipfsHash: string): Promise<void> {
    try {
      const now = new Date().toISOString();
      const existing = faceStore.get(userId);

      faceStore.set(userId, {
        user_id: userId,
        ipfs_hash: ipfsHash,
        created_at: existing?.created_at || now,
        updated_at: now
      });

      console.log(`✅ Face mapping stored (Local): ${userId} → ${ipfsHash}`);
    } catch (error) {
      console.error('❌ Database error:', error);
      throw new Error(`Failed to store face mapping: ${error}`);
    }
  }

  async getFaceHash(userId: string): Promise<string | null> {
    try {
      const record = faceStore.get(userId);
      return record?.ipfs_hash || null;
    } catch (error) {
      console.error('❌ Database error:', error);
      return null;
    }
  }

  async getAllFaceMappings(): Promise<FaceRecord[]> {
    try {
      return Array.from(faceStore.values()).sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } catch (error) {
      console.error('❌ Database error:', error);
      return [];
    }
  }

  async deleteFaceMapping(userId: string): Promise<boolean> {
    try {
      const deleted = faceStore.delete(userId);
      if (deleted) {
        console.log(`✅ Face mapping deleted: ${userId}`);
      }
      return deleted;
    } catch (error) {
      console.error('❌ Database error:', error);
      return false;
    }
  }
}

export const faceDatabase = new FaceDatabase();