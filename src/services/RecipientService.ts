import { supabase } from '@/lib/supabase';

export interface Recipient {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  branch?: string;
  designation?: string;
  is_active: boolean;
}

class RecipientService {
  async fetchRecipients(): Promise<Recipient[]> {
    try {
      console.log('[RecipientService] Fetching recipients from Supabase role_recipients...');

      const { data, error } = await supabase
        .from('role_recipients')
        .select('id, name, email, role, department, branch, designation, is_active')
        .eq('is_active', true)
        .order('role', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        console.error('[RecipientService] Supabase error:', error.message);
        throw error;
      }

      console.log(`[RecipientService] Fetched ${data?.length ?? 0} recipients`);
      return (data as Recipient[]) ?? [];
    } catch (error) {
      console.error('[RecipientService] Failed to fetch recipients:', error);
      throw new Error('Failed to fetch recipients from database');
    }
  }

  async fetchRecipientsByRole(role: string): Promise<Recipient[]> {
    try {
      console.log(`[RecipientService] Fetching recipients for role: ${role}`);

      const { data, error } = await supabase
        .from('role_recipients')
        .select('id, name, email, role, department, branch, designation, is_active')
        .eq('role', role)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;

      return (data as Recipient[]) ?? [];
    } catch (error) {
      console.error(`[RecipientService] Failed to fetch recipients for role ${role}:`, error);
      throw new Error(`Failed to fetch recipients for role: ${role}`);
    }
  }

  async searchRecipients(query: string): Promise<Recipient[]> {
    try {
      console.log(`[RecipientService] Searching recipients: ${query}`);

      const { data, error } = await supabase
        .from('role_recipients')
        .select('id, name, email, role, department, branch, designation, is_active')
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;

      return (data as Recipient[]) ?? [];
    } catch (error) {
      console.error('[RecipientService] Search failed:', error);
      throw new Error('Failed to search recipients');
    }
  }
}

export const recipientService = new RecipientService();
