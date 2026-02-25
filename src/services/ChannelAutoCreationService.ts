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

  static createDocumentChannel(submission: DocumentSubmission): ChatChannel {
    const channelId = `channel-${submission.documentId}-${Date.now()}`;

    const members = [
      submission.submittedBy,
      ...submission.recipients
    ];

    const uniqueMembers = Array.from(new Set(members));

    const channel: ChatChannel = {
      id: channelId,
      name: `${submission.documentId} - ${submission.documentTitle}`,
      description: `Auto-created channel for ${submission.source}\nCreated by: ${submission.submittedByName}\nCreated on: ${submission.submittedAt.toLocaleDateString()}`,
      type: 'document-thread',
      members: uniqueMembers,
      admins: [submission.submittedBy],
      isPrivate: true,
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

    this.saveChannel(channel);
    this.broadcastChannelCreated(channel);

    console.log('Channel auto-created:', {
      channelId: channel.id,
      documentId: submission.documentId,
      members: uniqueMembers,
      source: submission.source
    });

    return channel;
  }

  private static saveChannel(channel: ChatChannel): void {
    try {
      const existingChannels = this.getChannels();

      const existingIndex = existingChannels.findIndex(
        ch => ch.documentId === channel.documentId
      );

      if (existingIndex >= 0) {
        existingChannels[existingIndex] = channel;
      } else {
        existingChannels.push(channel);
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingChannels));
    } catch (error) {
      console.error('Failed to save channel:', error);
    }
  }

  static getChannels(): ChatChannel[] {
    try {
      const channelsJson = localStorage.getItem(this.STORAGE_KEY);
      return channelsJson ? JSON.parse(channelsJson) : [];
    } catch (error) {
      console.error('Failed to load channels:', error);
      return [];
    }
  }

  static getUserChannels(userId: string): ChatChannel[] {
    const allChannels = this.getChannels();
    return allChannels.filter(channel => 
      channel.members.includes(userId) || channel.createdBy === userId
    );
  }

  static getChannelByDocumentId(documentId: string): ChatChannel | null {
    const channels = this.getChannels();
    return channels.find(ch => ch.documentId === documentId) || null;
  }

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

  private static broadcastChannelCreated(channel: ChatChannel): void {
    const event = new CustomEvent('channel-created', {
      detail: { channel }
    });
    window.dispatchEvent(event);

    window.dispatchEvent(new StorageEvent('storage', {
      key: this.STORAGE_KEY,
      newValue: JSON.stringify(this.getChannels()),
      storageArea: localStorage
    }));
  }

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

export const channelAutoCreationService = ChannelAutoCreationService;
