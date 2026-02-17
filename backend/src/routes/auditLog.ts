import { Router } from 'express';
import { recordAction } from '../lib/auditLogger';

const router = Router();

router.post('/record-action', async (req, res) => {
  try {
    const { documentId, recipientId, recipientName, recipientRole, actionType, signatureData } = req.body;

    if (!documentId || !recipientId || !recipientName || !recipientRole || !actionType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['approve', 'reject'].includes(actionType)) {
      return res.status(400).json({ error: 'Invalid action type' });
    }

    const result = await recordAction({
      documentId,
      recipientId,
      recipientName,
      recipientRole,
      actionType,
      signatureData
    });

    return res.json(result);
  } catch (error) {
    console.error('Failed to record action:', error);
    return res.status(500).json({ error: 'Failed to record action' });
  }
});

export default router;
