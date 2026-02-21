import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";
import { NotesReminders } from "@/components/shared/NotesReminders";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { LiveMeetingRequestManager } from "@/components/meetings/LiveMeetingRequestManager";
import { DecentralizedChatService } from "@/services/DecentralizedChatService";
import { useAuth } from "@/contexts/AuthContext";
import {
  Users,
  BarChart3,
  Zap,
  MessageSquare,
  Lock,
  Video
} from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useResponsive } from "@/hooks/useResponsive";
import { cn } from "@/lib/utils";
import { LiveMeetingRequest } from "@/types/liveMeeting";
import { ChatMessage } from "@/types/chat";

export default function Messages() {
  const { user } = useAuth();
  const { isMobile } = useResponsive();

  const [chatService] = useState(() => new DecentralizedChatService(
    import.meta.env.VITE_WS_URL || 'ws://localhost:3001',
    import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
  ));
  const [isInitialized, setIsInitialized] = useState(false);


  const isDemoRole = user?.role === 'demo-work';

  const [stats, setStats] = useState({
    unreadMessages: isDemoRole ? 26 : 0,
    pendingSignatures: isDemoRole ? 2 : 0,
    activePolls: isDemoRole ? 1 : 0,
    onlineUsers: isDemoRole ? 23 : 0,
    totalChannels: isDemoRole ? 5 : 0,
    notifications: isDemoRole ? 4 : 0,
    liveMeetingRequests: isDemoRole ? 3 : 0
  });

  const [channelMessageCounts, setChannelMessageCounts] = useState<{ [key: string]: number }>(
    isDemoRole ? {
      'Administrative Council': 9,
      'Faculty Board': 5,
      'General': 12
    } : {
      'Administrative Council': 0,
      'Faculty Board': 0,
      'General': 0
    }
  );

  const [liveMeetRequests, setLiveMeetRequests] = useState<LiveMeetingRequest[]>([]);


  const messagesData = useMemo(() => ({
    meetings: [
      { id: 'team-standup', title: 'Daily Team Standup', description: 'Daily sync at 9:00 AM' },
      { id: 'client-review', title: 'Client Quarterly Review Meeting', description: 'Quarterly business review' },
      { id: 'product-planning', title: 'Product Roadmap Planning Session', description: 'Roadmap discussion' },
      { id: 'all-hands', title: 'Monthly All Hands Meeting', description: 'Company updates' }
    ],
    reminders: [
      { id: 'project-deadline', title: 'Project Milestone Deadline', description: 'Due tomorrow' },
      { id: 'client-followup', title: 'Client Follow-up Call Reminder', description: 'Schedule for next week' },
      { id: 'performance-review', title: 'Annual Performance Review Due', description: 'Submit by Friday' },
      { id: 'contract-renewal', title: 'Contract Renewal Reminder', description: 'Review terms' }
    ],
    stickyNotes: [
      { id: 'contract-review', title: 'Review Legal Contract Terms', description: 'Legal feedback needed' },
      { id: 'timeline-update', title: 'Update Project Timeline', description: 'Adjust milestones' },
      { id: 'presentation-prep', title: 'Prepare Board Presentation', description: 'Board meeting prep' },
      { id: 'budget-analysis', title: 'Complete Budget Analysis', description: 'Financial review' }
    ],
    channels: [
      { id: 'engineering', name: 'Engineering Team', description: '24 members online' },
      { id: 'marketing', name: 'Marketing Department', description: '18 members online' },
      { id: 'general', name: 'General Discussion', description: '45 members online' },
      { id: 'product', name: 'Product Updates', description: '32 members online' },
      { id: 'hr', name: 'HR Announcements', description: '67 members online' }
    ]
  }), []);


  const updateMessageCounts = useCallback(() => {
    if (!isDemoRole) return;
    setChannelMessageCounts(prev => {
      const channels = Object.keys(prev);
      const randomChannel = channels[Math.floor(Math.random() * channels.length)];
      const newCounts = { ...prev };
      newCounts[randomChannel] = prev[randomChannel] + 1;

      return newCounts;
    });
  }, [isDemoRole]);


  useEffect(() => {
    const totalMessages = Object.values(channelMessageCounts).reduce((sum, count) => sum + count, 0);
    setStats(prev => ({ ...prev, unreadMessages: totalMessages }));
  }, [channelMessageCounts]);

  const loadLiveMeetRequests = useCallback(() => {
    try {
      const allRequests = JSON.parse(localStorage.getItem('livemeet-requests') || '[]');

      if (!user) {
        setStats(prev => ({ ...prev, liveMeetingRequests: 0 }));
        setLiveMeetRequests([]);
        return;
      }

      const currentUserId = user.id;
      const currentUserName = user.name;

      const filteredRequests = allRequests.filter((request: LiveMeetingRequest) => {
        if (request.requesterName && currentUserName) {
          if (request.requesterName.toLowerCase().trim() === currentUserName.toLowerCase().trim()) {
            return false;
          }
        }

        if (request.participants && Array.isArray(request.participants)) {
          if (request.participants.some(p => p.userId === currentUserId)) {
            return true;
          }
        }

        return false;
      });

      const requestCount = filteredRequests.length;
      setStats(prev => ({ ...prev, liveMeetingRequests: requestCount }));
      setLiveMeetRequests(filteredRequests);
    } catch (error) {
      console.error('[LiveMeet+ Filtering] Error loading requests:', error);
      setStats(prev => ({ ...prev, liveMeetingRequests: 0 }));
      setLiveMeetRequests([]);
    }
  }, [user]);


  useEffect(() => {
    if (!user) return;

    try {
      Object.entries(messagesData).forEach(([key, data]) => {
        try {
          localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
          console.error(`[Messages] Error saving ${key} to localStorage:`, error);
        }
      });
    } catch (error) {
      console.error('[Messages] Error initializing localStorage:', error);
    }

    loadLiveMeetRequests();
    setIsInitialized(true);

    const messageInterval = setInterval(updateMessageCounts, 5000);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'livemeet-requests') {
        loadLiveMeetRequests();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(messageInterval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user, loadLiveMeetRequests, updateMessageCounts, messagesData]);

  if (!user) return null;

  return (
    <ResponsiveLayout>
      <div className="container mx-auto p-4 sm:p-6">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Communication Center</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Messages, notes, and reminders for collaborative work</p>
        </div>

        <Tabs defaultValue={isMobile ? "chat" : "notes"} className="space-y-6">
          <TabsList className={cn(
            "grid w-full h-auto",
            isMobile ? "grid-cols-2" : "grid-cols-3"
          )}>
            {!isMobile && (
              <TabsTrigger value="notes" className="text-xs sm:text-sm py-2 sm:py-1.5 h-full whitespace-normal">
                <span className="hidden sm:inline">Notes & Reminders</span>
                <span className="sm:hidden">Notes</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="chat" className="relative text-xs sm:text-sm py-2 sm:py-1.5 h-full whitespace-normal">
              <span className="hidden sm:inline">Department Chat</span>
              <span className="sm:hidden">Chat</span>
              {stats.unreadMessages > 0 && (
                <Badge variant="destructive" className="ml-1 sm:ml-2 px-1 py-0 text-[10px] sm:text-xs self-center">
                  {stats.unreadMessages}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="live-requests" className="relative text-xs sm:text-sm py-2 sm:py-1.5 h-full whitespace-normal">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <div className="relative w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 flex items-center justify-center">
                  <div className="absolute inset-0 bg-green-400 rounded-full"></div>
                  <div className="relative w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full"></div>
                </div>
                <span>LiveMeet+</span>
              </div>
              {stats.liveMeetingRequests > 0 && (
                <Badge variant="destructive" className="ml-1 sm:ml-2 px-1 py-0 text-[10px] sm:text-xs animate-pulse self-center">
                  {stats.liveMeetingRequests}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {!isMobile && (
            <TabsContent value="notes" className="space-y-6">
              <NotesReminders userRole={user.role} isMessagesPage={true} />
            </TabsContent>
          )}

          <TabsContent value="live-requests" className="space-y-6">
            <LiveMeetingRequestManager />
          </TabsContent>

          <TabsContent value="chat" className="space-y-6">
            <div className="hidden md:grid grid-cols-6 gap-3 sm:gap-4 mb-6">
              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Messages</p>
                      <p className="text-lg sm:text-2xl font-bold">{stats.unreadMessages}</p>
                    </div>
                    <MessageSquare className="w-5 h-5 sm:w-8 sm:h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Online</p>
                      <p className="text-lg sm:text-2xl font-bold">{stats.onlineUsers}</p>
                    </div>
                    <Users className="w-5 h-5 sm:w-8 sm:h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Channels</p>
                      <p className="text-lg sm:text-2xl font-bold">{stats.totalChannels}</p>
                    </div>
                    <Lock className="w-5 h-5 sm:w-8 sm:h-8 text-indigo-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Video Call</p>
                      <p className="text-lg sm:text-2xl font-bold">{stats.pendingSignatures}</p>
                    </div>
                    <Video className="w-5 h-5 sm:w-8 sm:h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Polls</p>
                      <p className="text-lg sm:text-2xl font-bold">{stats.activePolls}</p>
                    </div>
                    <BarChart3 className="w-5 h-5 sm:w-8 sm:h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Status</p>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs sm:text-sm font-medium">Live</span>
                      </div>
                    </div>
                    <Zap className="w-5 h-5 sm:w-8 sm:h-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="min-h-[calc(100vh-350px)] sm:min-h-[600px] border-none sm:border">
              <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-xl">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                  Department Communication Hub
                </CardTitle>
                <CardDescription className="text-[10px] sm:text-sm hidden xs:block">
                  Real-time chat, document workflows, and collaboration tools
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[calc(100vh-350px)] sm:h-[600px]">
                  <ChatInterface channelMessageCounts={channelMessageCounts} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ResponsiveLayout>
  );
}