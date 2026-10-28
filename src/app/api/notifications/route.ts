import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NotificationItem } from '@/types/notification';

// Sample notifications if database is fresh
const SAMPLE_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    userId: 'usr-current-user-001',
    bookingId: 'bk-1',
    title: 'จองห้องประชุมสำเร็จ',
    message: 'การจองห้องประชุมใหญ่ ไพลิน (MR-101) วันที่ 28 ต.ค. 10:00 - 11:30 ได้รับการยืนยันแล้ว',
    type: 'BOOKING_CONFIRMED',
    isRead: false,
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-2',
    userId: 'usr-current-user-001',
    bookingId: 'bk-2',
    title: 'แจ้งเตือน: ใกล้ถึงเวลาประชุม 15 นาที',
    message: 'ห้องประชุม มรกต: ประชุม Sprint Retrospective จะเริ่มในอีก 15 นาที',
    type: 'REMINDER_15MIN',
    isRead: false,
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-3',
    userId: 'usr-current-user-001',
    title: 'แจ้งปิดปรับปรุงห้องประชุม',
    message: 'ห้องประชุม ทับทิม (Ruby VIP) จะปิดปรับปรุงระบบจอภาพในวันที่ 30 ต.ค. นี้',
    type: 'ROOM_MAINTENANCE',
    isRead: true,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
];

let inMemoryNotifications = [...SAMPLE_NOTIFICATIONS];

/**
 * GET /api/notifications
 * ดึงรายการการแจ้งเตือนของผู้ใช้ พร้อมจำนวนที่ยังไม่ได้อ่าน (unreadCount)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'usr-current-user-001';

    try {
      const dbNotifs = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      if (dbNotifs.length > 0) {
        const unreadCount = dbNotifs.filter((n) => !n.isRead).length;
        return NextResponse.json({
          success: true,
          data: dbNotifs,
          unreadCount,
        });
      }
    } catch {
      // Fallback to in-memory state
    }

    const unreadCount = inMemoryNotifications.filter((n) => !n.isRead).length;

    return NextResponse.json({
      success: true,
      data: inMemoryNotifications,
      unreadCount,
    });
  } catch (error: any) {
    console.error('Error in /api/notifications:', error);
    return NextResponse.json(
      { success: false, error: 'ไม่สามารถดึงข้อมูลการแจ้งเตือนได้' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications
 * ทำเครื่องหมายว่าอ่านแล้ว (Mark as read)
 * Body: { notificationId?: string, markAll?: boolean }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationId, markAll } = body;

    if (markAll) {
      try {
        await prisma.notification.updateMany({
          where: { isRead: false },
          data: { isRead: true },
        });
      } catch {
        // Fallback
      }
      inMemoryNotifications = inMemoryNotifications.map((n) => ({ ...n, isRead: true }));
    } else if (notificationId) {
      try {
        await prisma.notification.update({
          where: { id: notificationId },
          data: { isRead: true },
        });
      } catch {
        // Fallback
      }
      inMemoryNotifications = inMemoryNotifications.map((n) =>
        n.id === notificationId ? { ...n, isRead: true } : n
      );
    }

    const unreadCount = inMemoryNotifications.filter((n) => !n.isRead).length;

    return NextResponse.json({
      success: true,
      message: 'อัปเดตสถานะการแจ้งเตือนเรียบร้อยแล้ว',
      unreadCount,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'เกิดข้อผิดพลาดในการอัปเดต' },
      { status: 500 }
    );
  }
}
