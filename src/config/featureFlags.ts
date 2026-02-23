/**
 * Feature Flags for Demo Data Control
 * 
 * ENABLE_DEMO_DATA: Master kill switch - disables ALL demo data
 * Set to false before production deployment or during audits
 */

export const FEATURE_FLAGS = {
  // Master kill switch - controls all demo data
  ENABLE_DEMO_DATA: true,
  
  // Granular controls for specific modules
  ENABLE_MOCK_APPROVALS: true,
  ENABLE_MOCK_MESSAGES: true,
  ENABLE_MOCK_ANALYTICS: true,
  ENABLE_MOCK_DOCUMENTS: true,
} as const;

// Environment-based override (optional)
// Uncomment to auto-disable in production:
// if (import.meta.env.MODE === 'production') {
//   FEATURE_FLAGS.ENABLE_DEMO_DATA = false;
// }
