import { submitToRekor } from './rekor';

interface ActionData {
    documentId: string;
    recipientId: string;
    recipientName: string;
    recipientRole: string;
    actionType: 'approve' | 'reject';
    signatureData?: any;
}

export async function recordAction(actionData: ActionData): Promise<{ success: boolean; rekorUUID: string }> {
    const timestamp = new Date().toISOString();

    const payload = {
        ...actionData,
        timestamp
    };

    try {
        const { uuid, logIndex } = await submitToRekor(payload);

        console.log(`Action recorded to Rekor. UUID: ${uuid}, LogIndex: ${logIndex}`);

        return { success: true, rekorUUID: uuid };
    } catch (error) {
        console.error('Audit logging failed:', error);
        throw error;
    }
}
