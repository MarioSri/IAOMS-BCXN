/**
 * UserProfileService - Fetches individual user profile data from the
 * Supabase `role_recipients` table, matched by email (Google OAuth).
 *
 * STRICT RULE: Only the 'demo-work' role loads mock profile data.
 * All other roles MUST fetch from Supabase and NEVER see mock names.
 */

import { supabase } from '@/lib/supabase';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  branch?: string;
  phone?: string;
  employee_id?: string;
  designation?: string;
  bio?: string;
  avatar?: string;
  is_active: boolean;
}

class UserProfileService {
  /**
   * Fetch a user profile by their Google-authenticated email.
   * Looks up in `role_recipients` to match real institutional users.
   */
  async fetchProfileByEmail(email: string): Promise<UserProfile | null> {
    if (!email) return null;

    try {
      console.log('🔄 [UserProfileService] Fetching profile by email:', email);

      const { data, error } = await supabase
        .from('role_recipients')
        .select('id, name, email, role, department, branch, phone, employee_id, designation, bio, avatar, is_active')
        .eq('email', email)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('❌ [UserProfileService] Supabase error:', error.message);
        throw error;
      }

      if (!data) {
        console.log('ℹ️ [UserProfileService] No profile found for email:', email);
        return null;
      }

      console.log('✅ [UserProfileService] Profile fetched:', data.name);
      return data as UserProfile;
    } catch (error) {
      console.error('❌ [UserProfileService] Failed to fetch profile by email:', error);
      throw new Error('Failed to fetch user profile from database');
    }
  }

  /**
   * Fetch a user profile by their UUID (legacy method, resolves via email lookup when possible).
   * Falls back to ID-based UUID lookup if a `user_id` column is added.
   */
  async fetchProfile(userId: string): Promise<UserProfile | null> {
    if (!userId) return null;

    try {
      console.log('🔄 [UserProfileService] Fetching profile by user ID:', userId);

      // Primary: match by employee_id field
      const { data, error } = await supabase
        .from('role_recipients')
        .select('id, name, email, role, department, branch, phone, employee_id, designation, bio, avatar, is_active')
        .eq('employee_id', userId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('❌ [UserProfileService] Supabase error:', error.message);
        throw error;
      }

      if (!data) {
        console.log('ℹ️ [UserProfileService] No profile found for user ID:', userId);
        return null;
      }

      console.log('✅ [UserProfileService] Profile fetched:', data.name);
      return data as UserProfile;
    } catch (error) {
      console.error('❌ [UserProfileService] Failed to fetch profile:', error);
      throw new Error('Failed to fetch user profile from database');
    }
  }
}

export const userProfileService = new UserProfileService();
