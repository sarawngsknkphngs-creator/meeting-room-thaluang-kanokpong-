'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '@/context/ToastContext';
import { NotificationItem } from '@/types/notification';
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Inbox,
  Sparkles,
} from 'lucide-react';

export const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { showToast } = useToast();

  // Fetch initial notifications
  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/notifications');
      const json = await res.json();
      if (json.success) {
        setNotifications(json.data);
        setUnreadCount(json.unreadCount);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Close dropdown on outside click
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    // Listen for Real-time SSE Events
    const eventSource = new EventSource('/api/realtime');

    eventSource.addEventListener('BOOKING_CREATED', (e) => {
      const msg = JSON.parse(e.data);
      const payload = msg.payload;

      // 1. Toast Notification เด้งขึ้นมาทันที
      showToast({
        type: 'success',
        title: '🎉 มีการจองห้องประชุมสำเร็จ!',
        message: `${payload.roomName}: "${payload.title}" โดย ${payload.userName}`,
        duration: 6000,
      });

      // 2. เพิ่มข้อความใหม่ลงใน Bell Notification List
      const newNotif: NotificationItem = {
        id: `notif-${Date.now()}`,
        userId: 'usr-current-user-001',
        title: 'จองห้องประชุมสำเร็จ',
        message: `ห้อง ${payload.roomName} ถูกจองสำหรับ "${payload.title}" (${payload.userName})`,
        type: 'BOOKING_CONFIRMED',
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    eventSource.addEventListener('BOOKING_CANCELLED', (e) => {
      const msg = JSON.parse(e.data);
      const payload = msg.payload;

      showToast({
        type: 'info',
        title: '📢 ห้องประชุมว่างแล้ว',
        message: `มีการยกเลิกการจองห้อง ${payload.roomName} ทำให้ช่วงเวลานี้เปิดว่างให้จองได้`,
        duration: 5000,
      });

      const cancelNotif: NotificationItem = {
        id: `notif-${Date.now()}`,
        userId: 'usr-current-user-001',
        title: 'ยกเลิกการจองห้องประชุม',
        message: `รายการจองห้อง ${payload.roomName} (${payload.bookingCode}) ถูกยกเลิกแล้ว`,
        type: 'BOOKING_CANCELLED',
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      setNotifications((prev) => [cancelNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      eventSource.close();
    };
  }, [showToast]);

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  // Mark single as read
  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const renderIcon = (type: string) => {
    switch (type) {
      case 'BOOKING_CONFIRMED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'REMINDER_15MIN':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'BOOKING_CANCELLED':
        return <XCircle className="w-4 h-4 text-rose-500" />;
      case 'ROOM_MAINTENANCE':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button with Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs"
        title="การแจ้งเตือน"
      >
        <Bell className="w-4 h-4 text-slate-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center animate-bounce shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in duration-150">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm">การแจ้งเตือน</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                  {unreadCount} ใหม่
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                อ่านทั้งหมด
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <Inbox className="w-8 h-8 text-slate-300" />
                ไม่มีรายการแจ้งเตือนในขณะนี้
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => !item.isRead && handleMarkAsRead(item.id)}
                  className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                    item.isRead ? 'bg-white hover:bg-slate-50' : 'bg-blue-50/40 hover:bg-blue-50/70'
                  }`}
                >
                  <div className="mt-0.5 p-1.5 rounded-xl bg-white border border-slate-200/60 shadow-2xs">
                    {renderIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4
                        className={`text-xs truncate ${
                          item.isRead ? 'font-medium text-slate-800' : 'font-bold text-slate-900'
                        }`}
                      >
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {new Date(item.createdAt).toLocaleTimeString('th-TH', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-2">
                      {item.message}
                    </p>
                  </div>
                  {!item.isRead && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5"></span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
