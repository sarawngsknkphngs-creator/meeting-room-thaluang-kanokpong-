import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BookingService } from '@/lib/booking-service';

const bookingService = new BookingService(prisma);

/**
 * GET /api/calendar
 * ดึงรายการตารางจองสำหรับแสดงบนปฏิทิน (FullCalendar / Month / Week / Day view)
 * Query Params:
 *  - start: ISO string (วันเริ่มต้น)
 *  - end: ISO string (วันสิ้นสุด)
 *  - roomId: string (ตัวกรองเฉพาะห้อง)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');
    const roomId = searchParams.get('roomId') || undefined;

    // ถ้าไม่ระบุ ให้ดึงช่วง 30 วันนับจากปัจจุบัน
    const startDate = startParam ? new Date(startParam) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const endDate = endParam ? new Date(endParam) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const events = await bookingService.getCalendarEvents({
      startDate,
      endDate,
      roomId,
    });

    return NextResponse.json({
      success: true,
      data: events,
    });
  } catch (error: any) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'ไม่สามารถดึงข้อมูลปฏิทินได้',
      },
      { status: 500 }
    );
  }
}
