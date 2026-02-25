import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { realTimeDocumentService, DocumentData } from '@/services/RealTimeDocumentService';
import { isUserInRecipients } from '@/utils/recipientMatching';

export interface UseRealTimeDocumentsReturn {
  trackDocuments: DocumentData[];
  approvalCards: DocumentData[];
  submitDocument: (data: Partial<DocumentData>) => Promise<DocumentData>;
  createEmergencyDocument: (data: Partial<DocumentData>) => Promise<DocumentData>;
  createApprovalChainDocument: (data: Partial<DocumentData>) => Promise<DocumentData>;
  approveDocument: (documentId: string, comments?: string) => Promise<void>;
  rejectDocument: (documentId: string, reason: string) => Promise<void>;
  updateRecipients: (documentId: string, recipients: string[], recipientIds: string[]) => Promise<void>;
  loading: boolean;
  error: string | null;
  isConnected: boolean;
}

export function useRealTimeDocuments(): UseRealTimeDocumentsReturn {
  const { user } = useAuth();
  const [trackDocuments, setTrackDocuments] = useState<DocumentData[]>([]);
  const [approvalCards, setApprovalCards] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected] = useState(false);

  const loadData = useCallback(() => {
    try {
      const storedTrackDocs = JSON.parse(localStorage.getItem('submitted-documents') || '[]');
      const filteredTrackDocs = storedTrackDocs.filter((doc: DocumentData) => {
        if (!user) return false;
        return (
          doc.submitter === user.name ||
          doc.submitter === user.role ||
          (doc as unknown as Record<string, unknown>)['submittedBy'] === user.name ||
          (doc as unknown as Record<string, unknown>)['submittedByRole'] === user.role ||
          (doc as unknown as Record<string, unknown>)['submittedByDesignation'] === user.role
        );
      });
      setTrackDocuments(filteredTrackDocs);

      const storedApprovalCards = JSON.parse(localStorage.getItem('pending-approvals') || '[]');
      const filteredCards = storedApprovalCards.filter((card: DocumentData) => {
        if (!user) return false;
        return isUserInRecipients({
          user: {
            id: user.id,
            name: user.name,
            role: user.role,
            department: user.department,
            branch: user.branch
          },
          recipients: card.recipients,
          recipientIds: card.recipientIds,
          workflowSteps: card.workflow?.steps
        });
      });
      setApprovalCards(filteredCards);
    } catch (err) {
      console.error('Error loading documents:', err);
      setError('Failed to load documents');
    }
  }, [user]);

  useEffect(() => {
    const handleEvent = () => loadData();
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'submitted-documents' || event.key === 'pending-approvals') {
        loadData();
      }
    };

    window.addEventListener('document-submitted', handleEvent);
    window.addEventListener('document-approved', handleEvent);
    window.addEventListener('document-rejected', handleEvent);
    window.addEventListener('emergency-document-created', handleEvent);
    window.addEventListener('approval-chain-created', handleEvent);
    window.addEventListener('recipients-updated', handleEvent);
    window.addEventListener('document-approval-created', handleEvent);
    window.addEventListener('approval-card-created', handleEvent);
    window.addEventListener('storage', handleStorageChange);

    realTimeDocumentService.on('document-created', loadData);
    realTimeDocumentService.on('document-updated', loadData);
    realTimeDocumentService.on('approval-required', loadData);

    return () => {
      window.removeEventListener('document-submitted', handleEvent);
      window.removeEventListener('document-approved', handleEvent);
      window.removeEventListener('document-rejected', handleEvent);
      window.removeEventListener('emergency-document-created', handleEvent);
      window.removeEventListener('approval-chain-created', handleEvent);
      window.removeEventListener('recipients-updated', handleEvent);
      window.removeEventListener('document-approval-created', handleEvent);
      window.removeEventListener('approval-card-created', handleEvent);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function withLoadingState<TArgs extends unknown[], TReturn>(
    fn: (...args: TArgs) => Promise<TReturn>,
    errorMessage: string
  ) {
    return async (...args: TArgs): Promise<TReturn> => {
      setLoading(true);
      setError(null);
      try {
        return await fn(...args);
      } catch (err) {
        setError(err instanceof Error ? err.message : errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    };
  }

  const submitDocument = useCallback(
    withLoadingState(
      async (data: Partial<DocumentData>): Promise<DocumentData> => {
        if (!user) throw new Error('User not authenticated');
        return realTimeDocumentService.submitDocument(data, user);
      },
      'Failed to submit document'
    ),
    [user]
  );

  const createEmergencyDocument = useCallback(
    withLoadingState(
      async (data: Partial<DocumentData>): Promise<DocumentData> => {
        if (!user) throw new Error('User not authenticated');
        return realTimeDocumentService.createEmergencyDocument(data, user);
      },
      'Failed to create emergency document'
    ),
    [user]
  );

  const createApprovalChainDocument = useCallback(
    withLoadingState(
      async (data: Partial<DocumentData>): Promise<DocumentData> => {
        if (!user) throw new Error('User not authenticated');
        return realTimeDocumentService.createApprovalChainDocument(data, user);
      },
      'Failed to create approval chain document'
    ),
    [user]
  );

  const approveDocument = useCallback(
    withLoadingState(
      async (documentId: string, comments?: string): Promise<void> => {
        if (!user) throw new Error('User not authenticated');
        await realTimeDocumentService.approveDocument(documentId, user, comments);
      },
      'Failed to approve document'
    ),
    [user]
  );

  const rejectDocument = useCallback(
    withLoadingState(
      async (documentId: string, reason: string): Promise<void> => {
        if (!user) throw new Error('User not authenticated');
        await realTimeDocumentService.rejectDocument(documentId, user, reason);
      },
      'Failed to reject document'
    ),
    [user]
  );

  const updateRecipients = useCallback(
    withLoadingState(
      async (documentId: string, recipients: string[], recipientIds: string[]): Promise<void> => {
        await realTimeDocumentService.updateRecipients(documentId, recipients, recipientIds);
      },
      'Failed to update recipients'
    ),
    []
  );

  return {
    trackDocuments,
    approvalCards,
    submitDocument,
    createEmergencyDocument,
    createApprovalChainDocument,
    approveDocument,
    rejectDocument,
    updateRecipients,
    loading,
    error,
    isConnected
  };
}
