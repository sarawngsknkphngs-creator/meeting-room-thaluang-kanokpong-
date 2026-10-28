export type NotificationType =
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'REMINDER_15MIN'
  | 'ROOM_MAINTENANCE'
  | 'SYSTEM';

export interface NotificationItem {
  id: string;
  userId: string;
  bookingId?: string | null;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp?: number;
  duration?: number;
}
