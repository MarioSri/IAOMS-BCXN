import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { DecentralizedChatService } from '@/services/DecentralizedChatService';
import {
  ChatChannel,
  ChatMessage,
  ChatUser,
  MessageType,
  ChatNotification,
  SignatureRequest,
  ChatPoll,
  MessageAttachment,
  UserRole,
  MessageReaction
} from '@/types/chat';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';

import {
  Send,
  SendHorizontal,
  Paperclip,
  Smile,

  Settings,
  Search,
  Hash,
  Lock,
  Users,
  Bell,
  BellOff,
  Pin,
  MoreVertical,
  Reply,
  Edit,
  Trash2,
  FileText,
  Image,
  Download,
  Eye,
  ThumbsUp,
  MessageSquare,
  PenTool,
  BarChart3,
  Zap,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Mic,
  MicOff,
  Menu,
  PanelRightOpen,
  PanelLeftOpen,
  X,
  Plus,
  UserPlus,
  UserRoundPlus,
  Copy,
  CheckSquare,
  Clock
} from 'lucide-react';
import EmojiPicker, { Theme } from 'emoji-picker-react';

interface ChatInterfaceProps {
  className?: string;
  channelMessageCounts?: { [key: string]: number };
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ className, channelMessageCounts = {} }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isMobile } = useResponsive();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Chat service
  const [chatService] = useState(() => new DecentralizedChatService(
    import.meta.env.VITE_WS_URL || 'ws://localhost:3001',
    import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
  ));

  // State
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [activeChannel, setActiveChannel] = useState<ChatChannel | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [availableRecipients, setAvailableRecipients] = useState<ChatUser[]>([]);
  const [notifications, setNotifications] = useState<ChatNotification[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<string>('connecting');

  // UI State
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [showSidebar, setShowSidebar] = useState(!isMobile);

  useEffect(() => {
    if (isMobile) {
      setShowSidebar(false);
    }
  }, [isMobile]);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollTitle, setPollTitle] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [showNewChannelModal, setShowNewChannelModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelRecipients, setNewChannelRecipients] = useState<string[]>([]);
  const [isPrivateChannel, setIsPrivateChannel] = useState(false);
  const [showAddRecipientsModal, setShowAddRecipientsModal] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedChannelsToDelete, setSelectedChannelsToDelete] = useState<string[]>([]);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const [showChannelMembersModal, setShowChannelMembersModal] = useState(false);
  const [selectedChannelForMembers, setSelectedChannelForMembers] = useState<ChatChannel | null>(null);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [pinnedMessages, setPinnedMessages] = useState<string[]>([]);
  const [polls, setPolls] = useState<{ [key: string]: ChatPoll }>({});
  const [showPollVotesModal, setShowPollVotesModal] = useState(false);
  const [selectedPollId, setSelectedPollId] = useState<string | null>(null);
  const [privateReplyTo, setPrivateReplyTo] = useState<ChatMessage | null>(null);
  const [showPrivateReplyModal, setShowPrivateReplyModal] = useState(false);
  const [privateReplyMessage, setPrivateReplyMessage] = useState('');

  // Handle click outside emoji picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  // Filtered messages calculation (Outside JSX to follow Rules of Hooks)
  const filteredMessages = useMemo(() => {
    if (!activeChannel) return [];
    return messages.filter(message =>
      !searchQuery ||
      message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (users.find(u => u.id === message.senderId)?.fullName || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [messages, searchQuery, users, activeChannel]);

  // Memoized default channels for instant loading
  const defaultChannels = useMemo(() => {
    if (!user || user.role !== 'demo-work') return [];
    const channels: ChatChannel[] = [
      {
        id: 'general',
        name: 'General',
        description: 'General communication channel',
        type: 'general',
        members: [user.id, 'principal', 'registrar', 'hod-cse', 'dean'],
        admins: [user.id],
        isPrivate: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: user.id,
        pinnedMessages: [],
        settings: {
          allowFileUploads: true,
          allowPolls: true,
          allowSignatureRequests: true,
          requireModeration: false,
          autoArchive: false,
          notificationLevel: 'all'
        }
      },
      {
        id: 'admin-council',
        name: 'Administrative Council',
        description: 'Council for administrators',
        type: 'role-based',
        members: [user.id, 'principal', 'registrar', 'dean'],
        admins: [user.id],
        isPrivate: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: user.id,
        pinnedMessages: [],
        settings: {
          allowFileUploads: true,
          allowPolls: true,
          allowSignatureRequests: true,
          requireModeration: true,
          autoArchive: false,
          notificationLevel: 'all'
        }
      },
      {
        id: 'faculty-board',
        name: 'Faculty Board',
        description: 'Board for faculty members',
        type: 'department',
        members: [user.id, 'hod-cse', 'hod-eee', 'dean'],
        admins: [user.id],
        isPrivate: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: user.id,
        pinnedMessages: [],
        settings: {
          allowFileUploads: true,
          allowPolls: true,
          allowSignatureRequests: true,
          requireModeration: false,
          autoArchive: false,
          notificationLevel: 'all'
        }
      }
    ];
    return channels;
  }, [user]);

  // Memoized users for instant loading
  const defaultUsers = useMemo(() => {
    if (!user || user.role !== 'demo-work') return [];
    return [
      {
        id: 'user-1',
        username: 'principal',
        email: 'principal@example.com',
        fullName: 'Dr. Principal',
        role: 'principal' as any,
        isOnline: true,
        lastSeen: new Date(),
        status: 'available' as const,
        avatar: ''
      },
      {
        id: 'user-2',
        username: 'registrar',
        email: 'registrar@example.com',
        fullName: 'Prof. Registrar',
        role: 'registrar' as any,
        isOnline: true,
        lastSeen: new Date(),
        status: 'available' as const,
        avatar: ''
      },
      {
        id: user.id,
        username: user.id,
        email: user.email,
        fullName: user.name || 'You',
        role: user.role as any,
        isOnline: true,
        lastSeen: new Date(),
        status: 'available' as const,
        avatar: ''
      }
    ];
  }, [user]);

  // Load real recipients from MOCK_RECIPIENTS
  useEffect(() => {
    if (user?.role !== 'demo-work') return;
    const loadRecipients = async () => {
      try {
        const { MOCK_RECIPIENTS } = await import('@/contexts/AuthContext');
        const recipients: ChatUser[] = MOCK_RECIPIENTS.map(r => ({
          id: r.user_id,
          username: r.user_id,
          email: r.email || `${r.user_id}@example.com`,
          fullName: r.name,
          role: r.role as UserRole,
          department: r.department as any,
          isOnline: true,
          lastSeen: new Date(),
          status: 'available',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.name}`
        }));
        setAvailableRecipients(recipients);

        // Update default channel and others with proper types
        const initialChannel: ChatChannel = {
          id: 'general',
          name: 'General Announcements',
          description: 'Institution-wide announcements and updates',
          type: 'general',
          members: recipients.map(r => r.id),
          admins: [recipients[0]?.id],
          isPrivate: false,
          createdBy: 'system',
          createdAt: new Date(),
          updatedAt: new Date(),
          pinnedMessages: [],
          settings: {
            allowFileUploads: true,
            allowPolls: true,
            allowSignatureRequests: true,
            requireModeration: true,
            autoArchive: false,
            notificationLevel: 'all'
          }
        };
        setChannels([initialChannel]);
        setActiveChannel(initialChannel);
      } catch (error) {
        console.error('Failed to load recipients:', error);
      }
    };
    loadRecipients();
  }, [setAvailableRecipients, user]);

  // Optimized initialization for instant loading
  useEffect(() => {
    if (!user) return;

    // Instant setup with default data
    setUsers(defaultUsers);
    setChannels(defaultChannels);
    if (defaultChannels.length > 0) {
      setActiveChannel(defaultChannels[0]);
    }
    setConnectionStatus('connected');

    // Background initialization (non-blocking)
    const initChatBackground = async () => {
      try {
        const documentChannels = JSON.parse(localStorage.getItem('document-channels') || '[]');
        const userDocumentChannels = documentChannels.filter((channel: any) =>
          channel.members.includes(user.id) || channel.createdBy === user.id
        );

        if (userDocumentChannels.length > 0) {
          const allChannels = [...userDocumentChannels, ...defaultChannels].map(channel => ({
            ...channel,
            members: channel.members?.length > 0 ? channel.members : (user?.role === 'demo-work' ? [user.id, 'principal', 'registrar', 'dean'] : [user.id])
          }));
          setChannels(allChannels);
        }
      } catch (error) {
        // Keep default channels on error
      }
    };

    // Run background init after component is mounted
    setTimeout(initChatBackground, 0);

    // Optimized event listeners
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'document-channels') {
        initChatBackground();
      }
    };

    // Subscribe to connection status
    const handleConnected = () => setConnectionStatus('connected');
    const handleDisconnected = () => setConnectionStatus('disconnected');
    const handleOfflineMode = () => setConnectionStatus('offline');

    chatService.on('connected', handleConnected);
    chatService.on('disconnected', handleDisconnected);
    chatService.on('offline-mode', handleOfflineMode);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      chatService.off('connected', handleConnected);
      chatService.off('disconnected', handleDisconnected);
      chatService.off('offline-mode', handleOfflineMode);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user, defaultChannels, defaultUsers, chatService]);

  // Memoized sample messages for instant loading
  const getSampleMessages = useCallback((channelId: string): ChatMessage[] => {
    if (user?.role !== 'demo-work') return [];
    return [
      {
        id: 'msg-1',
        channelId,
        senderId: 'user-1',
        content: 'Here are the project documents',
        type: 'file' as MessageType,
        timestamp: new Date(Date.now() - 3600000),
        status: 'delivered',
        reactions: [],
        mentions: [],
        attachments: [
          {
            id: 'att-1',
            name: 'project-report.pdf',
            url: 'mock://project-report.pdf',
            type: 'document',
            size: 2048576,
            mimeType: 'application/pdf'
          }
        ],
        metadata: {},
        readBy: []
      },
      {
        id: 'msg-2',
        channelId,
        senderId: 'user-2',
        content: 'Meeting photos from yesterday',
        type: 'image' as MessageType,
        timestamp: new Date(Date.now() - 1800000),
        status: 'delivered',
        reactions: [],
        mentions: [],
        attachments: [
          {
            id: 'att-2',
            name: 'meeting-photo.jpg',
            url: 'mock://meeting-photo.jpg',
            type: 'image',
            size: 1024000,
            mimeType: 'image/jpeg'
          }
        ],
        metadata: {},
        readBy: []
      }
    ];
  }, [user?.role]);

  const scrollToBottom = useCallback((force = false) => {
    if (force) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      });
    }
  }, []);

  const loadMessages = useCallback(async (channelId: string) => {
    // Instant loading with sample messages
    const sampleMessages = getSampleMessages(channelId);
    setMessages(sampleMessages);
    scrollToBottom(true);

    // Background loading (non-blocking)
    try {
      const channelMessages = await chatService.getMessages(channelId);
      if (channelMessages.length > 0) {
        setMessages([...sampleMessages, ...channelMessages]);
        scrollToBottom(true);
      }
    } catch (error) {
      // Keep sample messages on error
    }
  }, [chatService, getSampleMessages, scrollToBottom]);

  // Load messages when active channel changes
  useEffect(() => {
    if (activeChannel) {
      loadMessages(activeChannel.id);
    }
  }, [activeChannel, loadMessages]);

  // Subscribe to real-time message updates
  useEffect(() => {
    const handleMessageReceived = (message: ChatMessage) => {
      if (message.channelId === activeChannel?.id) {
        setMessages(prev => [...prev, message]);
        scrollToBottom(true);
      }
    };

    const handleUserTyping = (data: any) => {
      if (data.channelId === activeChannel?.id && data.userId !== user?.id) {
        setTypingUsers(prev => [...new Set([...prev, data.userId])]);
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(id => id !== data.userId));
        }, 3000);
      }
    };

    chatService.on('message-received', handleMessageReceived);
    chatService.on('user-typing', handleUserTyping);

    return () => {
      chatService.off('message-received', handleMessageReceived);
      chatService.off('user-typing', handleUserTyping);
    };
  }, [activeChannel, chatService, user, scrollToBottom]);

  // Optimized cleanup function for auto-delete messages after 24 hours
  const cleanupMessages = useCallback(() => {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    setMessages(prev => {
      const filtered = prev.filter(message => {
        const messageTime = new Date(message.timestamp);
        return messageTime > twentyFourHoursAgo;
      });

      // Log deleted messages count for debugging
      if (filtered.length !== prev.length) {
        console.log(`Auto-deleted ${prev.length - filtered.length} message(s) older than 24 hours`);
        toast({
          title: 'Messages Cleaned',
          description: `${prev.length - filtered.length} old message(s) automatically deleted`,
          variant: 'default'
        });
      }

      return filtered.length !== prev.length ? filtered : prev;
    });
  }, [toast]);

  // Cleanup function for auto-delete channels after 1 week (7 days)
  const cleanupChannels = useCallback(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    setChannels(prev => {
      const filtered = prev.filter(channel => {
        const channelCreationTime = new Date(channel.createdAt);
        // Keep channels that are newer than 1 week
        return channelCreationTime > oneWeekAgo;
      });

      // Check if active channel was deleted
      if (activeChannel && !filtered.find(ch => ch.id === activeChannel.id)) {
        setActiveChannel(filtered.length > 0 ? filtered[0] : null);
      }

      // Log deleted channels count for debugging
      if (filtered.length !== prev.length) {
        console.log(`Auto-deleted ${prev.length - filtered.length} channel(s) older than 1 week`);
        toast({
          title: 'Channels Cleaned',
          description: `${prev.length - filtered.length} old channel(s) automatically deleted`,
          variant: 'default'
        });
      }

      return filtered.length !== prev.length ? filtered : prev;
    });
  }, [activeChannel, toast]);

  // Auto-delete messages after 24 hours - runs every hour
  useEffect(() => {
    // Run cleanup every hour
    const interval = setInterval(cleanupMessages, 60 * 60 * 1000);

    // Initial cleanup
    cleanupMessages();

    return () => clearInterval(interval);
  }, [cleanupMessages]);

  // Auto-delete channels after 1 week - runs every day
  useEffect(() => {
    // Run cleanup every 24 hours
    const interval = setInterval(cleanupChannels, 24 * 60 * 60 * 1000);

    // Initial cleanup
    cleanupChannels();

    return () => clearInterval(interval);
  }, [cleanupChannels]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !activeChannel || !user) return;

    const messageData = {
      channelId: activeChannel.id,
      senderId: user.id,
      type: 'text' as MessageType,
      content: messageInput.trim(),
      parentMessageId: replyingTo?.id
    };

    try {
      const message = await chatService.sendMessage(messageData);
      setMessages(prev => [...prev, message]);
      setMessageInput('');
      setReplyingTo(null);
      scrollToBottom(true);

      if (isTyping) {
        setIsTyping(false);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeChannel || !user) return;

    try {
      const fileUrl = await chatService.uploadFile(file, activeChannel.id);

      const messageData = {
        channelId: activeChannel.id,
        senderId: user.id,
        type: getFileType(file),
        content: `Shared ${file.name}`,
        attachments: [{
          id: Date.now().toString(),
          name: file.name,
          url: fileUrl,
          type: (getFileType(file) === 'file' ? 'document' : getFileType(file)) as any,
          size: file.size,
          mimeType: file.type
        }]
      };

      const message = await chatService.sendMessage(messageData);
      setMessages(prev => [...prev, message]);
    } catch (error) {
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload file',
        variant: 'destructive'
      });
    }
  };

  const getFileType = (file: File): MessageType => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.includes('pdf') || file.type.includes('document')) return 'document';
    return 'file' as MessageType;
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    try {
      await chatService.editMessage(messageId, newContent);
      setMessages(prev => prev.map(msg =>
        msg.id === messageId
          ? { ...msg, content: newContent, editedAt: new Date() }
          : msg
      ));
      setEditingMessage(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to edit message',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await chatService.deleteMessage(messageId);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete message',
        variant: 'destructive'
      });
    }
  };

  const handleVoiceRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        const audioChunks: Blob[] = [];

        recorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };

        recorder.onstop = async () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          const audioFile = new File([audioBlob], `voice-${Date.now()}.wav`, { type: 'audio/wav' });

          if (activeChannel && user) {
            try {
              const fileUrl = await chatService.uploadFile(audioFile, activeChannel.id);

              const messageData = {
                channelId: activeChannel.id,
                senderId: user.id,
                type: 'audio' as MessageType,
                content: 'Voice message',
                attachments: [{
                  id: Date.now().toString(),
                  name: audioFile.name,
                  url: fileUrl,
                  type: 'audio',
                  size: audioFile.size,
                  mimeType: audioFile.type
                } as MessageAttachment]
              };

              const message = await chatService.sendMessage(messageData);
              setMessages(prev => [...prev, message]);

              toast({
                title: 'Voice message sent',
                description: 'Your voice message has been sent successfully',
                variant: 'default'
              });
            } catch (error) {
              toast({
                title: 'Upload Failed',
                description: 'Failed to send voice message',
                variant: 'destructive'
              });
            }
          }

          stream.getTracks().forEach(track => track.stop());
        };

        setMediaRecorder(recorder);
        recorder.start();
        setIsRecording(true);
      } catch (error) {
        toast({
          title: 'Recording failed',
          description: 'Could not access microphone',
          variant: 'destructive'
        });
      }
    } else {
      if (mediaRecorder) {
        mediaRecorder.stop();
        setIsRecording(false);
        setMediaRecorder(null);
      }
    }
  };

  const handleCreateSignatureRequest = async () => {
    if (!activeChannel || !user) return;

    const signatureRequest = {
      messageId: '',
      documentId: 'temp-doc-id',
      requestedBy: user.id,
      targetUsers: activeChannel.members,
      title: 'Signature Required',
      description: 'Please review and sign this document',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };

    try {
      const request = await chatService.createSignatureRequest(signatureRequest);

      const messageData = {
        channelId: activeChannel.id,
        senderId: user.id,
        type: 'signature-request' as MessageType,
        content: 'Signature request created',
        metadata: {
          signatureRequestId: request.id
        }
      };

      const message = await chatService.sendMessage(messageData);
      setMessages(prev => [...prev, message]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create signature request',
        variant: 'destructive'
      });
    }
  };

  const handleCreatePoll = async (title: string, options: string[]) => {
    if (!activeChannel || !user) return;

    const pollId = `poll-${Date.now()}`;
    const poll: ChatPoll = {
      id: pollId,
      messageId: '', // Will be updated after sending message
      channelId: activeChannel.id,
      createdBy: user.id,
      title,
      options: options.map((option, index) => ({
        id: `option-${index}`,
        text: option,
        votes: []
      })),
      type: 'single-choice',
      allowAnonymous: false,
      status: 'active',
      results: { totalVotes: 0, breakdown: [] },
      createdAt: new Date()
    };

    try {
      setPolls(prev => ({ ...prev, [pollId]: poll }));

      const messageData = {
        channelId: activeChannel.id,
        senderId: user.id,
        type: 'poll' as MessageType,
        content: `Poll created: ${title}`,
        metadata: {
          pollId
        }
      };

      const message = await chatService.sendMessage(messageData);
      setMessages(prev => [...prev, message]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create poll',
        variant: 'destructive'
      });
    }
  };

  const handleVoteOnPoll = (pollId: string, optionId: string) => {
    if (!user) return;

    setPolls(prev => {
      const poll = prev[pollId];
      if (!poll) return prev;

      const updatedOptions = poll.options.map(option => {
        if (option.id === optionId) {
          const personalVote = option.votes.find(v => v.userId === user.id);
          return {
            ...option,
            votes: personalVote
              ? option.votes.filter(v => v.userId !== user.id)
              : [...option.votes, { userId: user.id, optionId, timestamp: new Date() }]
          };
        } else {
          return {
            ...option,
            votes: option.votes.filter(v => v.userId !== user.id)
          };
        }
      });

      return {
        ...prev,
        [pollId]: {
          ...poll,
          options: updatedOptions
        }
      };
    });
  };

  const getPollResults = (pollId: string) => {
    const poll = polls[pollId];
    if (!poll) return { totalVotes: 0, options: [] };

    const totalVotes = poll.options.reduce((sum, option) => sum + option.votes.length, 0);
    const optionsWithPercentage = poll.options.map(option => ({
      ...option,
      percentage: totalVotes > 0 ? Math.round((option.votes.length / totalVotes) * 100) : 0
    }));

    return { totalVotes, options: optionsWithPercentage };
  };

  const showNotification = (notification: Partial<ChatNotification>) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title || 'New Message', {
        body: notification.message,
        icon: '/favicon.ico'
      });
    }
  };

  const handleDownloadFile = async (attachment: any) => {
    try {
      // For demo purposes, create a mock file if URL doesn't exist
      if (!attachment.url || attachment.url.startsWith('mock://') || attachment.url.includes('placeholder')) {
        const mockContent = createMockFile(attachment);
        const blob = new Blob([mockContent], { type: attachment.mimeType || 'application/octet-stream' });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = attachment.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        // Try to fetch real file
        const response = await fetch(attachment.url);
        if (!response.ok) throw new Error('File not found');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = attachment.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }

      toast({
        title: 'Download Started',
        description: `Downloaded ${attachment.name}`,
        variant: 'default'
      });
    } catch (error) {
      // Fallback: create mock file even if fetch fails
      try {
        const mockContent = createMockFile(attachment);
        const blob = new Blob([mockContent], { type: attachment.mimeType || 'application/octet-stream' });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = attachment.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast({
          title: 'Download Started',
          description: `Downloaded ${attachment.name} (demo file)`,
          variant: 'default'
        });
      } catch (fallbackError) {
        toast({
          title: 'Download Failed',
          description: 'Unable to download file',
          variant: 'destructive'
        });
      }
    }
  };

  const createMockFile = (attachment: any) => {
    if (attachment.type === 'image') {
      // Create a simple SVG image
      return `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f0f0f0"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial" font-size="16">
          ${attachment.name}
        </text>
      </svg>`;
    } else {
      // Create a text file with file info
      return `File: ${attachment.name}
Type: ${attachment.type}
Size: ${attachment.size || 'Unknown'}

This is a demo file from the IAOMS chat system.
Generated on: ${new Date().toLocaleString()}`;
    }
  };

  const handleDeleteChannels = () => {
    if (selectedChannelsToDelete.length === 0 || !user) return;

    setChannels(prev => prev.filter(channel => !selectedChannelsToDelete.includes(channel.id)));

    if (activeChannel && selectedChannelsToDelete.includes(activeChannel.id)) {
      const remainingChannels = channels.filter(channel => !selectedChannelsToDelete.includes(channel.id));
      setActiveChannel(remainingChannels.length > 0 ? remainingChannels[0] : null);
    }

    toast({
      title: 'Channels Deleted',
      description: `${selectedChannelsToDelete.length} channel(s) deleted successfully`,
      variant: 'default'
    });

    setSelectedChannelsToDelete([]);
    setDeleteMode(false);
    setShowDeleteConfirmation(false);
  };

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle2 className="w-3 h-3 text-blue-500" />;
      case 'read': return <CheckCircle2 className="w-3 h-3 text-green-500" />;
      case 'failed': return <AlertTriangle className="w-3 h-3 text-red-500" />;
      default: return <Lock className="w-3 h-3 text-gray-400" />;
    }
  };

  const formatTimestamp = (timestamp: Date | string | number) => {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const handleCopyMessage = (message: ChatMessage) => {
    navigator.clipboard.writeText(message.content);
    toast({
      title: 'Copied',
      description: 'Message copied to clipboard',
      variant: 'default'
    });
  };

  const handleSelectMessage = (messageId: string) => {
    setSelectedMessages(prev =>
      prev.includes(messageId)
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
  };

  const handlePinMessage = (messageId: string) => {
    setPinnedMessages(prev =>
      prev.includes(messageId)
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
    const isPinned = pinnedMessages.includes(messageId);
    toast({
      title: isPinned ? 'Unpinned' : 'Pinned',
      description: `Message ${isPinned ? 'unpinned' : 'pinned'} successfully`,
      variant: 'default'
    });
  };

  const handleReplyPrivately = (message: ChatMessage) => {
    setPrivateReplyTo(message);
    setShowPrivateReplyModal(true);

    toast({
      title: 'Private Reply',
      description: `Starting private conversation with ${users.find(u => u.id === message.senderId)?.fullName || 'user'}`,
      variant: 'default'
    });
  };

  const handleSendPrivateReply = async () => {
    if (!privateReplyTo || !privateReplyMessage.trim() || !user) return;

    try {
      // Create or find private channel with the sender
      const recipientId = privateReplyTo.senderId;
      const recipient = users.find(u => u.id === recipientId);

      if (!recipient) {
        toast({
          title: 'Error',
          description: 'Could not find the recipient user',
          variant: 'destructive'
        });
        return;
      }

      // Create a private channel name that's consistent regardless of who creates it
      const channelName = [user.id, recipientId].sort().join('-private-');

      // Check if private channel already exists
      let privateChannel = channels.find(ch => ch.name === channelName && ch.isPrivate);

      if (!privateChannel) {
        // Create new private channel
        privateChannel = {
          id: `private-${Date.now()}`,
          name: channelName,
          description: `Private chat between ${user.name || 'You'} and ${recipient.fullName}`,
          type: 'private',
          isPrivate: true,
          members: [user.id, recipientId],
          admins: [user.id, recipientId],
          createdAt: new Date(),
          createdBy: user.id,
          updatedAt: new Date(),
          pinnedMessages: [],
          settings: {
            allowFileUploads: true,
            allowPolls: false,
            allowSignatureRequests: true,
            requireModeration: false,
            autoArchive: false,
            notificationLevel: 'all'
          }
        };

        setChannels(prev => [...prev, privateChannel]);
      }

      // Send the private reply with reference to original message
      const privateReplyMessageData = {
        channelId: privateChannel.id,
        senderId: user.id,
        type: 'text' as MessageType,
        content: privateReplyMessage,
        metadata: {
          replyToPrivate: privateReplyTo.id,
          originalChannelId: privateReplyTo.channelId,
          originalMessageContent: privateReplyTo.content.substring(0, 100) + (privateReplyTo.content.length > 100 ? '...' : '')
        }
      };

      const message = await chatService.sendMessage(privateReplyMessageData);
      setMessages(prev => [...prev, message]);

      // Switch to the private channel
      setActiveChannel(privateChannel);

      // Clear the private reply state
      setPrivateReplyMessage('');
      setPrivateReplyTo(null);
      setShowPrivateReplyModal(false);

      toast({
        title: 'Private Reply Sent',
        description: `Your private message was sent to ${recipient.fullName}`,
        variant: 'default'
      });

    } catch (error) {
      console.error('Failed to send private reply:', error);
      toast({
        title: 'Error',
        description: 'Failed to send private reply',
        variant: 'destructive'
      });
    }
  };



  const handleReactToMessage = (messageId: string, emoji: string = '👍') => {
    if (!user) return;

    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const existingReaction = msg.reactions.find(r => r.emoji === emoji);
        if (existingReaction) {
          // If user already reacted, don't add again (or logic to toggle could be added here)
          // For now, assuming we just increment check if user is already in userIds
          if (existingReaction.userIds.includes(user.id)) {
            return msg; // User already reacted
          }

          return {
            ...msg,
            reactions: msg.reactions.map(r =>
              r.emoji === emoji
                ? { ...r, count: r.count + 1, userIds: [...r.userIds, user.id] }
                : r
            )
          };
        } else {
          return {
            ...msg,
            reactions: [...msg.reactions, { emoji, count: 1, userIds: [user.id] }]
          };
        }
      }
      return msg;
    }));
    toast({
      title: 'Reaction Added',
      description: `Added ${emoji} reaction to message`,
      variant: 'default'
    });
  };

  const MessageComponent: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isOwnMessage = message.senderId === user?.id;
    const isSystemMessage = message.senderId === 'system';
    const sender = users.find(u => u.id === message.senderId);

    return (
      <div className={cn(
        "flex gap-2 sm:gap-3 p-1.5 sm:p-2 hover:bg-muted/50 group",
        isOwnMessage && "flex-row-reverse",
        isSystemMessage && "justify-center",
        selectedMessages.includes(message.id) && "bg-blue-50 border-l-4 border-l-blue-500",
        pinnedMessages.includes(message.id) && "bg-yellow-50 border border-yellow-200"
      )}>
        {!isSystemMessage && (
          <Avatar className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0">
            <AvatarImage src={sender?.avatar} />
            <AvatarFallback className="text-[10px] sm:text-xs">
              {sender?.fullName?.substring(0, 2).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        )}

        <div className={cn(
          "flex-1 min-w-0",
          isOwnMessage && "text-right",
          isSystemMessage && "text-center"
        )}>
          {!isSystemMessage && (
            <div className={cn("flex items-center gap-1.5 sm:gap-2 mb-1", isOwnMessage && "justify-end")}>
              <span className="text-xs sm:text-sm font-medium">
                {isOwnMessage ? 'You' : sender?.fullName || 'User'}
              </span>
              <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                {formatTimestamp(message.timestamp)}
              </span>
              {message.editedAt && (
                <span className="text-[10px] sm:text-xs text-muted-foreground">(edited)</span>
              )}
              {getMessageStatusIcon(message.status)}
            </div>
          )}

          {message.parentMessageId && (
            <div className="text-xs text-muted-foreground mb-2 p-2 bg-muted rounded">
              Replying to a message
            </div>
          )}

          {message.metadata?.replyToPrivate && (
            <div className="text-xs text-purple-600 mb-2 p-2 bg-purple-50 border border-purple-200 rounded flex items-center gap-1">
              <Lock className="w-3 h-3" />
              <span className="font-medium">Private Reply</span>
              <span className="text-purple-500">
                • Re: "{message.metadata.originalMessageContent}"
              </span>
            </div>
          )}

          {editingMessage?.id === message.id ? (
            <div className={cn(
              "inline-block p-3 rounded-lg w-full",
              message.metadata.pollId ? "max-w-full" : "max-w-[80%]",
              isOwnMessage
                ? "bg-gray-200 text-gray-900"
                : "bg-muted"
            )}>
              <div className="space-y-2">
                <Textarea
                  value={editingMessage.content}
                  onChange={(e) => setEditingMessage({ ...editingMessage, content: e.target.value })}
                  className="min-h-[60px] w-full resize-none text-base sm:text-sm"
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="outline" onClick={() => setEditingMessage(null)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={() => handleEditMessage(message.id, editingMessage.content)}>
                    Save
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className={cn(
              "inline-block p-2.5 sm:p-3 rounded-lg shadow-sm border sm:border-none",
              message.metadata?.pollId ? "max-w-full" : "max-w-[85%] sm:max-w-[80%]",
              isSystemMessage
                ? "bg-blue-50 text-blue-800 border-blue-200 text-xs sm:text-sm"
                : isOwnMessage
                  ? "bg-primary/10 sm:bg-gray-200 text-foreground sm:text-gray-900 border-primary/20"
                  : "bg-muted text-foreground border-muted-foreground/10"
            )}>
              <p className={cn(
                "whitespace-pre-wrap",
                isSystemMessage ? "text-sm font-medium" : "text-sm"
              )}>
                {message.content}
              </p>

              {message.attachments && message.attachments.length > 0 && (
                <div className="mt-2 space-y-2">
                  {message.attachments.map(attachment => (
                    <div key={attachment.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded hover:bg-muted/70 transition-colors">
                      {attachment.type === 'image' ? (
                        <Image className="w-4 h-4 text-blue-500" />
                      ) : (
                        <FileText className="w-4 h-4 text-green-500" />
                      )}
                      <span
                        className="text-sm cursor-pointer hover:underline flex-1"
                        onClick={() => handleDownloadFile(attachment)}
                        title={`Click to download ${attachment.name}`}
                      >
                        {attachment.name}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownloadFile(attachment)}
                        title={`Download ${attachment.name}`}
                        className="hover:bg-primary/10"
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {message.metadata.signatureRequestId && (
                <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border">
                  <div className="flex items-center gap-2">
                    <PenTool className="w-4 h-4" />
                    <span className="text-sm font-medium">Signature Request</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Please review and sign the attached document
                  </p>
                  <Button size="sm" className="mt-2">
                    View & Sign
                  </Button>
                </div>
              )}

              {message.metadata.pollId && (() => {
                const pollResults = getPollResults(message.metadata.pollId);
                const poll = polls[message.metadata.pollId];
                const userVote = poll?.options.find(opt => opt.votes.some(v => v.userId === user?.id));

                return (
                  <div className="mt-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-blue-600" />
                        <h4 className="font-semibold text-base">{poll?.title || 'Poll'}</h4>
                      </div>

                      <div className="space-y-2">
                        {pollResults.options.map((option) => {
                          const isSelected = userVote?.id === option.id;
                          return (
                            <div key={option.id} className="space-y-1">
                              <div
                                className="flex items-center gap-2 cursor-pointer hover:bg-white/50 p-2 rounded"
                                onClick={() => handleVoteOnPoll(message.metadata.pollId, option.id)}
                              >
                                <div className="w-4 h-4 border-2 border-blue-600 rounded-full flex items-center justify-center">
                                  {isSelected && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
                                </div>
                                <span className="text-sm flex-1">{option.text}</span>
                                <span className="text-xs text-muted-foreground">{option.votes.length}</span>
                              </div>
                              <div className="ml-6">
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${option.percentage}%` }}></div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-3"
                        onClick={() => {
                          setSelectedPollId(message.metadata.pollId);
                          setShowPollVotesModal(true);
                        }}
                      >
                        View votes ({pollResults.totalVotes})
                      </Button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {message.reactions.length > 0 && (
            <div className="flex gap-1 mt-1">
              {message.reactions.map(reaction => (
                <Button
                  key={reaction.emoji}
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs"
                >
                  {reaction.emoji} {reaction.count}
                </Button>
              ))}
            </div>
          )}
        </div>

        {!isSystemMessage && (
          <div className="opacity-100 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0 self-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                  <MoreVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleCopyMessage(message)}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => setReplyingTo(message)}>
                  <Reply className="w-4 h-4 mr-2" />
                  Reply
                </DropdownMenuItem>
                {!isOwnMessage && (
                  <DropdownMenuItem onClick={() => {
                    handleReplyPrivately(message);
                  }}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Reply Privately
                  </DropdownMenuItem>
                )}
                {isOwnMessage && (
                  <>
                    <DropdownMenuItem onClick={() => setEditingMessage(message)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteMessage(message.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem onClick={() => {
                  handleReactToMessage(message.id, '👍');
                }}>
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  React
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    );
  };

  const ChannelSidebar: React.FC = () => (
    <>
      {/* Mobile Overlay */}
      {showSidebar && (
        <div
          className="absolute inset-0 bg-background/80 backdrop-blur-sm z-20 sm:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}
      <div className={cn(
        "border-r bg-background flex flex-col transition-all duration-300 ease-in-out",
        "absolute inset-y-0 left-0 z-30 h-full sm:relative",
        showSidebar ? "w-[85vw] sm:w-64 translate-x-0 shadow-xl sm:shadow-none" : "-translate-x-full w-0 sm:w-0 sm:translate-x-0 overflow-hidden"
      )}>
        <div className="p-4 border-t">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Lock className="w-4 h-4 text-yellow-500 flex-shrink-0" />
              <h3 className="font-semibold flex-shrink-0 text-sm">Channels</h3>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 sm:hidden"
                onClick={() => setShowSidebar(false)}
              >
                <X className="w-4 h-4" />
              </Button>
              {deleteMode ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setDeleteMode(false);
                      setSelectedChannelsToDelete([]);
                    }}
                    className="whitespace-nowrap h-8 px-2 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setShowDeleteConfirmation(true)}
                    disabled={selectedChannelsToDelete.length === 0}
                    className="whitespace-nowrap h-8 px-2 text-xs"
                  >
                    Delete ({selectedChannelsToDelete.length})
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleteMode(true)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
          <div className="mt-2 p-2 bg-yellow-500/10 rounded-md border border-yellow-500/20">
            <p className="text-xs text-yellow-700 dark:text-yellow-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              <span>Auto-delete: Channels after 7 days</span>
            </p>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {/* Add default channels with message counts if none exist */}
            {channels.length === 0 && user?.role === 'demo-work' && ([
              {
                id: 'admin-council',
                name: 'Administrative Council',
                description: 'Official communication channel for administrative council',
                type: 'role-based' as const,
                isPrivate: false,
                members: ['user-1', 'principal', 'registrar', 'dean'],
                admins: ['principal'],
                createdAt: new Date(),
                createdBy: 'user-1',
                updatedAt: new Date(),
                pinnedMessages: [],
                settings: {
                  allowFileUploads: true,
                  allowPolls: true,
                  allowSignatureRequests: true,
                  requireModeration: true,
                  autoArchive: false,
                  notificationLevel: 'all' as const
                }
              },
              {
                id: 'faculty-board',
                name: 'Faculty Board',
                description: 'General discussion for all faculty members',
                type: 'role-based' as const,
                isPrivate: false,
                members: ['user-1', 'hod-cse', 'hod-eee', 'dean'],
                admins: ['dean'],
                createdAt: new Date(),
                createdBy: 'user-1',
                updatedAt: new Date(),
                pinnedMessages: [],
                settings: {
                  allowFileUploads: true,
                  allowPolls: true,
                  allowSignatureRequests: false,
                  requireModeration: false,
                  autoArchive: false,
                  notificationLevel: 'all' as const
                }
              },
              {
                id: 'general',
                name: 'General',
                description: 'General announcements and discussion',
                type: 'general' as const,
                isPrivate: false,
                members: ['user-1', 'principal', 'registrar', 'hod-cse', 'dean'],
                admins: ['principal'],
                createdAt: new Date(),
                createdBy: 'user-1',
                updatedAt: new Date(),
                pinnedMessages: [],
                settings: {
                  allowFileUploads: true,
                  allowPolls: true,
                  allowSignatureRequests: false,
                  requireModeration: false,
                  autoArchive: false,
                  notificationLevel: 'all' as const
                }
              }
            ] as ChatChannel[]).map(channel => (
              <div key={channel.id} className="flex items-center gap-1">
                {deleteMode && (
                  <input
                    type="checkbox"
                    checked={selectedChannelsToDelete.includes(channel.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedChannelsToDelete(prev => [...prev, channel.id]);
                      } else {
                        setSelectedChannelsToDelete(prev => prev.filter(id => id !== channel.id));
                      }
                    }}
                    className="w-4 h-4 rounded flex-shrink-0"
                  />
                )}
                <Button
                  variant={activeChannel?.id === channel.id ? "secondary" : "ghost"}
                  className="flex-1 justify-start min-w-0"
                  onClick={() => {
                    if (!deleteMode) {
                      setActiveChannel(channel);
                      if (isMobile) setShowSidebar(false); // Close sidebar on mobile
                    }
                  }}
                  disabled={deleteMode}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Lock className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{channel.name}</span>
                    {channelMessageCounts[channel.name] && (
                      <Badge variant="destructive" className="px-1 py-0 text-xs ml-auto flex-shrink-0">
                        {channelMessageCounts[channel.name]}
                      </Badge>
                    )}
                  </div>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 flex-shrink-0"
                  onClick={() => {
                    setSelectedChannelForMembers(channel);
                    setShowChannelMembersModal(true);
                  }}
                >
                  <Users className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {channels.map(channel => (
              <div key={channel.id} className="flex items-center gap-1">
                {deleteMode && (
                  <input
                    type="checkbox"
                    checked={selectedChannelsToDelete.includes(channel.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedChannelsToDelete(prev => [...prev, channel.id]);
                      } else {
                        setSelectedChannelsToDelete(prev => prev.filter(id => id !== channel.id));
                      }
                    }}
                    className="w-4 h-4 rounded flex-shrink-0"
                  />
                )}
                <Button
                  variant={activeChannel?.id === channel.id ? "secondary" : "ghost"}
                  className="flex-1 justify-start min-w-0"
                  onClick={() => {
                    if (!deleteMode) {
                      setActiveChannel(channel);
                      if (isMobile) setShowSidebar(false); // Close sidebar on mobile
                    }
                  }}
                  disabled={deleteMode}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Lock className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{channel.name}</span>
                    {channelMessageCounts[channel.name] && (
                      <Badge variant="destructive" className="ml-auto px-1 py-0 text-xs flex-shrink-0">
                        {channelMessageCounts[channel.name]}
                      </Badge>
                    )}
                  </div>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 flex-shrink-0"
                  onClick={() => {
                    setSelectedChannelForMembers(channel);
                    setShowChannelMembersModal(true);
                  }}
                >
                  <Users className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <Button
            size="sm"
            variant="ghost"
            className="w-full justify-center"
            onClick={() => setShowSidebar(false)}
          >
            <PanelLeftOpen className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <div className={cn("flex h-[88vh] sm:h-full bg-background relative overflow-hidden", className)}>
      <ChannelSidebar />

      <div className="flex-1 flex flex-col">
        {/* Members Panel */}
        {showMembers && activeChannel && (
          <div className="p-4 border-b bg-muted/20">
            <h3 className="font-semibold mb-3">Channel Members ({activeChannel.members.length})</h3>
            <div className="flex flex-wrap gap-2">
              {activeChannel.members.map(memberId => {
                const member = users.find(u => u.id === memberId) || { id: memberId, fullName: 'Unknown User', role: 'member' };
                return (
                  <div key={memberId} className="flex items-center gap-2 p-2 bg-background rounded border">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs">
                        {member.fullName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{member.fullName}</span>
                    <Badge variant="outline" className="text-xs">{member.role}</Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {/* Channel Header */}
        <div className="p-3 sm:p-4 border-b bg-background">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {!showSidebar && (
                <Button size="sm" variant="ghost" onClick={() => setShowSidebar(true)}>
                  <PanelRightOpen className="w-5 h-5" />
                </Button>
              )}
              {activeChannel ? (
                <>
                  <Lock className="w-5 h-5" />
                  <div>
                    <h2 className="font-semibold">{activeChannel.name}</h2>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <p className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                        {activeChannel.members.length} members
                        {typingUsers.length > 0 && (
                          <span className="hidden sm:inline ml-2">
                            • {typingUsers.length} typing...
                          </span>
                        )}
                      </p>
                      <Badge variant="outline" className="text-[10px] sm:text-xs bg-yellow-500/10 text-yellow-600 border-yellow-500/20 px-1 sm:px-2 h-5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span className="hidden xs:inline">Auto-delete: 24h</span>
                      </Badge>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5 text-blue-500" />
                  <div>
                    <h2 className="font-semibold">Communication Hub</h2>
                    <p className="text-xs text-muted-foreground">Select a channel to begin communicating</p>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <Button size="sm" variant="ghost" onClick={() => setShowSearch(!showSearch)} className="h-8 w-8 p-0" title="Search Messages">
                <Search className="w-4 h-4" />
              </Button>

              <div className="hidden sm:flex items-center gap-1">
                <Button size="sm" variant="ghost" onClick={() => setShowNewChannelModal(true)} className="h-8 w-8 p-0" title="New Channel">
                  <Plus className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowAddRecipientsModal(true)} className="h-8 w-8 p-0" title="Add Recipient">
                  <UserPlus className="w-4 h-4" />
                </Button>
              </div>

              <div className="sm:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowNewChannelModal(true)}>
                      <Plus className="w-4 h-4 mr-2" /> New Channel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowAddRecipientsModal(true)}>
                      <UserPlus className="w-4 h-4 mr-2" /> Add Recipient
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="p-2 sm:p-4 border-b bg-muted/20">
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 sm:h-10 text-base sm:text-sm"
            />
          </div>
        )}

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-2 sm:p-4">
          <div className="space-y-1.5 sm:space-y-2">
            {activeChannel ? (
              <>
                {filteredMessages.map(message => (
                  <MessageComponent key={message.id} message={message} />
                ))}
                <div ref={messagesEndRef} />
              </>
            ) : (
              <div className="h-[65vh] sm:h-[500px] flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">Welcome to your Chat Hub</h3>
                <p className="text-sm text-muted-foreground max-w-xs mb-6">
                  Select a channel from the sidebar or start a new conversation to begin.
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" size="sm" onClick={() => setShowNewChannelModal(true)} className="gap-2">
                    <Plus className="w-4 h-4" /> New Channel
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowAddRecipientsModal(true)} className="gap-2">
                    <UserPlus className="w-4 h-4" /> Start DM
                  </Button>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Reply Bar */}
        {replyingTo && (
          <div className="p-2 bg-muted/50 border-t flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Reply className="w-4 h-4" />
              <span className="text-sm">Replying to {replyingTo.content}</span>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setReplyingTo(null)}>
              ×
            </Button>
          </div>
        )}

        {/* Message Input */}
        <div className="p-2 sm:p-4 border-t bg-background">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              accept="image/*,.pdf,.doc,.docx,.xlsx,.xls"
              aria-label="Upload file"
            />

            {/* Actions: Desktop View */}
            <div className="hidden sm:flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => fileInputRef.current?.click()}
                className="h-9 w-9 p-0"
                title="Attach file"
              >
                <Paperclip className="w-4 h-4" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowPollModal(true)}
                className="h-9 w-9 p-0"
                title="Create poll"
              >
                <BarChart3 className="w-4 h-4" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="h-9 w-9 p-0"
                title="Emojis"
              >
                <Smile className="w-4 h-4" />
              </Button>
            </div>

            {/* Actions: Mobile View (Consolidated into Paperclip) */}
            <div className="sm:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-9 w-9 p-0">
                    <Paperclip className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start" className="w-48">
                  <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                    <Paperclip className="w-4 h-4 mr-2" /> Upload File
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowPollModal(true)}>
                    <BarChart3 className="w-4 h-4 mr-2" /> Create Poll
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                    <Smile className="w-4 h-4 mr-2" /> Emojis
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex-1 relative">
              <Textarea
                placeholder={`Message ${activeChannel?.name || 'channel'}...`}
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="min-h-[40px] max-h-[120px] resize-none pr-10 text-base sm:text-sm"
              />
              <Button
                size="sm"
                variant={isRecording ? "destructive" : "ghost"}
                onClick={handleVoiceRecording}
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 ${isRecording ? "animate-pulse" : ""}`}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
              {showEmojiPicker && (
                <div
                  ref={emojiPickerRef}
                  className="fixed bottom-[80px] left-[4vw] right-[4vw] z-[100] sm:absolute sm:bottom-full sm:left-0 sm:right-auto sm:mb-4 sm:translate-x-0 w-auto sm:w-[350px] shadow-2xl animate-in fade-in zoom-in-95 duration-200"
                >
                  <style>{`
                    .EmojiPickerReact.epr-main {
                      border: none !important;
                      --epr-search-input-padding-left: 40px;
                    }
                    .EmojiPickerReact .epr-search-container {
                      padding: 12px !important;
                    }
                    .EmojiPickerReact .epr-category-nav {
                      padding: 10px 0 !important;
                      margin-bottom: 0 !important;
                    }
                    @media (max-width: 640px) {
                      .EmojiPickerReact .epr-body {
                        padding-top: 0 !important;
                      }
                    }
                  `}</style>
                  <div className="bg-background rounded-2xl border-2 border-muted overflow-hidden shadow-2xl">
                    <EmojiPicker
                      onEmojiClick={(emojiData) => {
                        setMessageInput(prev => prev + emojiData.emoji);
                        setShowEmojiPicker(false);
                      }}
                      autoFocusSearch={false}
                      theme={document.documentElement.classList.contains('dark') ? Theme.DARK : Theme.LIGHT}
                      searchPlaceholder="Search emojis..."
                      width="100%"
                      height={isMobile ? 380 : 400}
                      lazyLoadEmojis={true}
                      skinTonesDisabled={true}
                      previewConfig={{
                        showPreview: false
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <Button
              size="sm"
              onClick={handleSendMessage}
              disabled={!messageInput.trim()}
            >
              <SendHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* New Channel Modal */}
      <Dialog open={showNewChannelModal} onOpenChange={setShowNewChannelModal}>
        <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-lg p-0">
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-yellow-500" />
                Create New Channel
              </DialogTitle>
              <DialogDescription>
                Create a new chat channel and add recipients.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Channel Name</Label>
                <Input
                  placeholder="Enter channel name"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  className="px-3 py-2 text-base sm:text-sm"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Add Recipients</Label>
                <ScrollArea className="h-64 border rounded-md p-2">
                  {availableRecipients.map((person) => (
                    <div key={person.id} className="flex items-center justify-between p-2 hover:bg-accent rounded-md">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs">
                            {(person.fullName || person.username).split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{person.fullName || person.username}</p>
                          <p className="text-xs text-muted-foreground">{person.role}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (newChannelRecipients.includes(person.id)) {
                            setNewChannelRecipients(newChannelRecipients.filter(id => id !== person.id));
                          } else {
                            setNewChannelRecipients([...newChannelRecipients, person.id]);
                          }
                        }}
                      >
                        {newChannelRecipients.includes(person.id) ? 'Remove' : 'Add'}
                      </Button>
                    </div>
                  ))}
                </ScrollArea>
              </div>
              {newChannelRecipients.length > 0 && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">Selected Recipients ({newChannelRecipients.length})</Label>
                  <div className="flex flex-wrap gap-2">
                    {newChannelRecipients.map(id => (
                      <div key={id} className="flex items-center gap-1 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-full">
                        <UserRoundPlus className="w-4 h-4" />
                        <span className="text-sm font-medium">{id.toUpperCase()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="mt-6 gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => {
                setShowNewChannelModal(false);
                setNewChannelName('');
                setNewChannelRecipients([]);
                setIsPrivateChannel(false);
              }} className="w-full sm:w-auto">Cancel</Button>
              <Button
                onClick={async () => {
                  if (newChannelName.trim() && newChannelRecipients.length > 0 && user) {
                    const newChannel: ChatChannel = {
                      id: `channel-${Date.now()}`,
                      name: newChannelName.trim(),
                      description: '',
                      type: 'general',
                      members: [user.id, ...newChannelRecipients],
                      admins: [user.id],
                      isPrivate: true,
                      createdAt: new Date(),
                      updatedAt: new Date(),
                      createdBy: user.id,
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

                    setChannels(prev => [newChannel, ...prev]);
                    setActiveChannel(newChannel);

                    toast({
                      title: 'Channel Created',
                      description: `${newChannelName} has been created successfully`,
                      variant: 'default'
                    });

                    setNewChannelName('');
                    setNewChannelRecipients([]);
                    setIsPrivateChannel(false);
                    setShowNewChannelModal(false);
                  }
                }}
                disabled={!newChannelName.trim() || newChannelRecipients.length === 0}
                className="w-full sm:w-auto"
              >
                Create Channel
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Recipients Modal */}
      <Dialog open={showAddRecipientsModal} onOpenChange={setShowAddRecipientsModal}>
        <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-lg p-0">
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-500" />
                Add Recipients
              </DialogTitle>
              <DialogDescription>
                Select recipients to start a direct chat.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Available Staff</Label>
                <ScrollArea className="h-64 border rounded-md p-2">
                  {availableRecipients.map((person) => (
                    <div key={person.id} className="flex items-center justify-between p-2 hover:bg-accent rounded-md">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs">
                            {(person.fullName || person.username).split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{person.fullName || person.username}</p>
                          <p className="text-xs text-muted-foreground">{person.role}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (selectedRecipients.includes(person.id)) {
                            setSelectedRecipients(selectedRecipients.filter(id => id !== person.id));
                          } else {
                            setSelectedRecipients([...selectedRecipients, person.id]);
                          }
                        }}
                      >
                        {selectedRecipients.includes(person.id) ? 'Remove' : 'Add'}
                      </Button>
                    </div>
                  ))}
                </ScrollArea>
              </div>
              {selectedRecipients.length > 0 && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">Selected Recipients ({selectedRecipients.length})</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedRecipients.map(id => (
                      <div key={id} className="flex items-center gap-1 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-full">
                        <UserRoundPlus className="w-4 h-4" />
                        <span className="text-sm font-medium">{id.toUpperCase()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="mt-6 gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => {
                setShowAddRecipientsModal(false);
                setSelectedRecipients([]);
              }} className="w-full sm:w-auto">Cancel</Button>
              <Button
                onClick={async () => {
                  if (selectedRecipients.length > 0 && user) {
                    const newChannel: ChatChannel = {
                      id: `dm-${Date.now()}`,
                      name: selectedRecipients.map(id => id.toUpperCase()).join(', '),
                      description: 'Direct Message Group',
                      type: 'private',
                      members: [user.id, ...selectedRecipients],
                      admins: [user.id],
                      isPrivate: true,
                      createdAt: new Date(),
                      updatedAt: new Date(),
                      createdBy: user.id,
                      pinnedMessages: [],
                      settings: {
                        allowFileUploads: true,
                        allowPolls: false,
                        allowSignatureRequests: true,
                        requireModeration: false,
                        autoArchive: false,
                        notificationLevel: 'all'
                      }
                    };
                    setChannels(prev => [newChannel, ...prev]);
                    setActiveChannel(newChannel);
                    toast({
                      title: 'Chat Started',
                      description: `Started chat with ${selectedRecipients.length} recipient(s)`,
                      variant: 'default'
                    });
                    setSelectedRecipients([]);
                    setShowAddRecipientsModal(false);
                  }
                }}
                disabled={selectedRecipients.length === 0}
                className="w-full sm:w-auto"
              >
                Start Chat
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Poll Creation Modal */}
      <Dialog open={showPollModal} onOpenChange={setShowPollModal}>
        <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-lg p-0">
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-green-600" />
                Create Poll
              </DialogTitle>
              <DialogDescription>
                Create a poll for the channel members to vote on.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Poll Question</Label>
                <Input
                  placeholder="What's your question?"
                  value={pollTitle}
                  onChange={(e) => setPollTitle(e.target.value)}
                  className="px-3 py-2 text-base sm:text-sm"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Options</Label>
                <div className="space-y-3">
                  {pollOptions.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder={`Option ${index + 1}`}
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...pollOptions];
                          newOptions[index] = e.target.value;
                          setPollOptions(newOptions);
                        }}
                        className="text-base sm:text-sm"
                      />
                      {pollOptions.length > 2 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== index))}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setPollOptions([...pollOptions, ''])}
                  className="mt-2 text-primary hover:text-primary/80"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Option
                </Button>
              </div>
            </div>
            <DialogFooter className="mt-6 gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => {
                setShowPollModal(false);
                setPollTitle('');
                setPollOptions(['', '']);
              }} className="w-full sm:w-auto">Cancel</Button>
              <Button
                onClick={() => {
                  const validOptions = pollOptions.filter(opt => opt.trim());
                  if (pollTitle.trim() && validOptions.length >= 2) {
                    handleCreatePoll(pollTitle.trim(), validOptions);
                    setPollTitle('');
                    setPollOptions(['', '']);
                    setShowPollModal(false);
                  }
                }}
                disabled={!pollTitle.trim() || pollOptions.filter(opt => opt.trim()).length < 2}
                className="w-full sm:w-auto"
              >
                Create Poll
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Channels</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedChannelsToDelete.length} channel(s)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteChannels}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Channel Members Modal */}
      <AlertDialog open={showChannelMembersModal} onOpenChange={setShowChannelMembersModal}>
        <AlertDialogContent className="w-full max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-lg p-4 sm:p-6">
          <button
            onClick={() => setShowChannelMembersModal(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              View Members in Channel Group
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedChannelForMembers?.name} • Total Members: {selectedChannelForMembers?.members?.length || 0}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Channel Group Members</label>
              <ScrollArea className="h-64 border rounded-md p-2">
                {selectedChannelForMembers?.members?.map((memberId) => {
                  // Helper function to get user display info from member ID
                  const getMemberInfo = (id: string) => {
                    // Map of common recipient IDs to their display names
                    const recipientMap: { [key: string]: { fullName: string; role: string } } = user?.role === 'demo-work' ? {
                      // Leadership
                      'principal-dr.-robert-principal': { fullName: 'Dr. Robert Principal', role: 'Principal' },
                      'registrar-prof.-sarah-registrar': { fullName: 'Prof. Sarah Registrar', role: 'Registrar' },
                      'dean-dr.-maria-dean': { fullName: 'Dr. Maria Dean', role: 'Dean' },
                      'chairman-mr.-david-chairman': { fullName: 'Mr. David Chairman', role: 'Chairman' },
                      'director-(for-information)-ms.-lisa-director': { fullName: 'Ms. Lisa Director', role: 'Director' },
                      'leadership-prof.-leadership-officer': { fullName: 'Prof. Leadership Officer', role: 'Leadership' },

                      // CDC Employees
                      'cdc-head-dr.-cdc-head': { fullName: 'Dr. CDC Head', role: 'CDC Head' },
                      'cdc-coordinator-prof.-cdc-coordinator': { fullName: 'Prof. CDC Coordinator', role: 'CDC Coordinator' },
                      'cdc-executive-ms.-cdc-executive': { fullName: 'Ms. CDC Executive', role: 'CDC Executive' },

                      // Administrative
                      'controller-of-examinations-dr.-robert-controller': { fullName: 'Dr. Robert Controller', role: 'Controller' },
                      'asst.-dean-iiic-prof.-asst-dean': { fullName: 'Prof. Asst Dean', role: 'Asst. Dean IIIC' },
                      'head-operations-mr.-michael-operations': { fullName: 'Mr. Michael Operations', role: 'Head Operations' },
                      'librarian-ms.-jennifer-librarian': { fullName: 'Ms. Jennifer Librarian', role: 'Librarian' },
                      'ssg-prof.-william-ssg': { fullName: 'Prof. William SSG', role: 'SSG' },

                      // HODs
                      'hod-dr.-eee-hod-eee': { fullName: 'Dr. EEE HOD', role: 'HOD EEE' },
                      'hod-dr.-mech-hod-mech': { fullName: 'Dr. MECH HOD', role: 'HOD MECH' },
                      'hod-dr.-cse-hod-cse': { fullName: 'Dr. CSE HOD', role: 'HOD CSE' },
                      'hod-dr.-ece-hod-ece': { fullName: 'Dr. ECE HOD', role: 'HOD ECE' },
                      'hod-dr.-csm-hod-csm': { fullName: 'Dr. CSM HOD', role: 'HOD CSM' },
                      'hod-dr.-cso-hod-cso': { fullName: 'Dr. CSO HOD', role: 'HOD CSO' },
                      'hod-dr.-csd-hod-csd': { fullName: 'Dr. CSD HOD', role: 'HOD CSD' },
                      'hod-dr.-csc-hod-csc': { fullName: 'Dr. CSC HOD', role: 'HOD CSC' },

                      // Program Department Heads
                      'program-department-head-prof.-eee-head-eee': { fullName: 'Prof. EEE Head', role: 'Program Head EEE' },
                      'program-department-head-prof.-mech-head-mech': { fullName: 'Prof. MECH Head', role: 'Program Head MECH' },
                      'program-department-head-prof.-cse-head-cse': { fullName: 'Prof. CSE Head', role: 'Program Head CSE' },
                      'program-department-head-prof.-ece-head-ece': { fullName: 'Prof. ECE Head', role: 'Program Head ECE' },
                      'program-department-head-prof.-csm-head-csm': { fullName: 'Prof. CSM Head', role: 'Program Head CSM' },
                      'program-department-head-prof.-cso-head-cso': { fullName: 'Prof. CSO Head', role: 'Program Head CSO' },
                      'program-department-head-prof.-csd-head-csd': { fullName: 'Prof. CSD Head', role: 'Program Head CSD' },
                      'program-department-head-prof.-csc-head-csc': { fullName: 'Prof. CSC Head', role: 'Program Head CSC' }
                    } : {};

                    // Check if we have a mapping
                    if (recipientMap[id]) {
                      return recipientMap[id];
                    }

                    // Check if it's the current user
                    if (id === user?.id || id === user?.name) {
                      return { fullName: user?.name || 'You', role: user?.role || 'User' };
                    }

                    // Try to extract name from ID
                    const parts = id.split('-');
                    let name = '';
                    let role = '';

                    for (let i = 0; i < parts.length; i++) {
                      if (parts[i].match(/^(dr\.|prof\.|mr\.|ms\.)$/i)) {
                        name = parts.slice(i).join(' ').replace(/-/g, ' ')
                          .split(' ')
                          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                          .join(' ');
                        break;
                      }
                    }

                    // Extract role
                    if (id.includes('hod')) role = 'HOD';
                    else if (id.includes('principal')) role = 'Principal';
                    else if (id.includes('registrar')) role = 'Registrar';
                    else if (id.includes('dean')) role = 'Dean';
                    else if (id.includes('program-department-head')) role = 'Program Head';
                    else if (id.includes('faculty')) role = 'Faculty';
                    else if (id.includes('employee')) role = 'Employee';
                    else role = 'Member';

                    if (!name) {
                      name = id.replace(/-/g, ' ')
                        .split(' ')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                        .join(' ');
                    }

                    return { fullName: name, role: role };
                  };

                  const memberInfo = getMemberInfo(memberId);
                  const isCurrentUser = memberId === user?.id || memberId === user?.name;
                  const isAdmin = selectedChannelForMembers?.admins?.includes(memberId);

                  return (
                    <div key={memberId} className="flex items-center justify-between p-2 hover:bg-accent rounded-md">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs">
                              {memberInfo.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white bg-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {memberInfo.fullName}
                            {isCurrentUser && <span className="ml-1 text-xs text-muted-foreground">(You)</span>}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {memberInfo.role}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isAdmin && (
                          <Badge variant="outline" className="text-xs">
                            Admin
                          </Badge>
                        )}
                        {selectedChannelForMembers?.createdBy === memberId && (
                          <Badge variant="secondary" className="text-xs">
                            Creator
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </ScrollArea>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Poll Votes Modal */}
      <AlertDialog open={showPollVotesModal} onOpenChange={setShowPollVotesModal}>
        <AlertDialogContent className="max-w-2xl">
          <button
            onClick={() => setShowPollVotesModal(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              Poll Results
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedPollId && polls[selectedPollId] ? polls[selectedPollId].title : 'Poll Results'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            {selectedPollId && polls[selectedPollId] && (() => {
              const pollResults = getPollResults(selectedPollId);
              return (
                <div>
                  <label className="text-sm font-medium mb-2 block">Votes by Option</label>
                  <ScrollArea className="h-64 border rounded-md p-2">
                    {pollResults.options.map((option) => (
                      <div key={option.id} className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{option.text}</span>
                          <Badge variant="secondary">{option.votes.length} votes ({option.percentage}%)</Badge>
                        </div>
                        <div className="space-y-1">
                          {option.votes.map(vote => {
                            const userId = vote.userId;
                            const voter = users.find(u => u.id === userId) ||
                              { id: userId, fullName: userId.charAt(0).toUpperCase() + userId.slice(1), role: 'Member' };
                            return (
                              <div key={`${option.id}-${userId}`} className="flex items-center gap-2 p-2 hover:bg-accent rounded-md">
                                <Avatar className="w-6 h-6">
                                  <AvatarFallback className="text-xs">
                                    {(voter.fullName || 'User').substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium">{voter.fullName}</p>
                                  <p className="text-xs text-muted-foreground">{voter.role}</p>
                                </div>
                              </div>
                            );
                          })}
                          {option.votes.length === 0 && (
                            <p className="text-xs text-muted-foreground italic p-2">No votes yet</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              );
            })()}
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowPollVotesModal(false)}>
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>



      {/* Private Reply Modal */}
      <Dialog open={showPrivateReplyModal} onOpenChange={setShowPrivateReplyModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reply Privately</DialogTitle>
            <DialogDescription>
              Send a private message to {privateReplyTo ? users.find(u => u.id === privateReplyTo.senderId)?.fullName || 'user' : 'user'}
            </DialogDescription>
          </DialogHeader>

          {/* Original message reference */}
          {privateReplyTo && (
            <div className="bg-muted/50 rounded-lg p-3 border-l-4 border-blue-500 mb-4">
              <div className="text-sm text-muted-foreground mb-1">
                Original message from {users.find(u => u.id === privateReplyTo.senderId)?.fullName || 'user'}:
              </div>
              <div className="text-sm">
                {privateReplyTo.content.length > 150
                  ? privateReplyTo.content.substring(0, 150) + '...'
                  : privateReplyTo.content
                }
              </div>
            </div>
          )}

          {/* Private reply input */}
          <div className="space-y-4">
            <Textarea
              placeholder="Type your private reply..."
              value={privateReplyMessage}
              onChange={(e) => setPrivateReplyMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && privateReplyMessage.trim()) {
                  e.preventDefault();
                  handleSendPrivateReply();
                }
              }}
              className="min-h-[120px] text-base sm:text-sm"
            />
            <div className="text-xs text-muted-foreground">
              Press Ctrl+Enter to send
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPrivateReplyModal(false);
                setPrivateReplyMessage('');
                setPrivateReplyTo(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendPrivateReply}
              disabled={!privateReplyMessage.trim()}
            >
              Send Private Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
