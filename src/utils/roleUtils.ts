/**
 * CRITICAL RULE: Mock Data Access Control
 * 
 * Only roles returned by isAllowedMockData() can see mock recipients.
 * All other roles MUST fetch from Supabase.
 * 
 * When adding new demo/sandbox roles:
 * 1. Add to MOCK_DATA_ROLES array
 * 2. Update MOCK_RECIPIENTS in AuthContext
 * 3. Test all components (Profile, Dashboard, RecipientSelector)
 * 
 * DO NOT add role checks elsewhere - use this function.
 */

const MOCK_DATA_ROLES = ['demo-work'];

/**
 * Normalize role string for comparison
 */
export function normalizeRole(role: string): string {
  return role.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Check if a role is allowed to see mock data
 * @param role - User role to check
 * @returns true if role can access mock data, false otherwise
 */
export function isAllowedMockData(role: string): boolean {
  const normalized = normalizeRole(role);
  return MOCK_DATA_ROLES.includes(normalized);
}

/**
 * Data source type for tracking data origin
 */
export type DataSource = 'mock' | 'real' | 'empty';

/**
 * Log data source for debugging
 */
export function logDataSource(component: string, source: DataSource, details?: string): void {
  const emoji = source === 'mock' ? '⚠️' : source === 'real' ? '✅' : '❌';
  console.log(`${emoji} [${component}] Data source: ${source}${details ? ` - ${details}` : ''}`);
}
