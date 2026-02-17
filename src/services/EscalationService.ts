/**
 * EscalationService
 * 
 * Handles automatic escalation for Emergency Management documents
 * Supports two modes:
 * 1. Sequential Cyclic Escalation: Forwards card to next recipient after timeout
 * 2. Parallel Notification Escalation: Notifies authorities without moving cards
 */

interface EscalationTimer {
  documentId: string;
  timerId: NodeJS.Timeout;
  escalationLevel: number;
  mode: 'sequential' | 'parallel';
  currentRecipientIndex: number;
  recipients: string[];
  lastEscalationTime: Date;
}

interface EscalationConfig {
  documentId: string;
  documentTitle: string;
  mode: 'sequential' | 'parallel';
  timeout: number; // in milliseconds
  recipients: string[];
  submittedBy: string;
  cyclicEscalation: boolean;
}

class EscalationService {
  private activeTimers: Map<string, EscalationTimer> = new Map();
  private readonly AUTHORITY_CHAIN = [
    'principal-dr.-robert-principal',
    'registrar-prof.-sarah-registrar',
    'dean-dr.-maria-dean',
    'chairman-mr.-david-chairman'
  ];

  /**
   * Initialize escalation for a document
   */
  initializeEscalation(config: EscalationConfig): void {
    console.log(`⏰ [Escalation] Initializing for document: ${config.documentId}`);
    console.log(`   Mode: ${config.mode}`);
    console.log(`   Timeout: ${config.timeout}ms (${this.formatTimeout(config.timeout)})`);
    console.log(`   Recipients: ${config.recipients.length}`);
    
    // Clear existing timer if any
    this.stopEscalation(config.documentId);
    
    if (config.mode === 'sequential') {
      this.startSequentialEscalation(config);
    } else {
      this.startParallelEscalation(config);
    }
  }

  /**
   * Sequential Cyclic Escalation
   * Forwards card to next recipient after timeout
   */
  private startSequentialEscalation(config: EscalationConfig): void {
    const timerId = setTimeout(() => {
      this.handleSequentialEscalation(config);
    }, config.timeout);

    this.activeTimers.set(config.documentId, {
      documentId: config.documentId,
      timerId,
      escalationLevel: 0,
      mode: 'sequential',
      currentRecipientIndex: 0,
      recipients: config.recipients,
      lastEscalationTime: new Date()
    });

    console.log(`✅ [Sequential Escalation] Timer set for ${this.formatTimeout(config.timeout)}`);
  }

