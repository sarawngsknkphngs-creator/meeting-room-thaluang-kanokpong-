import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRoomAvailability } from '@/lib/conflict-checker';

/**
 * GET /api/bookings/check
 * Query Params:
 *  - roomId: string (required)
 *  - startTime: ISO string (required)
 *  - endTime: ISO string (required)
 *  - excludeBookingId: string (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');
    const excludeBookingId = searchParams.get('excludeBookingId') || undefined;

    if (!roomId || !startTime || !endTime) {
      return NextResponse.json(
        {
          success: false,
          error: 'กรุณาระบุ roomId, startTime, และ endTime ให้ครบถ้วน',
        },
        { status: 400 }
      );
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    const result = await checkRoomAvailability(prisma, {
      roomId,
      startTime: start,
      endTime: end,
      excludeBookingId,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error in /api/bookings/check:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'เกิดข้อผิดพลาดในการตรวจสอบห้องว่าง',
      },
      { status: 500 }
    );
  }
}
