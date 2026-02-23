/**
 * RecipientService - Handles fetching real-time recipient data from Supabase
 * Phase 3: Real-time data integration
 */

interface Recipient {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  branch?: string;
  is_active: boolean;
}

class RecipientService {
  private supabaseUrl: string | null = null;
  private supabaseKey: string | null = null;

  constructor() {
    // Initialize Supabase credentials from environment
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL || null;
    this.supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || null;
  }

  /**
   * Check if Supabase is configured
   */
  isConfigured(): boolean {
    return !!(this.supabaseUrl && this.supabaseKey);
  }

  /**
   * Fetch all active recipients from Supabase
   */
  async fetchRecipients(): Promise<Recipient[]> {
    if (!this.isConfigured()) {
      console.warn('⚠️ [RecipientService] Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
      return [];
    }

    try {
      console.log('🔄 [RecipientService] Fetching recipients from Supabase...');

      // TODO: Replace with actual Supabase client call
      // const { data, error } = await supabase
      //   .from('users')
      //   .select('*')
      //   .eq('is_active', true)
      //   .order('role', { ascending: true })
      //   .order('name', { ascending: true });

      // if (error) throw error;

      // For now, return empty array until Supabase is set up
      console.log('ℹ️ [RecipientService] Supabase integration pending - returning empty array');
      return [];

    } catch (error) {
      console.error('❌ [RecipientService] Failed to fetch recipients:', error);
      throw new Error('Failed to fetch recipients from database');
    }
  }

  /**
   * Fetch recipients by role
   */
  async fetchRecipientsByRole(role: string): Promise<Recipient[]> {
    if (!this.isConfigured()) {
      return [];
    }

    try {
      console.log(`🔄 [RecipientService] Fetching recipients for role: ${role}`);

      // TODO: Replace with actual Supabase client call
      // const { data, error } = await supabase
      //   .from('users')
      //   .select('*')
      //   .eq('role', role)
      //   .eq('is_active', true)
      //   .order('name', { ascending: true });

      // if (error) throw error;

      return [];

    } catch (error) {
      console.error(`❌ [RecipientService] Failed to fetch recipients for role ${role}:`, error);
      throw new Error(`Failed to fetch recipients for role: ${role}`);
    }
  }

  /**
   * Search recipients by name or email
   */
  async searchRecipients(query: string): Promise<Recipient[]> {
    if (!this.isConfigured()) {
      return [];
    }

    try {
      console.log(`🔍 [RecipientService] Searching recipients: ${query}`);

      // TODO: Replace with actual Supabase client call
      // const { data, error } = await supabase
      //   .from('users')
      //   .select('*')
      //   .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
      //   .eq('is_active', true)
      //   .order('name', { ascending: true });

      // if (error) throw error;

      return [];

    } catch (error) {
      console.error('❌ [RecipientService] Search failed:', error);
      throw new Error('Failed to search recipients');
    }
  }
}

// Export singleton instance
export const recipientService = new RecipientService();
