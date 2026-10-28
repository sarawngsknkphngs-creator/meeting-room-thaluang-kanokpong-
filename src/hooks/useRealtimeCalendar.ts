'use client';

import { useEffect, useState, useCallback } from 'react';
import { RealtimeMessage } from '@/types/booking';

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  extendedProps: Record<string, any>;
}

/**
 * Custom React Hook สำหรับเชื่อมต่อ Real-time Listener กับ Backend SSE
 * อัปเดตตารางปฏิทินและสถานะห้องทันทีที่มีการจองหรือยกเลิก
 */
export function useRealtimeCalendar(selectedRoomId?: string) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastNotification, setLastNotification] = useState<string | null>(null);

  // ฟังก์ชันโหลดข้อมูล Event ทั้งหมดจาก API
  const fetchCalendarEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      const url = selectedRoomId
        ? `/api/calendar?roomId=${encodeURIComponent(selectedRoomId)}`
        : '/api/calendar';
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setEvents(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch calendar events:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedRoomId]);

  useEffect(() => {
    // 1. โหลดข้อมูลรอบแรก
    fetchCalendarEvents();

    // 2. เริ่มต้นเชื่อมต่อ Real-time SSE Stream
    const eventSource = new EventSource('/api/realtime');

    eventSource.addEventListener('open', () => {
      setIsConnected(true);
      console.log('⚡ Connected to real-time meeting room stream');
    });

    // เมื่อมีคนสร้างการจองใหม่
    eventSource.addEventListener('BOOKING_CREATED', (e) => {
      const msg: RealtimeMessage<any> = JSON.parse(e.data);
      console.log('📢 Real-time event: Booking created', msg.payload);
      setLastNotification(`มีการจองใหม่: ${msg.payload.roomName} (${msg.payload.title})`);

      // รีเฟรชตารางปฏิทินทันที
      fetchCalendarEvents();
    });

    // เมื่อมีคนยกเลิกการจอง
    eventSource.addEventListener('BOOKING_CANCELLED', (e) => {
      const msg: RealtimeMessage<any> = JSON.parse(e.data);
      console.log('📢 Real-time event: Booking cancelled', msg.payload);
      setLastNotification(`ห้องว่างแล้ว: มีการยกเลิกการจองห้อง ${msg.payload.roomName}`);

      // รีเฟรชตารางปฏิทินทันที
      fetchCalendarEvents();
    });

    eventSource.onerror = (err) => {
      console.warn('Real-time connection warning (will auto-reconnect):', err);
      setIsConnected(false);
    };

    // ปิด connection เมื่อ unmount
    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [fetchCalendarEvents]);

  return {
    events,
    isLoading,
    isConnected,
    lastNotification,
    refresh: fetchCalendarEvents,
  };
}
