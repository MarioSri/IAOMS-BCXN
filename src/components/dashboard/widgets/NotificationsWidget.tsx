import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/hooks/useSocket';
import { apiService } from '@/services/api';
import { cn } from '@/lib/utils';

// Simple responsive hook
const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { isMobile };
};
import {
  Bell,
  CheckCircle2,
  Clock,
  FileText,
  Calendar,
  AlertTriangle,
  X,
  Eye,
  ArrowRight,
  Users,
  Zap
} from 'lucide-react';

interface NotificationsWidgetProps {
  userRole: string;
  permissions: any;
  isCustomizing?: boolean;
  onSelect?: () => void;
  isSelected?: boolean;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
  delivered_via: string[];
  read?: boolean;
  urgent?: boolean;
}

export const NotificationsWidget: React.FC<NotificationsWidgetProps> = ({
  userRole,
  permissions,
  isCustomizing,
  onSelect,
  isSelected
}) => {
  const { user } = useAuth();
  const { onNotification } = useSocket();
  const { isMobile } = useResponsive();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all');
  const [unreadCount, setUnreadCount] = useState(0);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'approval': return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'submission': return <FileText className="w-4 h-4 text-primary" />;
      case 'reminder': return <Clock className="w-4 h-4 text-warning" />;
      case 'emergency': return <AlertTriangle className="w-4 h-4 text-destructive animate-pulse" />;
      case 'meeting': return <Calendar className="w-4 h-4 text-blue-500" />;
      default: return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
  };

  useEffect(() => {
    loadNotifications();

    const unsubscribe = onNotification((notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await apiService.getUserNotifications();
      if (response.success) {
        setNotifications(response.data);
        setUnreadCount(response.data.filter((n: any) => !n.read).length);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getFilteredNotifications = () => {
    switch (filter) {
      case 'unread':
        return notifications.filter(n => !n.read);
      case 'urgent':
        return notifications.filter(n => n.urgent || n.type === 'emergency');
      default:
        return notifications;
    }
  };

  const filteredNotifications = getFilteredNotifications();
  const urgentCount = notifications.filter(n => n.urgent || n.type === 'emergency').length;

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diff = now.getTime() - notificationTime.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <Card className={cn(
      "shadow-elegant hover:shadow-glow transition-all duration-300",
      isSelected && "border-primary",
      isCustomizing && "cursor-pointer"
    )} onClick={onSelect}>
      <CardHeader className={cn(isMobile && "pb-3")}>
        <div className="flex items-center justify-between">
          <CardTitle className={cn(
            "flex items-center gap-2",
            isMobile ? "text-lg" : "text-xl"
          )}>
            <Bell className="w-5 h-5 text-primary" />
            Notifications
            <div className="flex gap-1">
              {unreadCount > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  {unreadCount}
                </Badge>
              )}
              {urgentCount > 0 && (
                <Badge variant="warning" className="text-xs">
                  {urgentCount} urgent
                </Badge>
              )}
            </div>
          </CardTitle>

          <div className="flex gap-1">
            {(['all', 'unread', 'urgent'] as const).map(filterType => (
              <Button
                key={filterType}
                variant={filter === filterType ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter(filterType)}
                className={cn(isMobile && "text-xs px-2")}
              >
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-64">
          <div className="space-y-2">
            {filteredNotifications.slice(0, 8).map((notification, index) => (
              <div
                key={notification.id}
                className={cn(
                  "p-3 border rounded-lg hover:bg-accent transition-all cursor-pointer",
                  !notification.read && "bg-primary/5 border-l-4 border-l-primary",
                  notification.urgent && "border-warning bg-warning/5",
                  notification.type === 'emergency' && "border-destructive bg-destructive/5"
                )}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h5 className={cn(
                        "font-medium line-clamp-2",
                        !notification.read ? 'text-foreground' : 'text-muted-foreground',
                        isMobile ? "text-sm" : "text-base"
                      )}>
                        {notification.title}
                        {notification.urgent && (
                          <Badge variant="destructive" className="ml-2 text-xs">
                            Urgent
                          </Badge>
                        )}
                      </h5>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>

                    <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                      {notification.message}
                    </p>

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        {getTimeAgo(notification.created_at)}
                      </span>
                      <div className="flex gap-1">
                        {notification.delivered_via?.map((method) => (
                          <Badge key={method} variant="outline" className="text-xs">
                            {method}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filteredNotifications.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-base">
                  {filter === 'all' ? 'No notifications' : `No ${filter} notifications`}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t">
          <div className="text-center p-2 bg-muted/30 rounded">
            <p className="font-bold text-primary text-xl">
              {notifications.length}
            </p>
            <p className="text-muted-foreground text-sm">
              Total
            </p>
          </div>
          <div className="text-center p-2 bg-muted/30 rounded">
            <p className="font-bold text-warning text-xl">
              {unreadCount}
            </p>
            <p className="text-muted-foreground text-sm">
              Unread
            </p>
          </div>
          <div className="text-center p-2 bg-muted/30 rounded">
            <p className="font-bold text-destructive text-xl">
              {urgentCount}
            </p>
            <p className="text-muted-foreground text-sm">
              Urgent
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};