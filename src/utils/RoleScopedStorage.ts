/**
 * RoleScopedStorage - Provides role-isolated localStorage/sessionStorage
 * Prevents demo data from contaminating real workflows
 */

type RoleType = 'demo-work' | 'real';

class RoleScopedStorage {
  /**
   * Determine role type from user role string
   */
  private getRoleType(userRole: string): RoleType {
    const normalized = userRole.toLowerCase().replace(/\s+/g, '-');
    return normalized === 'demo-work' ? 'demo-work' : 'real';
  }

  /**
   * Generate scoped key
   */
  private getScopedKey(userRole: string, key: string): string {
    const roleType = this.getRoleType(userRole);
    return `${roleType}:${key}`;
  }

  /**
   * Set item in role-scoped storage
   */
  setItem(userRole: string, key: string, value: string): void {
    const scopedKey = this.getScopedKey(userRole, key);
    try {
      localStorage.setItem(scopedKey, value);
      console.log(`💾 [RoleScopedStorage] Saved to ${scopedKey}`);
    } catch (error) {
      console.error(`❌ [RoleScopedStorage] Failed to save ${scopedKey}:`, error);
      throw error;
    }
  }

  /**
   * Get item from role-scoped storage
   */
  getItem(userRole: string, key: string): string | null {
    const scopedKey = this.getScopedKey(userRole, key);
    try {
      const value = localStorage.getItem(scopedKey);
      console.log(`📖 [RoleScopedStorage] Read from ${scopedKey}:`, value ? 'found' : 'not found');
      return value;
    } catch (error) {
      console.error(`❌ [RoleScopedStorage] Failed to read ${scopedKey}:`, error);
      return null;
    }
  }

  /**
   * Remove item from role-scoped storage
   */
  removeItem(userRole: string, key: string): void {
    const scopedKey = this.getScopedKey(userRole, key);
    try {
      localStorage.removeItem(scopedKey);
      console.log(`🗑️ [RoleScopedStorage] Removed ${scopedKey}`);
    } catch (error) {
      console.error(`❌ [RoleScopedStorage] Failed to remove ${scopedKey}:`, error);
    }
  }

  /**
   * Clear all storage for a specific role
   */
  clearRoleStorage(userRole: string): void {
    const roleType = this.getRoleType(userRole);
    const prefix = `${roleType}:`;
    
    const keysToRemove: string[] = [];
    
    // Find all keys with this prefix
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }

    // Remove them
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });

    console.log(`🧹 [RoleScopedStorage] Cleared ${keysToRemove.length} items for ${roleType}`);
  }

  /**
   * Migrate old unscoped keys to scoped keys
   * Run this once during transition
   */
  migrateOldKeys(userRole: string, oldKeys: string[]): void {
    const roleType = this.getRoleType(userRole);
    
    console.log(`🔄 [RoleScopedStorage] Migrating ${oldKeys.length} keys to ${roleType} scope`);

    oldKeys.forEach(oldKey => {
      const value = localStorage.getItem(oldKey);
      if (value) {
        const newKey = `${roleType}:${oldKey}`;
        localStorage.setItem(newKey, value);
        localStorage.removeItem(oldKey);
        console.log(`✅ [RoleScopedStorage] Migrated: ${oldKey} → ${newKey}`);
      }
    });
  }

  /**
   * Check if old unscoped keys exist
   */
  hasOldUnscopedKeys(keysToCheck: string[]): boolean {
    return keysToCheck.some(key => {
      const value = localStorage.getItem(key);
      return value !== null;
    });
  }

  /**
   * Get all keys for a role
   */
  getRoleKeys(userRole: string): string[] {
    const roleType = this.getRoleType(userRole);
    const prefix = `${roleType}:`;
    const keys: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        // Return key without prefix
        keys.push(key.substring(prefix.length));
      }
    }

    return keys;
  }
}

// Export singleton instance
export const roleScopedStorage = new RoleScopedStorage();

// Common storage keys used in the app
export const STORAGE_KEYS = {
  PENDING_APPROVALS: 'pending-approvals',
  SUBMITTED_DOCUMENTS: 'submitted-documents',
  APPROVAL_HISTORY: 'approval-history-new',
  LIVEMEET_REQUESTS: 'livemeet-requests',
  APPROVAL_COMMENTS: 'approval-comments',
  SHARED_COMMENTS: 'shared-comments',
  DOCUMENT_COMMENTS: 'document-comments',
  MEETINGS: 'meetings',
  REMINDERS: 'reminders',
  CHANNELS: 'channels',
  STICKY_NOTES: 'stickyNotes',
  RECIPIENTS: 'recipients'
} as const;
