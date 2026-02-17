# Sigstore Rekor + Supabase Audit Implementation

## Overview
This system records every Approve & Sign and Reject action to Sigstore Rekor (free blockchain transparency log) and stores the verified record in Supabase for admin monitoring.

## Components Created

### 1. Database Migration
**File**: `supabase/migrations/20240116_document_action_logs.sql`
- Creates `document_action_logs` table
- Stores: document_id, recipient_id, recipient_name, recipient_role, action_type, timestamp, rekor_uuid, rekor_log_index, signature_data, verification_url

### 2. Rekor Integration Service
**File**: `src/lib/rekor.ts`
- `submitToRekor(data)` - Submits action to Sigstore Rekor
- Returns UUID and log index for verification

### 3. Audit Logger Service
**File**: `src/lib/auditLogger.ts`
- `recordAction(actionData)` - Records to both Rekor and Supabase
- Called automatically on approve/reject actions

### 4. Hook for Easy Integration
**File**: `src/hooks/useAuditLog.ts`
- `logAction()` - Simple hook to log actions from components

### 5. Backend API Endpoint
**File**: `backend/src/routes/auditLog.ts`
- POST `/api/audit/record-action` - Records action to Rekor + Supabase

## Integration Points

### In Approvals.tsx
Add to `handleAcceptDocumentFallback` and `handleRejectDocumentFallback`:

```typescript
import { recordAction } from '@/lib/auditLogger';

// After successful approve/reject:
await recordAction({
  documentId: docId,
  recipientId: user?.id || 'unknown',
  recipientName: user?.name || 'Unknown',
  recipientRole: user?.role || 'Unknown',
  actionType: 'approve', // or 'reject'
  signatureData: { /* signature metadata */ }
});
```

## Admin Monitoring

### Via Supabase Dashboard
1. Login to https://supabase.com/dashboard
2. Navigate to Table Editor
3. Select `document_action_logs` table
4. View all actions with Rekor verification URLs

### Query Examples
```sql
-- View all actions
SELECT * FROM document_action_logs ORDER BY timestamp DESC;

-- View actions for specific document
SELECT * FROM document_action_logs WHERE document_id = 'doc-123';

-- View actions by user
SELECT * FROM document_action_logs WHERE recipient_name = 'Dr. Robert';

-- Verify on Rekor
-- Copy verification_url and open in browser
```

## Data Recorded

For each action:
- ✅ Document ID
- ✅ Recipient who performed action
- ✅ Action type (approve/reject)
- ✅ Exact timestamp
- ✅ Rekor UUID (blockchain proof)
- ✅ Rekor log index
- ✅ Verification URL
- ✅ Signature metadata

## Cost
**$0/month** - Sigstore Rekor is completely free

## Verification
Every action can be verified on Sigstore:
1. Get `verification_url` from Supabase
2. Open URL in browser
3. See immutable proof on https://search.sigstore.dev

## Next Steps
1. Run Supabase migration: `supabase db push`
2. Add `recordAction()` calls to approve/reject handlers
3. Test with sample approval
4. Verify record in Supabase dashboard
5. Verify on Sigstore using verification URL
