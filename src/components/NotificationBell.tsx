
import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

// Define notification type
interface Notification {
  id: string;
  message: string;
  date: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
}

const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  
  // Load notifications from local storage
  useEffect(() => {
    if (!user) return;
    
    try {
      const savedNotifications = localStorage.getItem(`notifications_${user.id}`);
      if (savedNotifications) {
        const parsedNotifications = JSON.parse(savedNotifications);
        setNotifications(parsedNotifications);
        
        // Count unread notifications
        const unreadCount = parsedNotifications.filter(
          (notification: Notification) => !notification.read
        ).length;
        setUnread(unreadCount);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, [user]);
  
  // Save notifications to local storage
  const saveNotifications = (notifications: Notification[]) => {
    if (!user) return;
    
    try {
      localStorage.setItem(
        `notifications_${user.id}`,
        JSON.stringify(notifications)
      );
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  };
  
  // Add a new notification
  const addNotification = (
    message: string, 
    type: 'info' | 'success' | 'warning' | 'error' = 'info'
  ) => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      message,
      date: new Date().toISOString(),
      read: false,
      type,
    };
    
    const updatedNotifications = [newNotification, ...notifications];
    setNotifications(updatedNotifications);
    setUnread(unread + 1);
    saveNotifications(updatedNotifications);
  };
  
  // Mark a notification as read
  const markAsRead = (id: string) => {
    const updatedNotifications = notifications.map(notification => {
      if (notification.id === id && !notification.read) {
        return { ...notification, read: true };
      }
      return notification;
    });
    
    setNotifications(updatedNotifications);
    
    // Count unread notifications
    const unreadCount = updatedNotifications.filter(
      notification => !notification.read
    ).length;
    setUnread(unreadCount);
    
    saveNotifications(updatedNotifications);
  };
  
  // Mark all notifications as read
  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(notification => ({
      ...notification,
      read: true,
    }));
    
    setNotifications(updatedNotifications);
    setUnread(0);
    saveNotifications(updatedNotifications);
  };
  
  // Format date string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (60 * 1000));
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    
    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };
  
  // Add a demo notification for testing
  const addDemoNotification = () => {
    const types: ('info' | 'success' | 'warning' | 'error')[] = [
      'info', 'success', 'warning', 'error'
    ];
    const messages = [
      'Neural network training completed with 92% accuracy',
      'New prediction available for R_10 market',
      'WebSocket connection lost. Reconnecting...',
      'Successfully collected 100 ticks for epoch #5',
      'Your subscription will expire in 3 days',
    ];
    
    const randomType = types[Math.floor(Math.random() * types.length)];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
    addNotification(randomMessage, randomType);
  };
  
  // Set up the notification bell for the app
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-medium">Notifications</h4>
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={markAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <p>No notifications</p>
              {!user && (
                <p className="text-xs mt-2">
                  Login to receive notifications
                </p>
              )}
            </div>
          ) : (
            <ul className="divide-y">
              {notifications.map(notification => (
                <li
                  key={notification.id}
                  className={`p-3 transition-colors ${
                    !notification.read ? 'bg-muted/20' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-2">
                    <div className={`mt-0.5 h-2 w-2 rounded-full ${
                      notification.type === 'info' ? 'bg-blue-500' :
                      notification.type === 'success' ? 'bg-green-500' :
                      notification.type === 'warning' ? 'bg-amber-500' :
                      'bg-red-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(notification.date)}
                      </p>
                    </div>
                    {!notification.read && (
                      <Badge variant="outline" className="h-1.5 w-1.5 rounded-full bg-primary p-0" />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
        
        <div className="flex justify-between p-3 border-t bg-muted/20">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={addDemoNotification}
          >
            Add Test Notification
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => {
              setNotifications([]);
              setUnread(0);
              saveNotifications([]);
            }}
          >
            Clear All
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
