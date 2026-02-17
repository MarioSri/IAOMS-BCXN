/**
 * Real-time document service for unified document management
 * Re-factored to be purely localStorage-based for document management
 */

export interface DocumentData {
  id: string;
  title: string;
  type: string;
  submitter: string;
  submittedDate: string;
  priority: string;
  description: string;
  recipients: string[];
  recipientIds: string[];
  workflow?: {
    steps: Array<{
      name: string;
      assignee: string;
      status: 'pending' | 'current' | 'completed' | 'rejected' | 'bypassed';
      completedDate?: string;
    }>;
    currentStep: string;
    progress: number;
    isParallel?: boolean;
    hasBypass?: boolean;
  };
  source: 'document-management' | 'emergency-management' | 'approval-chain-bypass';
  routingType?: 'sequential' | 'parallel' | 'reverse' | 'bidirectional';
  isEmergency?: boolean;
  isParallel?: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'partially-approved';
  files?: any[];
  signedBy?: string[];
  rejectedBy?: string[];
}

export interface User {
  id: string;
  name: string;
  role: string;
  email: string;
  department?: string;
  branch?: string;
}

class RealTimeDocumentService {
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    console.log('📦 RealTimeDocumentService initialized (localStorage only)');
  }

  // Document Management Integration
  async submitDocument(documentData: Partial<DocumentData>, currentUser: User): Promise<DocumentData> {
    const document: DocumentData = {
      id: `doc-${Date.now()}`,
      title: documentData.title || '',
      type: documentData.type || 'Letter',
      submitter: currentUser.name,
      submittedDate: new Date().toISOString().split('T')[0],
      priority: documentData.priority || 'normal',
      description: documentData.description || '',
      recipients: documentData.recipients || [],
      recipientIds: documentData.recipientIds || [],
      workflow: this.createWorkflow(documentData.recipients || [], documentData.routingType),
      source: 'document-management',
      routingType: documentData.routingType || 'sequential',
      isEmergency: false,
      isParallel: documentData.routingType === 'parallel' || documentData.routingType === 'bidirectional',
      status: 'pending',
      files: documentData.files
    };

    // Save to localStorage
    this.saveToTrackDocuments(document);
    this.createApprovalCards(document);

    // Emit real-time events
    this.emit('document-submitted', document);
    this.emit('document-created', document);

    return document;
  }

  // Emergency Management Integration
  async createEmergencyDocument(documentData: Partial<DocumentData>, currentUser: User): Promise<DocumentData> {
    const document: DocumentData = {
      id: `emergency-${Date.now()}`,
      title: documentData.title || '',
      type: documentData.type || 'Emergency',
      submitter: currentUser.name,
      submittedDate: new Date().toISOString().split('T')[0],
      priority: 'critical',
      description: documentData.description || '',
      recipients: documentData.recipients || [],
      recipientIds: documentData.recipientIds || [],
      workflow: this.createWorkflow(documentData.recipients || [], 'parallel'),
      source: 'emergency-management',
      routingType: 'parallel',
      isEmergency: true,
      isParallel: true,
      status: 'pending',
      files: documentData.files
    };

    // Save to localStorage
    this.saveToTrackDocuments(document);
    this.createApprovalCards(document);

    // Emit emergency events
    this.emit('emergency-document-created', document);

    return document;
  }

  // Approval Chain with Bypass Integration
  async createApprovalChainDocument(documentData: Partial<DocumentData>, currentUser: User): Promise<DocumentData> {
    const document: DocumentData = {
      id: `approval-chain-${Date.now()}`,
      title: documentData.title || '',
      type: documentData.type || 'Letter',
      submitter: currentUser.name,
      submittedDate: new Date().toISOString().split('T')[0],
      priority: documentData.priority || 'high',
      description: documentData.description || '',
      recipients: documentData.recipients || [],
      recipientIds: documentData.recipientIds || [],
      workflow: this.createWorkflow(documentData.recipients || [], documentData.routingType, true),
      source: 'approval-chain-bypass',
      routingType: documentData.routingType || 'sequential',
      isEmergency: false,
      isParallel: documentData.routingType === 'parallel' || documentData.routingType === 'bidirectional',
      status: 'pending',
      files: documentData.files
    };

    // Save to localStorage
    this.saveToTrackDocuments(document);
    this.createApprovalCards(document);

    // Emit events
    this.emit('approval-chain-created', document);

    return document;
  }

  // Approval Processing
  async approveDocument(documentId: string, currentUser: User, comments?: string): Promise<void> {
    const trackingDocs = this.getTrackDocuments();
    const approvalCards = this.getApprovalCards();

    // Update tracking document
    const updatedTracking = trackingDocs.map(doc => {
      if (doc.id === documentId) {
        return this.processApproval(doc, currentUser, 'approved', comments);
      }
      return doc;
    });

    // Update approval cards
    const updatedApprovals = approvalCards.filter(card => {
      if (card.id === documentId || (card as any).trackingCardId === documentId) {
        if (card.isParallel || card.routingType === 'parallel') {
          return true;
        } else {
          return false;
        }
      }
      return true;
    });

    // Save updates
    localStorage.setItem('submitted-documents', JSON.stringify(updatedTracking));
    localStorage.setItem('pending-approvals', JSON.stringify(updatedApprovals));

    // Emit real-time updates
    this.emit('document-approved', { documentId, approvedBy: currentUser.name });
  }

  async rejectDocument(documentId: string, currentUser: User, reason: string): Promise<void> {
    const trackingDocs = this.getTrackDocuments();
    const approvalCards = this.getApprovalCards();

    // Update tracking document
    const updatedTracking = trackingDocs.map(doc => {
      if (doc.id === documentId) {
        return this.processApproval(doc, currentUser, 'rejected', reason);
      }
      return doc;
    });

    // Handle approval cards
    const updatedApprovals = approvalCards.filter(card => {
      if (card.id === documentId || (card as any).trackingCardId === documentId) {
        const trackingDoc = updatedTracking.find(td => td.id === documentId);
        const hasBypass = trackingDoc?.workflow?.hasBypass || card.source === 'approval-chain-bypass';

        if (hasBypass) {
          return true;
        } else {
          return false;
        }
      }
      return true;
    });

    // Save updates
    localStorage.setItem('submitted-documents', JSON.stringify(updatedTracking));
    localStorage.setItem('pending-approvals', JSON.stringify(updatedApprovals));

    // Emit real-time updates
    this.emit('document-rejected', { documentId, rejectedBy: currentUser.name, reason });
  }

  // Real-time recipient management
  async updateRecipients(documentId: string, newRecipients: string[], newRecipientIds: string[]): Promise<void> {
    const trackingDocs = this.getTrackDocuments();
    const approvalCards = this.getApprovalCards();

    // Update tracking documents
    const updatedTracking = trackingDocs.map(doc => {
      if (doc.id === documentId) {
        return {
          ...doc,
          recipients: newRecipients,
          recipientIds: newRecipientIds,
          workflow: this.createWorkflow(newRecipients, doc.routingType)
        };
      }
      return doc;
    });

    // Update approval cards
    const updatedApprovals = approvalCards.map(card => {
      if (card.id === documentId || (card as any).trackingCardId === documentId) {
        return {
          ...card,
          recipients: newRecipients,
          recipientIds: newRecipientIds
        };
      }
      return card;
    });

    // Save updates
    localStorage.setItem('submitted-documents', JSON.stringify(updatedTracking));
    localStorage.setItem('pending-approvals', JSON.stringify(updatedApprovals));

    // Emit real-time updates
    this.emit('recipients-updated', { documentId, recipients: newRecipients, recipientIds: newRecipientIds });
  }

  // Helper methods
  private createWorkflow(recipients: string[], routingType?: string, hasBypass?: boolean) {
    const steps = recipients.map((recipient, index) => ({
      name: `Step ${index + 1}`,
      assignee: recipient,
      status: (index === 0 || routingType === 'parallel' || routingType === 'bidirectional') ? 'current' as const : 'pending' as const
    }));

    return {
      steps,
      currentStep: steps[0]?.name || 'Complete',
      progress: 0,
      isParallel: routingType === 'parallel' || routingType === 'bidirectional',
      hasBypass
    };
  }

  private saveToTrackDocuments(document: DocumentData) {
    const existing = this.getTrackDocuments();
    existing.unshift(document);
    localStorage.setItem('submitted-documents', JSON.stringify(existing));
  }

  private createApprovalCards(document: DocumentData) {
    const approvalCard = {
      ...document,
      trackingCardId: document.id
    };

    const existing = this.getApprovalCards();
    existing.unshift(approvalCard as any);
    localStorage.setItem('pending-approvals', JSON.stringify(existing));
  }

  private processApproval(document: DocumentData, user: User, action: 'approved' | 'rejected', comments?: string) {
    const updatedDoc = { ...document };

    if (action === 'approved') {
      updatedDoc.signedBy = [...(updatedDoc.signedBy || []), user.name];
    } else {
      updatedDoc.rejectedBy = [...(updatedDoc.rejectedBy || []), user.name];
    }

    // Update workflow
    if (updatedDoc.workflow) {
      const userStepIndex = updatedDoc.workflow.steps.findIndex(step =>
        step.assignee.toLowerCase().includes(user.role?.toLowerCase() || '') ||
        step.assignee.toLowerCase().includes(user.name?.toLowerCase() || '')
      );

      if (userStepIndex !== -1) {
        updatedDoc.workflow.steps[userStepIndex].status = action === 'approved' ? 'completed' : 'rejected';
        updatedDoc.workflow.steps[userStepIndex].completedDate = new Date().toISOString().split('T')[0];

        // Update progress
        const completedSteps = updatedDoc.workflow.steps.filter(s => s.status === 'completed' || s.status === 'rejected').length;
        updatedDoc.workflow.progress = Math.round((completedSteps / updatedDoc.workflow.steps.length) * 100);

        // Check if workflow is complete
        if (completedSteps === updatedDoc.workflow.steps.length) {
          updatedDoc.status = action === 'approved' ? 'approved' : 'rejected';
          updatedDoc.workflow.currentStep = 'Complete';
        } else if (!updatedDoc.workflow.isParallel && action === 'approved') {
          // Move to next step in sequential workflow
          const nextStepIndex = userStepIndex + 1;
          if (nextStepIndex < updatedDoc.workflow.steps.length) {
            updatedDoc.workflow.steps[nextStepIndex].status = 'current';
            updatedDoc.workflow.currentStep = updatedDoc.workflow.steps[nextStepIndex].name;
          }
        }
      }
    }

    return updatedDoc;
  }

  private getTrackDocuments(): DocumentData[] {
    return JSON.parse(localStorage.getItem('submitted-documents') || '[]');
  }

  private getApprovalCards(): DocumentData[] {
    return JSON.parse(localStorage.getItem('pending-approvals') || '[]');
  }

  // Event system
  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  private emit(event: string, data: any) {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(callback => callback(data));

    // Also emit as window event for component communication
    window.dispatchEvent(new CustomEvent(event, { detail: data }));
  }

  // Cleanup
  destroy() {
    this.eventListeners.clear();
  }
}

// Singleton instance
export const realTimeDocumentService = new RealTimeDocumentService();
export default realTimeDocumentService;