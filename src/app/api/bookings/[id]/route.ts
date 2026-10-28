import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BookingService } from '@/lib/booking-service';
import { UserRole } from '@/types/booking';

const bookingService = new BookingService(prisma);

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/bookings/:id
 * ดึงรายละเอียดการจองรายรายการ
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const booking = await bookingService.getBookingById(id);

    return NextResponse.json({
      success: true,
      data: booking,
    });
  } catch (error: any) {
    console.error(`Error fetching booking:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'ไม่พบข้อมูลการจอง',
      },
      { status: error.message?.includes('ไม่พบ') ? 404 : 500 }
    );
  }
}

/**
 * DELETE /api/bookings/:id หรือ PATCH /api/bookings/:id/cancel
 * ยกเลิกรายการจอง
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);

    // ในการใช้งานจริง ค่า userId & userRole จะถูกดึงจาก Authentication Session (NextAuth)
    const userId = request.headers.get('x-user-id') || searchParams.get('userId');
    const userRole = (request.headers.get('x-user-role') || searchParams.get('userRole') || 'EMPLOYEE') as UserRole;
    const reason = searchParams.get('reason') || undefined;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'จำเป็นต้องระบุตัวตนผู้ยกเลิก (User ID)',
        },
        { status: 401 }
      );
    }

    const cancelledBooking = await bookingService.cancelBooking({
      bookingId: id,
      userId,
      userRole,
      reason,
    });

    return NextResponse.json({
      success: true,
      message: 'ยกเลิกการจองเรียบร้อยแล้ว',
      data: cancelledBooking,
    });
  } catch (error: any) {
    console.error(`Error cancelling booking:`, error);
    const isPermissionError = error.message?.includes('ไม่มีสิทธิ์');
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'เกิดข้อผิดพลาดในการยกเลิกการจอง',
      },
      { status: isPermissionError ? 403 : 400 }
    );
  }
}
