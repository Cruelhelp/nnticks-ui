import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useSettings } from '@/hooks/useSettings';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  timestamp: Date;
  read: boolean;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { settings } = useSettings();

  useEffect(() => {
    // Fetch notifications from Supabase (Implementation needed here)
    const fetchNotifications = async () => {
      // Replace with actual Supabase fetch logic
      const mockNotifications: Notification[] = [
        {
          id: '1',
          title: 'Neural Network Training',
          message: 'Training completed with 92% accuracy',
          type: 'success',
          timestamp: new Date(),
          read: false,
        },
        {
          id: '2',
          title: 'New Prediction',
          message: 'New prediction available for R_10 market',
          type: 'info',
          timestamp: new Date(),
          read: true,
        },
      ];
      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter(n => !n.read).length);
    };

    if (settings.notifications.enabled) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [settings.notifications.enabled]);

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => prev -1);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-xs flex items-center justify-center text-primary-foreground">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <ScrollArea className="h-[300px] w-full p-4">
          {notifications.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No notifications
            </p>
          ) : (
            notifications.map(notification => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  "flex flex-col items-start p-3 cursor-pointer",
                  !notification.read && "bg-muted/50"
                )}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-center gap-2 w-full">
                  <span className="font-medium">{notification.title}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {new Date(notification.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {notification.message}
                </p>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}