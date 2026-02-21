// Audit logger for recording actions to Rekor + localStorage
import { submitToRekor } from './rekor';

interface ActionData {
  documentId: string;
  recipientId: string;
  recipientName: string;
  recipientRole: string;
  actionType: 'approve' | 'reject';
  signatureData?: unknown;
}

export async function recordAction(actionData: ActionData): Promise<{ success: boolean; rekorUUID: string }> {
  const timestamp = new Date().toISOString();

  const payload = {
    ...actionData,
    timestamp
  };

  try {
    // Submit to Sigstore Rekor
    const { uuid, logIndex } = await submitToRekor(payload);

    // Store in localStorage
    const logEntry = {
      document_id: actionData.documentId,
      recipient_id: actionData.recipientId,
      recipient_name: actionData.recipientName,
      recipient_role: actionData.recipientRole,
      action_type: actionData.actionType,
      timestamp,
      rekor_uuid: uuid,
      rekor_log_index: logIndex,
      signature_data: actionData.signatureData || null,
      verification_url: `https://search.sigstore.dev/?logIndex=${logIndex}`
    };

    const existingLogs = JSON.parse(localStorage.getItem('audit-logs') || '[]');
    existingLogs.push(logEntry);
    localStorage.setItem('audit-logs', JSON.stringify(existingLogs));

    return { success: true, rekorUUID: uuid };
  } catch (error) {
    console.error('Audit logging failed:', error);
    // Even if Rekor fails, we might want to log locally or just throw
    throw error;
  }
}
