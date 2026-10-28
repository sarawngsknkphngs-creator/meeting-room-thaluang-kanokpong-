// TypeScript Types & DTOs for Booking System

export type UserRole = 'ADMIN' | 'EMPLOYEE';

export type RoomStatus = 'AVAILABLE' | 'MAINTENANCE' | 'INACTIVE';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export type RealtimeEventType = 
  | 'BOOKING_CREATED' 
  | 'BOOKING_CANCELLED' 
  | 'BOOKING_UPDATED' 
  | 'ROOM_AVAILABILITY_CHANGED';

export interface CheckAvailabilityQuery {
  roomId: string;
  startTime: string | Date;
  endTime: string | Date;
  excludeBookingId?: string; // สำหรับกรณี Edit booking เดิม
}

export interface AvailabilityResult {
  isAvailable: boolean;
  roomId: string;
  startTime: Date;
  endTime: Date;
  conflicts: {
    id: string;
    bookingCode: string;
    title: string;
    startTime: Date;
    endTime: Date;
    status: BookingStatus;
  }[];
  reason?: string;
}

export interface CreateBookingDTO {
  title: string;
  description?: string;
  roomId: string;
  userId: string;
  startTime: string | Date;
  endTime: string | Date;
  attendeeCount?: number;
  attendees?: {
    email: string;
    name?: string;
    isInternal?: boolean;
    userId?: string;
  }[];
}

export interface CancelBookingDTO {
  bookingId: string;
  userId: string;
  userRole: UserRole;
  reason?: string;
}

export interface BookingFilterQuery {
  roomId?: string;
  userId?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  status?: BookingStatus;
  page?: number;
  limit?: number;
}

export interface RealtimeMessage<T = unknown> {
  type: RealtimeEventType;
  timestamp: string;
  payload: T;
}
