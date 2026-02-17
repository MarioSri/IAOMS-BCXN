/**
 * React hook for real-time document management
 * Integrates Track Documents, Approval Center, Document Management, Emergency Management, and Approval Chain
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { realTimeDocumentService, DocumentData } from '@/services/RealTimeDocumentService';
import { isUserInRecipients } from '@/utils/recipientMatching';

export interface UseRealTimeDocumentsReturn {
  // Data
  trackDocuments: DocumentData[];
  approvalCards: DocumentData[];
  
  // Actions
  submitDocument: (data: Partial<DocumentData>) => Promise<DocumentData>;
  createEmergencyDocument: (data: Partial<DocumentData>) => Promise<DocumentData>;
  createApprovalChainDocument: (data: Partial<DocumentData>) => Promise<DocumentData>;
  approveDocument: (documentId: string, comments?: string) => Promise<void>;
  rejectDocument: (documentId: string, reason: string) => Promise<void>;
  updateRecipients: (documentId: string, recipients: string[], recipientIds: string[]) => Promise<void>;
  
  // State
  loading: boolean;
  error: string | null;
  
  // Real-time status
  isConnected: boolean;
}

export const useRealTimeDocuments = (): UseRealTimeDocumentsReturn => {
  const { user } = useAuth();
  const [trackDocuments, setTrackDocuments] = useState<DocumentData[]>([]);
  const [approvalCards, setApprovalCards] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Load initial data
  const loadData = useCallback(() => {
    try {
      // Load track documents (filtered for current user as submitter only)
      const storedTrackDocs = JSON.parse(localStorage.getItem('submitted-documents') || '[]');
      const filteredTrackDocs = storedTrackDocs.filter((doc: DocumentData) => {
        if (!user) return false;
        
        // Only show documents where current user is the submitter
        const isSubmitter = (
          doc.submitter === user.name ||
          doc.submitter === user.role ||
          (doc as any).submittedBy === user.name ||
          (doc as any).submittedByRole === user.role ||
          (doc as any).submittedByDesignation === user.role
        );
        
        return isSubmitter;
      });
      
      setTrackDocuments(filteredTrackDocs);

      // Load approval cards (filtered for current user as recipient)
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

  // Real-time event handlers
  useEffect(() => {
    const handleDocumentSubmitted = (event: CustomEvent) => {
      console.log('📄 Document submitted:', event.detail);
      loadData();
    };

    const handleDocumentApproved = (event: CustomEvent) => {
      console.log('✅ Document approved:', event.detail);
      loadData();
    };

    const handleDocumentRejected = (event: CustomEvent) => {
      console.log('❌ Document rejected:', event.detail);
      loadData();
    };

    const handleEmergencyDocument = (event: CustomEvent) => {
      console.log('🚨 Emergency document:', event.detail);
      loadData();
    };

    const handleApprovalChainCreated = (event: CustomEvent) => {
      console.log('🔗 Approval chain created:', event.detail);
      loadData();
    };

    const handleRecipientsUpdated = (event: CustomEvent) => {
      console.log('👥 Recipients updated:', event.detail);
      loadData();
    };

    // Storage events for cross-tab synchronization
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'submitted-documents' || event.key === 'pending-approvals') {
        console.log('💾 Storage changed:', event.key);
        loadData();
      }
    };

    // Register event listeners
    window.addEventListener('document-submitted', handleDocumentSubmitted as EventListener);
    window.addEventListener('document-approved', handleDocumentApproved as EventListener);
    window.addEventListener('document-rejected', handleDocumentRejected as EventListener);
    window.addEventListener('emergency-document-created', handleEmergencyDocument as EventListener);
    window.addEventListener('approval-chain-created', handleApprovalChainCreated as EventListener);
    window.addEventListener('recipients-updated', handleRecipientsUpdated as EventListener);
    window.addEventListener('document-approval-created', () => loadData() as any);
    window.addEventListener('approval-card-created', () => loadData() as any);
    window.addEventListener('storage', handleStorageChange);

    // Real-time service events
    realTimeDocumentService.on('document-created', loadData);
    realTimeDocumentService.on('document-updated', loadData);
    realTimeDocumentService.on('approval-required', loadData);

    return () => {
      window.removeEventListener('document-submitted', handleDocumentSubmitted as EventListener);
      window.removeEventListener('document-approved', handleDocumentApproved as EventListener);
      window.removeEventListener('document-rejected', handleDocumentRejected as EventListener);
      window.removeEventListener('emergency-document-created', handleEmergencyDocument as EventListener);
      window.removeEventListener('approval-chain-created', handleApprovalChainCreated as EventListener);
      window.removeEventListener('recipients-updated', handleRecipientsUpdated as EventListener);
      window.removeEventListener('document-approval-created', () => loadData() as any);
      window.removeEventListener('approval-card-created', () => loadData() as any);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadData]);

  // Load data on mount and user change
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Actions
  const submitDocument = useCallback(async (data: Partial<DocumentData>): Promise<DocumentData> => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    setError(null);
    
    try {
      const document = await realTimeDocumentService.submitDocument(data, user);
      return document;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit document';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createEmergencyDocument = useCallback(async (data: Partial<DocumentData>): Promise<DocumentData> => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    setError(null);
    
    try {
      const document = await realTimeDocumentService.createEmergencyDocument(data, user);
      return document;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create emergency document';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createApprovalChainDocument = useCallback(async (data: Partial<DocumentData>): Promise<DocumentData> => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    setError(null);
    
    try {
      const document = await realTimeDocumentService.createApprovalChainDocument(data, user);
      return document;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create approval chain document';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const approveDocument = useCallback(async (documentId: string, comments?: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    setError(null);
    
    try {
      await realTimeDocumentService.approveDocument(documentId, user, comments);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve document';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const rejectDocument = useCallback(async (documentId: string, reason: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    setError(null);
    
    try {
      await realTimeDocumentService.rejectDocument(documentId, user, reason);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject document';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateRecipients = useCallback(async (documentId: string, recipients: string[], recipientIds: string[]): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await realTimeDocumentService.updateRecipients(documentId, recipients, recipientIds);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update recipients';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // Data
    trackDocuments,
    approvalCards,
    
    // Actions
    submitDocument,
    createEmergencyDocument,
    createApprovalChainDocument,
    approveDocument,
    rejectDocument,
    updateRecipients,
    
    // State
    loading,
    error,
    
    // Real-time status
    isConnected
  };
};