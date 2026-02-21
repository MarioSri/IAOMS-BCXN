# Sigstore Rekor + Local Audit Implementation

## Overview
This system records every Approve & Sign and Reject action to Sigstore Rekor (free blockchain transparency log) and stores the verified record locally for admin monitoring.

## Components Created

### 1. Rekor Integration Service
**File**: `src/lib/rekor.ts`
- `submitToRekor(data)` - Submits action to Sigstore Rekor
- Returns UUID and log index for verification

### 2. Audit Logger Service
**File**: `src/lib/auditLogger.ts`
- `recordAction(actionData)` - Records to both Rekor and local storage
- Called automatically on approve/reject actions

### 3. Hook for Easy Integration
**File**: `src/hooks/useAuditLog.ts`
- `logAction()` - Simple hook to log actions from components

### 4. Backend API Endpoint
**File**: `backend/src/routes/auditLog.ts`
- POST `/api/audit/record-action` - Records action to Rekor + local storage

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

### Via Browser Developer Tools
1. Open browser developer tools (F12)
2. Navigate to Application > Local Storage
3. View `document_action_logs` entries
4. View all actions with Rekor verification URLs

### Query Examples
Audit logs are stored locally and can be retrieved programmatically:
```typescript
// View all actions
const logs = JSON.parse(localStorage.getItem('document_action_logs') || '[]');

// Filter actions for specific document
const docLogs = logs.filter(log => log.document_id === 'doc-123');

// Filter actions by user
const userLogs = logs.filter(log => log.recipient_name === 'Dr. Robert');

// Verify on Rekor - open verification_url in browser
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
1. Get `verification_url` from local audit logs
2. Open URL in browser
3. See immutable proof on https://search.sigstore.dev

## Next Steps
1. Initialize local audit log storage
2. Add `recordAction()` calls to approve/reject handlers
3. Test with sample approval
4. Verify record in local storage
5. Verify on Sigstore using verification URL
