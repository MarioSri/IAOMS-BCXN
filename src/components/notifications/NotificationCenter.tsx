import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Bell, Settings, X, CircleCheck, FileText, Calendar, TriangleAlert, Video } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSocket } from '@/hooks/useSocket';
import { apiService } from '@/services/api';
import { notificationService, Notification } from '@/services/NotificationService';

export const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { onNotification } = useSocket();

  useEffect(() => {
    loadNotifications();
    
    const unsubscribeNotificationService = notificationService.subscribe((updatedNotifications) => {
      setNotifications(updatedNotifications);
      setUnreadCount(updatedNotifications.filter(n => !n.read).length);
    });
    
    const unsubscribe = onNotification((notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      unsubscribeNotificationService();
      unsubscribe();
    };
  }, []);

  const loadNotifications = async () => {
    try {
      const localNotifications = notificationService.getNotifications();
      setNotifications(localNotifications);
      setUnreadCount(localNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'meeting': return (
        <div className="relative w-4 h-4">
          <div className="absolute inset-0 w-4 h-4 bg-green-400 rounded-full"></div>
          <div className="absolute inset-1 w-2 h-2 bg-red-500 rounded-full"></div>
        </div>
      );
      case 'approval': return <CircleCheck className="w-4 h-4 text-success" />;
      case 'submission': return <FileText className="w-4 h-4 text-primary" />;
      case 'reminder': return <Calendar className="w-4 h-4 text-info" />;
      case 'emergency': return <TriangleAlert className="w-4 h-4 text-destructive" />;
      default: return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const markAllRead = () => {
    const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    setNotifications(updatedNotifications);
    setUnreadCount(0);
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem('notifications');
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 min-w-5 h-5 px-1 flex items-center justify-center rounded-full text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="rounded-lg bg-card text-card-foreground border-0 shadow-none">
          <div className="flex flex-col space-y-1.5 p-6 pb-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold tracking-tight text-lg">Notifications</h3>
              <Button variant="ghost" size="sm" onClick={markAllRead}>
                Mark all read
              </Button>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{notifications.length} total notifications</span>
              <Button variant="ghost" size="sm" onClick={clearAll}>
                Clear all
              </Button>
            </div>
          </div>
          <div className="p-0">
            <ScrollArea className="h-96">
              <div className="space-y-1">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No notifications
                  </div>
                ) : (
                  notifications.map((notification, index) => (
                    <div key={notification.id}>
                      <div className={`p-4 hover:bg-muted/50 cursor-pointer ${!notification.read ? 'bg-primary/5 border-l-4 border-l-primary' : ''}`}>
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className={`text-sm font-medium ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {notification.title}
                                {notification.urgent && (
                                  <Badge variant="destructive" className="ml-2 text-xs">
                                    Urgent
                                  </Badge>
                                )}
                              </h4>
                              <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-muted-foreground">{notification.timestamp}</span>
                              {notification.documentId && (
                                <Badge variant="outline" className="text-xs">
                                  {notification.documentId}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      {index < notifications.length - 1 && <Separator />}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};