  /**
   * Handle sequential escalation trigger
   */
  private handleSequentialEscalation(config: EscalationConfig): void {
    console.log(`🔔 [Sequential Escalation] Timer triggered for: ${config.documentId}`);

    // Get current timer state
    const timer = this.activeTimers.get(config.documentId);
    if (!timer) {
      console.log('❌ Timer not found, escalation cancelled');
      return;
    }

    // Check if document still exists and is pending
    const trackingCards = JSON.parse(localStorage.getItem('submitted-documents') || '[]');
    const document = trackingCards.find((doc: any) => doc.id === config.documentId);

    if (!document) {
      console.log('❌ Document not found, stopping escalation');
      this.stopEscalation(config.documentId);
      return;
    }

    if (document.status === 'approved' || document.status === 'rejected') {
      console.log(`✅ Document already ${document.status}, stopping escalation`);
      this.stopEscalation(config.documentId);
      return;
    }

    // Check if current recipient has acted
    const currentStep = document.workflow.steps.find((s: any) => s.status === 'current');
    if (!currentStep) {
      console.log('✅ No current step (workflow complete), stopping escalation');
      this.stopEscalation(config.documentId);
      return;
    }

    // Current recipient hasn't acted - proceed with escalation
    console.log(`⚡ No response from ${currentStep.assignee}, escalating...`);

    const newEscalationLevel = timer.escalationLevel + 1;
    const nextRecipientIndex = (timer.currentRecipientIndex + 1) % config.recipients.length;

    // Update tracking card with escalation
    const updatedCards = trackingCards.map((doc: any) => {
      if (doc.id === config.documentId) {
        // Mark current step as escalated but keep it current
        const updatedSteps = doc.workflow.steps.map((step: any) => {
          if (step.status === 'current' && step.assignee === currentStep.assignee) {
            return {
              ...step,
              escalated: true,
              escalationLevel: newEscalationLevel,
              escalatedAt: new Date().toISOString()
            };
          }
          return step;
        });

        // If cyclic, also mark next recipient's step as current
        if (config.cyclicEscalation && nextRecipientIndex !== timer.currentRecipientIndex) {
          const nextRecipientStep = updatedSteps.find((s: any, idx: number) => 
            idx === nextRecipientIndex + 1 // +1 because first step is submission
          );

          if (nextRecipientStep && nextRecipientStep.status === 'pending') {
            updatedSteps[nextRecipientIndex + 1] = {
              ...nextRecipientStep,
              status: 'current'
            };
          }
        }

        return {
          ...doc,
          workflow: {
            ...doc.workflow,
            escalationLevel: newEscalationLevel,
            lastEscalationTime: new Date().toISOString(),
            steps: updatedSteps
          }
        };
      }
      return doc;
    });

    localStorage.setItem('submitted-documents', JSON.stringify(updatedCards));

    // Trigger UI updates
    window.dispatchEvent(new CustomEvent('workflow-updated'));
    window.dispatchEvent(new CustomEvent('escalation-triggered', {
      detail: {
        documentId: config.documentId,
        documentTitle: config.documentTitle,
        escalationLevel: newEscalationLevel,
        previousRecipient: currentStep.assignee
      }
    }));

    console.log(`✅ Escalation complete:`, {
      level: newEscalationLevel,
      previousRecipient: currentStep.assignee,
      cyclePosition: `${nextRecipientIndex + 1} of ${config.recipients.length}`
    });

    // Schedule next escalation if cyclic
    if (config.cyclicEscalation) {
      this.activeTimers.set(config.documentId, {
        ...timer,
        escalationLevel: newEscalationLevel,
        currentRecipientIndex: nextRecipientIndex,
        lastEscalationTime: new Date()
      });

      const nextTimerId = setTimeout(() => {
        this.handleSequentialEscalation(config);
      }, config.timeout);

      this.activeTimers.get(config.documentId)!.timerId = nextTimerId;

      console.log(`⏰ Next escalation scheduled in ${this.formatTimeout(config.timeout)}`);
    } else {
      this.stopEscalation(config.documentId);
    }
  }

  /**
   * Parallel Notification Escalation
   * Notifies authorities without moving cards
   */
  private startParallelEscalation(config: EscalationConfig): void {
    const timerId = setTimeout(() => {
      this.handleParallelEscalation(config);
    }, config.timeout);

    this.activeTimers.set(config.documentId, {
      documentId: config.documentId,
      timerId,
      escalationLevel: 0,
      mode: 'parallel',
      currentRecipientIndex: 0,
      recipients: config.recipients,
      lastEscalationTime: new Date()
    });

    console.log(`✅ [Parallel Escalation] Timer set for ${this.formatTimeout(config.timeout)}`);
  }

