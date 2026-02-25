import { DecentralizedChatService } from './DecentralizedChatService';
import { ChatMessage, ChatChannel, DocumentMetadata, MessageAttachment } from '@/types/chat';

export interface DocumentWorkflowEvent {
  id: string;
  type: 'document_created' | 'approval_requested' | 'approval_completed' | 'document_shared' | 'comment_added';
  documentId: string;
  documentType: 'letter' | 'circular' | 'report' | 'form' | 'approval';
  title: string;
  description?: string;
  userId: string;
  recipientIds?: string[];
  channelId?: string;
  metadata: DocumentMetadata;
  createdAt: Date;
}

export interface WorkflowNotification {
  id: string;
  type: 'approval_request' | 'approval_completed' | 'document_update' | 'deadline_reminder';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  userId: string;
  documentId?: string;
  actionRequired: boolean;
  actionUrl?: string;
  createdAt: Date;
  expiresAt?: Date;
}

export class DocumentWorkflowIntegration {
  private chatService: DecentralizedChatService;
  private workflowEventHandlers: Map<string, (event: DocumentWorkflowEvent) => void> = new Map();

  constructor(chatService: DecentralizedChatService) {
    this.chatService = chatService;
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.workflowEventHandlers.set('document_created', this.handleDocumentCreated.bind(this));
    this.workflowEventHandlers.set('approval_requested', this.handleApprovalRequested.bind(this));
    this.workflowEventHandlers.set('approval_completed', this.handleApprovalCompleted.bind(this));
    this.workflowEventHandlers.set('document_shared', this.handleDocumentShared.bind(this));
  }

  async processWorkflowEvent(event: DocumentWorkflowEvent): Promise<void> {
    const handler = this.workflowEventHandlers.get(event.type);
    if (handler) {
      await handler(event);
    }
  }

  private async handleDocumentCreated(event: DocumentWorkflowEvent): Promise<void> {
    const channelName = `doc-${event.documentType}-${event.documentId.slice(0, 8)}`;
    const channelDescription = `Discussion thread for: ${event.title}`;

    const channel = await this.chatService.createChannel({
      name: channelName,
      description: channelDescription,
      type: 'document',
      isPrivate: true,
      documentId: event.documentId,
      createdBy: event.userId,
      members: event.recipientIds || [event.userId]
    });

    await this.chatService.sendMessage({
      channelId: channel.id,
      content: `📄 Document "${event.title}" has been created and is ready for discussion.`,
      senderId: event.userId,
      type: 'system',
      metadata: {
        documentId: event.documentId,
        priority: 'normal'
      }
    });

    await this.chatService.sendMessage({
      channelId: channel.id,
      content: `**Document Details:**
📋 Type: ${event.documentType.toUpperCase()}
📝 Title: ${event.title}
${event.description ? `📄 Description: ${event.description}` : ''}
🕒 Created: ${event.createdAt.toLocaleString()}

Use this channel to discuss, ask questions, or provide feedback on this document.`,
      senderId: event.userId,
      type: 'system'
    });
  }

