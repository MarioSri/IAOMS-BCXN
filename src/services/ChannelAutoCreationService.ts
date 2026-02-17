import { ChatChannel } from '@/types/chat';

interface DocumentSubmission {
  documentId: string;
  documentTitle: string;
  submittedBy: string;
  submittedByName: string;
  recipients: string[];
  recipientNames?: string[];
  source: 'Document Management' | 'Emergency Management' | 'Approval Chain with Bypass';
  submittedAt: Date;
}

export class ChannelAutoCreationService {
  private static readonly STORAGE_KEY = 'document-channels';

  /**
   * Automatically create a channel when a document is submitted
   */
  static createDocumentChannel(submission: DocumentSubmission): ChatChannel {
    const channelId = `channel-${submission.documentId}-${Date.now()}`;
    
    // Create channel with submitter + all recipients
    const members = [
      submission.submittedBy,
      ...submission.recipients
    ];

    // Remove duplicates
    const uniqueMembers = Array.from(new Set(members));

    const channel: ChatChannel = {
      id: channelId,
      name: `${submission.documentId} - ${submission.documentTitle}`,
      description: `Auto-created channel for ${submission.source}\nCreated by: ${submission.submittedByName}\nCreated on: ${submission.submittedAt.toLocaleDateString()}`,
      type: 'document-thread',
      members: uniqueMembers,
      admins: [submission.submittedBy], // Submitter is admin
      isPrivate: true, // Only visible to members
      documentId: submission.documentId,
      createdBy: submission.submittedBy,
      createdAt: submission.submittedAt,
      updatedAt: submission.submittedAt,
      pinnedMessages: [],
      settings: {
        allowFileUploads: true,
        allowPolls: true,
        allowSignatureRequests: true,
        requireModeration: false,
        autoArchive: false,
        notificationLevel: 'all'
      }
    };

    // Save to localStorage
    this.saveChannel(channel);

    // Broadcast event for real-time updates
    this.broadcastChannelCreated(channel);

    console.log('✅ Channel auto-created:', {
      channelId: channel.id,
      documentId: submission.documentId,
      members: uniqueMembers,
      source: submission.source
    });

    return channel;
  }

  /**
   * Save channel to localStorage
   */
  private static saveChannel(channel: ChatChannel): void {
    try {
      const existingChannels = this.getChannels();
      
      // Check if channel already exists for this document
      const existingIndex = existingChannels.findIndex(
        ch => ch.documentId === channel.documentId
      );

      if (existingIndex >= 0) {
        // Update existing channel
        existingChannels[existingIndex] = channel;
      } else {
        // Add new channel
        existingChannels.push(channel);
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingChannels));
    } catch (error) {
      console.error('Failed to save channel:', error);
    }
  }

  /**
   * Get all channels from localStorage
   */
  static getChannels(): ChatChannel[] {
    try {
      const channelsJson = localStorage.getItem(this.STORAGE_KEY);
      return channelsJson ? JSON.parse(channelsJson) : [];
    } catch (error) {
      console.error('Failed to load channels:', error);
      return [];
    }
  }

  /**
   * Get channels visible to a specific user
   */
  static getUserChannels(userId: string): ChatChannel[] {
    const allChannels = this.getChannels();
    return allChannels.filter(channel => 
      channel.members.includes(userId) || channel.createdBy === userId
    );
  }

  /**
   * Get channel by document ID
   */
  static getChannelByDocumentId(documentId: string): ChatChannel | null {
    const channels = this.getChannels();
    return channels.find(ch => ch.documentId === documentId) || null;
  }

  /**
   * Add members to an existing channel
   */
  static addMembersToChannel(channelId: string, newMembers: string[]): void {
    try {
      const channels = this.getChannels();
      const channelIndex = channels.findIndex(ch => ch.id === channelId);

      if (channelIndex >= 0) {
        const existingMembers = channels[channelIndex].members || [];
        channels[channelIndex].members = Array.from(new Set([...existingMembers, ...newMembers]));
        channels[channelIndex].updatedAt = new Date();

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(channels));
        this.broadcastChannelUpdated(channels[channelIndex]);
      }
    } catch (error) {
      console.error('Failed to add members:', error);
    }
  }

  /**
   * Delete a channel
   */
  static deleteChannel(channelId: string): void {
    try {
      const channels = this.getChannels();
      const filteredChannels = channels.filter(ch => ch.id !== channelId);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredChannels));
      this.broadcastChannelDeleted(channelId);
    } catch (error) {
      console.error('Failed to delete channel:', error);
    }
  }

  /**
   * Broadcast channel-created event
   */
  private static broadcastChannelCreated(channel: ChatChannel): void {
    const event = new CustomEvent('channel-created', {
      detail: { channel }
    });
    window.dispatchEvent(event);

    // Also trigger storage event for cross-tab sync
    window.dispatchEvent(new StorageEvent('storage', {
      key: this.STORAGE_KEY,
      newValue: JSON.stringify(this.getChannels()),
      storageArea: localStorage
    }));
  }

  /**
   * Broadcast channel-updated event
   */
  private static broadcastChannelUpdated(channel: ChatChannel): void {
    const event = new CustomEvent('channel-updated', {
      detail: { channel }
    });
    window.dispatchEvent(event);

    window.dispatchEvent(new StorageEvent('storage', {
      key: this.STORAGE_KEY,
      newValue: JSON.stringify(this.getChannels()),
      storageArea: localStorage
    }));
  }

  /**
   * Broadcast channel-deleted event
   */
  private static broadcastChannelDeleted(channelId: string): void {
    const event = new CustomEvent('channel-deleted', {
      detail: { channelId }
    });
    window.dispatchEvent(event);

    window.dispatchEvent(new StorageEvent('storage', {
      key: this.STORAGE_KEY,
      newValue: JSON.stringify(this.getChannels()),
      storageArea: localStorage
    }));
  }

  /**
   * Update channel description
   */
  static updateChannelDescription(channelId: string, description: string): void {
    try {
      const channels = this.getChannels();
      const channelIndex = channels.findIndex(ch => ch.id === channelId);

      if (channelIndex >= 0) {
        channels[channelIndex].description = description;
        channels[channelIndex].updatedAt = new Date();
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(channels));
        this.broadcastChannelUpdated(channels[channelIndex]);
      }
    } catch (error) {
      console.error('Failed to update channel description:', error);
    }
  }
}

// Export singleton instance
export const channelAutoCreationService = ChannelAutoCreationService;
