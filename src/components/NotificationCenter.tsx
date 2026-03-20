import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  X, 
  Check, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  Trash2,
  Loader2
} from 'lucide-react';
import { notificationService, Notification } from '../services/notificationService';
import { cn } from '../lib/utils';
import { formatDistanceToNow } from 'date-fns';

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
    
    // Polling for new notifications (simplified for now)
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    const [notifsRes, countRes] = await Promise.all([
      notificationService.getNotifications(),
      notificationService.getUnreadCount()
    ]);
    
    if (notifsRes.data) setNotifications(notifsRes.data);
    if (countRes.count !== undefined) setUnreadCount(countRes.count);
  };

  const handleMarkAsRead = async (id: string) => {
    const { error } = await notificationService.markAsRead(id);
    if (!error) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const handleMarkAllAsRead = async () => {
    setLoading(true);
    const { error } = await notificationService.markAllAsRead();
    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await notificationService.deleteNotification(id);
    if (!error) {
      setNotifications(prev => prev.filter(n => n.id !== id));
      // Update unread count if the deleted notification was unread
      const deletedNotif = notifications.find(n => n.id === id);
      if (deletedNotif && !deletedNotif.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle size={16} className="text-amber-500" />;
      case 'error': return <X size={16} className="text-red-500" />;
      case 'success': return <CheckCircle size={16} className="text-emerald-500" />;
      default: return <Info size={16} className="text-blue-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-stone-500 hover:text-stone-900 transition-colors rounded-full hover:bg-stone-100"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[500px] overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl z-50 flex flex-col">
          <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3 bg-stone-50">
            <h3 className="font-bold text-stone-900">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                disabled={loading}
                className="text-xs font-medium text-emerald-600 hover:text-emerald-700 disabled:opacity-50 flex items-center gap-1"
              >
                {loading ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                Mark all as read
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-stone-500 space-y-2">
                <Bell size={32} className="mx-auto text-stone-200" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={cn(
                      "p-4 transition-colors hover:bg-stone-50 group relative",
                      !notification.is_read && "bg-emerald-50/30"
                    )}
                  >
                    <div className="flex gap-3">
                      <div className="mt-1 shrink-0">{getIcon(notification.type)}</div>
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-start">
                          <p className={cn(
                            "text-sm font-semibold",
                            notification.is_read ? "text-stone-700" : "text-stone-900"
                          )}>
                            {notification.title}
                          </p>
                          <button 
                            onClick={() => handleDelete(notification.id)}
                            className="text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <p className="text-xs text-stone-500 leading-relaxed">
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-stone-400">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    {!notification.is_read && (
                      <button 
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="absolute top-4 right-10 text-emerald-600 hover:text-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Mark as read"
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-stone-100 p-3 bg-stone-50 text-center">
            <button className="text-xs font-bold text-stone-500 hover:text-stone-900 uppercase tracking-wider">
              View All Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