  private async handleApprovalRequested(event: DocumentWorkflowEvent): Promise<void> {
    if (!event.recipientIds?.length) return;

    const channelName = `approval-${event.documentId.slice(0, 8)}`;

    const channel = await this.chatService.createChannel({
      name: channelName,
      description: `Approval workflow for: ${event.title}`,
      type: 'private',
      isPrivate: true,
      documentId: event.documentId,
      createdBy: event.userId,
      members: [...event.recipientIds, event.userId]
    });

    const approverMentions = event.recipientIds.map(id => `@${id}`).join(' ');
    await this.chatService.sendMessage({
      channelId: channel.id,
      content: `🔔 **Approval Required**

${approverMentions} - Your approval is requested for the following document:

📋 **${event.title}**
📄 Type: ${event.documentType.toUpperCase()}
${event.description ? `📝 Description: ${event.description}` : ''}

Please review and provide your approval or feedback.`,
      senderId: event.userId,
      type: 'approval_request',
      metadata: {
        documentId: event.documentId,
        priority: 'high'
      }
    });

    await this.chatService.createSignatureRequest({
      title: `Approval for: ${event.title}`,
      description: `Please review and approve this ${event.documentType}`,
      targetUsers: event.recipientIds,
      documentId: event.documentId,
      requestedBy: event.userId,
      deadline: event.metadata.dueDate ? new Date(event.metadata.dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
  }

  private async handleApprovalCompleted(event: DocumentWorkflowEvent): Promise<void> {
    const completionMessage = `✅ **Approval Completed**

The document "${event.title}" has been successfully approved.

🎉 Status: **APPROVED**
📅 Completed: ${event.createdAt.toLocaleString()}

Thank you to all approvers for your timely response!`;

    console.log('Approval completed:', completionMessage);
  }

  private async handleDocumentShared(event: DocumentWorkflowEvent): Promise<void> {
    if (!event.channelId || !event.recipientIds?.length) return;

    const attachment: MessageAttachment = {
      id: event.documentId,
      name: event.title,
      type: 'document',
      size: event.metadata.fileSize || 0,
      url: event.metadata.fileUrl || '',
      mimeType: event.metadata.fileType || 'application/pdf'
    };

    await this.chatService.sendMessage({
      channelId: event.channelId,
      content: `📤 **Document Shared**

@channel A document has been shared with this group:

📋 **${event.title}**
📄 Type: ${event.documentType.toUpperCase()}
${event.description ? `📝 Description: ${event.description}` : ''}
👤 Shared by: <@${event.userId}>

Click to view and download the document.`,
      senderId: event.userId,
      type: 'document_share',
      metadata: {
        documentId: event.documentId,
        priority: 'normal'
      },
      attachments: [attachment]
    });
  }

  private async sendWorkflowNotification(notification: WorkflowNotification): Promise<void> {
    console.log('Workflow notification:', notification);
  }

  async createDocumentThread(
    documentId: string,
    sectionId: string,
    title: string,
    initiatorId: string,
    participantIds: string[]
  ): Promise<ChatChannel> {
    const threadName = `thread-${documentId.slice(0, 8)}-${sectionId}`;
    
    return await this.chatService.createChannel({
      name: threadName,
      description: `Discussion thread: ${title}`,
      type: 'document-thread',
      isPrivate: true,
      documentId,
      createdBy: initiatorId,
      members: [...participantIds, initiatorId]
    });
  }

  async generateDocumentDiscussionSummary(documentId: string): Promise<string> {
    return `Summary of discussions for document ${documentId}: 
    
Key points discussed:
- Document review completed
- Minor revisions suggested
- Approval process initiated
- All stakeholders notified

Action items:
- Implement suggested changes
- Schedule follow-up review
- Finalize approval workflow`;
  }

  async exportWorkflowAuditTrail(documentId: string): Promise<{
    documentId: string;
    timeline: Array<{
      timestamp: Date;
      event: string;
      actor: string;
      details: string;
      channelId?: string;
      messageId?: string;
    }>;
    discussions: Array<{
      channelName: string;
      messageCount: number;
      participantCount: number;
      keyTopics: string[];
    }>;
    approvals: Array<{
      approver: string;
      status: 'pending' | 'approved' | 'rejected';
      timestamp?: Date;
      comments?: string;
    }>;
  }> {
    return {
      documentId,
      timeline: [
        {
          timestamp: new Date(),
          event: 'Document Created',
          actor: 'System',
          details: 'Document workflow initiated'
        }
      ],
      discussions: [
        {
          channelName: `doc-${documentId.slice(0, 8)}`,
          messageCount: 0,
          participantCount: 0,
          keyTopics: []
        }
      ],
      approvals: []
    };
  }
}

export default DocumentWorkflowIntegration;
