import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BookingService } from '@/lib/booking-service';
import { BookingStatus } from '@/types/booking';

const bookingService = new BookingService(prisma);

/**
 * GET /api/bookings
 * ดึงรายการการจองทั้งหมด รองรับ Filters & Pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const roomId = searchParams.get('roomId') || undefined;
    const userId = searchParams.get('userId') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const status = (searchParams.get('status') as BookingStatus) || undefined;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 20;

    const result = await bookingService.listBookings({
      roomId,
      userId,
      startDate,
      endDate,
      status,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'ไม่สามารถดึงข้อมูลรายการจองได้',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bookings
 * สร้างรายการจองห้องประชุมใหม่ (Concurrency-safe)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      title,
      description,
      roomId,
      userId,
      startTime,
      endTime,
      attendeeCount,
      attendees,
    } = body;

    // Basic Input Validation
    if (!title || !roomId || !userId || !startTime || !endTime) {
      return NextResponse.json(
        {
          success: false,
          error: 'กรุณากรอกข้อมูล title, roomId, userId, startTime, และ endTime ให้ครบถ้วน',
        },
        { status: 400 }
      );
    }

    const booking = await bookingService.createBooking({
      title,
      description,
      roomId,
      userId,
      startTime,
      endTime,
      attendeeCount,
      attendees,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'จองห้องประชุมสำเร็จ',
        data: booking,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating booking:', error);
    const isConflict =
      error.message?.includes('มีผู้อื่นจองห้องนี้') ||
      error.message?.includes('prevent_overlapping_room_bookings');

    return NextResponse.json(
      {
        success: false,
        error: isConflict
          ? 'ห้องประชุมนี้ถูกจองไปแล้วในช่วงเวลาดังกล่าว กรุณาเลือกช่วงเวลาอื่น'
          : error.message || 'เกิดข้อผิดพลาดในการจองห้องประชุม',
      },
      { status: isConflict ? 409 : 400 }
    );
  }
}