  /**
   * Handle parallel escalation trigger
   */
  private handleParallelEscalation(config: EscalationConfig): void {
    console.log(`🔔 [Parallel Escalation] Timer triggered for: ${config.documentId}`);

    const timer = this.activeTimers.get(config.documentId);
    if (!timer) {
      console.log('❌ Timer not found, escalation cancelled');
      return;
    }

    // Check document status
    const trackingCards = JSON.parse(localStorage.getItem('submitted-documents') || '[]');
    const document = trackingCards.find((doc: any) => doc.id === config.documentId);

    if (!document) {
      console.log('❌ Document not found, stopping escalation');
      this.stopEscalation(config.documentId);
      return;
    }

    if (document.status === 'approved' || document.status === 'rejected') {
      console.log(`✅ Document already ${document.status}, stopping escalation`);
      this.stopEscalation(config.documentId);
      return;
    }

    // Check if any recipients have acted
    const recipientSteps = document.workflow.steps.filter((s: any) => s.name !== 'Submission');
    const respondedCount = recipientSteps.filter((s: any) => 
      s.status === 'completed' || s.status === 'rejected'
    ).length;

    if (respondedCount === recipientSteps.length) {
      console.log('✅ All recipients have responded, stopping escalation');
      this.stopEscalation(config.documentId);
      return;
    }

    // Some recipients haven't responded - notify authority
    const newEscalationLevel = timer.escalationLevel + 1;
    const authorityIndex = Math.min(newEscalationLevel - 1, this.AUTHORITY_CHAIN.length - 1);
    const authorityId = this.AUTHORITY_CHAIN[authorityIndex];

    console.log(`📬 Notifying authority level ${newEscalationLevel}: ${authorityId}`);

    // Update tracking card
    const updatedCards = trackingCards.map((doc: any) => {
      if (doc.id === config.documentId) {
        return {
          ...doc,
          workflow: {
            ...doc.workflow,
            escalationLevel: newEscalationLevel,
            lastEscalationTime: new Date().toISOString(),
            escalatedToAuthority: authorityId
          }
        };
      }
      return doc;
    });

    localStorage.setItem('submitted-documents', JSON.stringify(updatedCards));

    // Notify authority (this would integrate with ExternalNotificationDispatcher)
    window.dispatchEvent(new CustomEvent('authority-escalation', {
      detail: {
        documentId: config.documentId,
        documentTitle: config.documentTitle,
        escalationLevel: newEscalationLevel,
        authorityId: authorityId,
        respondedCount,
        totalRecipients: recipientSteps.length
      }
    }));

    // Trigger UI updates
    window.dispatchEvent(new CustomEvent('workflow-updated'));

    console.log(`✅ Authority notified: ${authorityId}`);

    // Schedule next escalation
    this.activeTimers.set(config.documentId, {
      ...timer,
      escalationLevel: newEscalationLevel,
      lastEscalationTime: new Date()
    });

    const nextTimerId = setTimeout(() => {
      this.handleParallelEscalation(config);
    }, config.timeout);

    this.activeTimers.get(config.documentId)!.timerId = nextTimerId;

    console.log(`⏰ Next authority notification scheduled in ${this.formatTimeout(config.timeout)}`);
  }

  /**
   * Stop escalation for a document
   */
  stopEscalation(documentId: string): void {
    const timer = this.activeTimers.get(documentId);
    if (timer) {
      clearTimeout(timer.timerId);
      this.activeTimers.delete(documentId);
      console.log(`🛑 [Escalation] Stopped for: ${documentId}`);
    }
  }

  /**
   * Stop all escalations
   */
  stopAllEscalations(): void {
    this.activeTimers.forEach((timer) => {
      clearTimeout(timer.timerId);
    });
    this.activeTimers.clear();
    console.log('🛑 [Escalation] All escalations stopped');
  }

  /**
   * Get escalation status for a document
   */
  getEscalationStatus(documentId: string): EscalationTimer | null {
    return this.activeTimers.get(documentId) || null;
  }

  /**
   * Format timeout for display
   */
  private formatTimeout(ms: number): string {
    const seconds = ms / 1000;
    const minutes = seconds / 60;
    const hours = minutes / 60;
    const days = hours / 24;

    if (days >= 1) return `${Math.round(days)} days`;
    if (hours >= 1) return `${Math.round(hours)} hours`;
    if (minutes >= 1) return `${Math.round(minutes)} minutes`;
    return `${Math.round(seconds)} seconds`;
  }

  /**
   * Convert time unit to milliseconds
   */
  static timeUnitToMs(value: number, unit: 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months'): number {
    const conversions = {
      seconds: 1000,
      minutes: 60 * 1000,
      hours: 60 * 60 * 1000,
      days: 24 * 60 * 60 * 1000,
      weeks: 7 * 24 * 60 * 60 * 1000,
      months: 30 * 24 * 60 * 60 * 1000
    };
    
    return value * conversions[unit];
  }
}

// Create singleton instance
export const escalationService = new EscalationService();

// Clean up on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    escalationService.stopAllEscalations();
  });
}
