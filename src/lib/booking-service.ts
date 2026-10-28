import { PrismaClient } from '@prisma/client';
import { checkRoomAvailability, validateBookingTime } from './conflict-checker';
import { realtimeBroadcaster } from './realtime-broadcaster';
import { sendLineBookingNotification, sendBookingEmail } from './notification-providers';
import { CreateBookingDTO, CancelBookingDTO, BookingFilterQuery } from '@/types/booking';

/**
 * สร้างรหัสการจองแบบ Unique (เช่น BK-20261028-A4F2)
 */
function generateBookingCode(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BK-${dateStr}-${randomSuffix}`;
}

export class BookingService {
  constructor(private db: PrismaClient) {}

  /**
   * 1. ตรวจสอบความพร้อมของห้อง (Availability & Conflict Check)
   */
  async checkAvailability(roomId: string, startTime: Date, endTime: Date, excludeBookingId?: string) {
    return checkRoomAvailability(this.db, {
      roomId,
      startTime,
      endTime,
      excludeBookingId,
    });
  }

  /**
   * 2. สร้างรายการจองใหม่ (Create Booking with Transaction & Real-time Broadcast)
   */
  async createBooking(dto: CreateBookingDTO) {
    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);

    // ตรวจสอบความถูกต้องของช่วงเวลา
    const timeValidation = validateBookingTime(start, end);
    if (!timeValidation.isValid) {
      throw new Error(timeValidation.error);
    }

    // ทำงานภายใต้ Database Transaction เพื่อป้องกัน Race Condition (Double-booking)
    const newBooking = await this.db.$transaction(async (tx) => {
      // 2.1 ตรวจสอบความขัดแย้งอีกครั้งภายใน Transaction Lock
      const conflicts = await tx.booking.findMany({
        where: {
          roomId: dto.roomId,
          status: { in: ['CONFIRMED', 'PENDING'] },
          startTime: { lt: end },
          endTime: { gt: start },
        },
      });

      if (conflicts.length > 0) {
        throw new Error('ไม่สามารถจองได้ เนื่องจากมีผู้อื่นจองห้องนี้ในช่วงเวลาดังกล่าวแล้ว');
      }

      // 2.2 ตรวจสอบความจุของห้อง
      const room = await tx.room.findUnique({
        where: { id: dto.roomId },
      });

      if (!room || room.status !== 'AVAILABLE') {
        throw new Error('ห้องประชุมไม่พร้อมให้บริการ');
      }

      if (dto.attendeeCount && dto.attendeeCount > room.capacity) {
        throw new Error(`จำนวนผู้เข้าร่วม (${dto.attendeeCount} คน) เกินความจุของห้อง (${room.capacity} คน)`);
      }

      // 2.3 สร้างรหัสและบันทึก Booking
      const bookingCode = generateBookingCode();
      const booking = await tx.booking.create({
        data: {
          bookingCode,
          title: dto.title,
          description: dto.description,
          roomId: dto.roomId,
          userId: dto.userId,
          startTime: start,
          endTime: end,
          attendeeCount: dto.attendeeCount || 1,
          status: 'CONFIRMED',
          attendees: dto.attendees && dto.attendees.length > 0
            ? {
                createMany: {
                  data: dto.attendees.map((a) => ({
                    email: a.email,
                    name: a.name || null,
                    isInternal: a.isInternal ?? true,
                    userId: a.userId || null,
                  })),
                },
              }
            : undefined,
        },
        include: {
          room: true,
          user: {
            select: { id: true, name: true, email: true },
          },
          attendees: true,
        },
      });

      // 2.4 สร้าง Audit Log
      await tx.auditLog.create({
        data: {
          userId: dto.userId,
          action: 'CREATE_BOOKING',
          entityType: 'Booking',
          entityId: booking.id,
          details: {
            bookingCode: booking.bookingCode,
            roomId: booking.roomId,
            roomName: room.name,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
          },
        },
      });

      // 2.5 สร้างการแจ้งเตือน (In-App Notification)
      await tx.notification.create({
        data: {
          userId: dto.userId,
          bookingId: booking.id,
          title: 'จองห้องประชุมสำเร็จ',
          message: `คุณได้จองห้อง ${room.name} ในวันที่ ${start.toLocaleDateString('th-TH')} เวลา ${start.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} เรียบร้อยแล้ว`,
          type: 'BOOKING_CONFIRMED',
        },
      });

      return booking;
    });

    // 2.6 ส่งสัญญาณ Real-time แจ้งเตือนไปยังทุก Client ที่เชื่อมต่ออยู่
    realtimeBroadcaster.broadcast('BOOKING_CREATED', {
      bookingId: newBooking.id,
      bookingCode: newBooking.bookingCode,
      roomId: newBooking.roomId,
      roomName: newBooking.room.name,
      title: newBooking.title,
      startTime: newBooking.startTime,
      endTime: newBooking.endTime,
      userId: newBooking.userId,
      userName: newBooking.user.name,
    });

    realtimeBroadcaster.broadcast('ROOM_AVAILABILITY_CHANGED', {
      roomId: newBooking.roomId,
      timestamp: new Date().toISOString(),
    });

    // 2.7 ส่งแจ้งเตือนภายนอก (LINE Notify & Email) แบบ Asynchronous Background
    sendLineBookingNotification({
      bookingCode: newBooking.bookingCode,
      title: newBooking.title,
      roomName: newBooking.room.name,
      roomCode: newBooking.room.roomCode,
      userName: newBooking.user.name,
      userEmail: newBooking.user.email,
      startTime: newBooking.startTime,
      endTime: newBooking.endTime,
      attendeeEmails: newBooking.attendees?.map((a: any) => a.email),
    }).catch((err) => console.error('Failed to dispatch LINE notification:', err));

    sendBookingEmail({
      bookingCode: newBooking.bookingCode,
      title: newBooking.title,
      roomName: newBooking.room.name,
      roomCode: newBooking.room.roomCode,
      userName: newBooking.user.name,
      userEmail: newBooking.user.email,
      startTime: newBooking.startTime,
      endTime: newBooking.endTime,
      attendeeEmails: newBooking.attendees?.map((a: any) => a.email),
    }).catch((err) => console.error('Failed to dispatch booking email:', err));

    return newBooking;
  }

  /**
   * 3. ยกเลิกการจอง (Cancel Booking with Authorization Check & Real-time Update)
   */
  async cancelBooking(dto: CancelBookingDTO) {
    const booking = await this.db.booking.findUnique({
      where: { id: dto.bookingId },
      include: { room: true, user: true },
    });

    if (!booking) {
      throw new Error('ไม่พบข้อมูลการจอง');
    }

    if (booking.status === 'CANCELLED') {
      throw new Error('รายการจองนี้ถูกยกเลิกไปแล้ว');
    }

    // ตรวจสอบสิทธิ์ (ผู้สร้าง หรือ Admin เท่านั้น)
    const isOwner = booking.userId === dto.userId;
    const isAdmin = dto.userRole === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new Error('คุณไม่มีสิทธิ์ในการยกเลิกรายการจองนี้');
    }

    // พนักงานทั่วไปยกเลิกได้เฉพาะก่อนเริ่มการประชุม
    if (!isAdmin && new Date() >= booking.startTime) {
      throw new Error('ไม่สามารถยกเลิกการจองที่เริ่มไปแล้วหรือสิ้นสุดแล้วได้');
    }

    // อัปเดตสถานะเป็น CANCELLED ภายใต้ Transaction
    const updated = await this.db.$transaction(async (tx) => {
      const cancelledBooking = await tx.booking.update({
        where: { id: dto.bookingId },
        data: {
          status: 'CANCELLED',
          rejectionReason: dto.reason || (isAdmin && !isOwner ? 'ยกเลิกโดยผู้ดูแลระบบ' : 'ยกเลิกโดยผู้จอง'),
        },
        include: { room: true, user: true },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: dto.userId,
          action: 'CANCEL_BOOKING',
          entityType: 'Booking',
          entityId: cancelledBooking.id,
          details: {
            bookingCode: cancelledBooking.bookingCode,
            cancelledBy: dto.userId,
            reason: cancelledBooking.rejectionReason,
          },
        },
      });

      // Notification แจ้งเจ้าของห้องหากถูกยกเลิกโดยแอดมิน
      if (isAdmin && !isOwner) {
        await tx.notification.create({
          data: {
            userId: booking.userId,
            bookingId: booking.id,
            title: 'รายการจองห้องประชุมถูกยกเลิก',
            message: `รายการจองห้อง ${booking.room.name} (${booking.bookingCode}) ถูกยกเลิกโดยแอดมิน เหตุผล: ${dto.reason || 'ไม่มีการระบุ'}`,
            type: 'BOOKING_CANCELLED',
          },
        });
      }

      return cancelledBooking;
    });

    // แจ้งเตือน Real-time ให้ปฏิทินของทุกคนปลดล็อกช่วงเวลานี้ทันที
    realtimeBroadcaster.broadcast('BOOKING_CANCELLED', {
      bookingId: updated.id,
      bookingCode: updated.bookingCode,
      roomId: updated.roomId,
      roomName: updated.room.name,
      startTime: updated.startTime,
      endTime: updated.endTime,
      cancelledBy: dto.userId,
    });

    realtimeBroadcaster.broadcast('ROOM_AVAILABILITY_CHANGED', {
      roomId: updated.roomId,
      timestamp: new Date().toISOString(),
    });

    return updated;
  }

  /**
   * 4. ดึงข้อมูลการจองตาม ID (Get Booking by ID)
   */
  async getBookingById(id: string) {
    const booking = await this.db.booking.findUnique({
      where: { id },
      include: {
        room: {
          include: {
            amenities: {
              include: { amenity: true },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
            phoneNumber: true,
          },
        },
        attendees: true,
      },
    });

    if (!booking) {
      throw new Error('ไม่พบข้อมูลการจอง');
    }

    return booking;
  }

  /**
   * 5. ดึงรายการการจองพร้อมตัวกรองและการแบ่งหน้า (List Bookings with Filters)
   */
  async listBookings(filters: BookingFilterQuery) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.roomId) {
      where.roomId = filters.roomId;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      where.startTime = {};
      if (filters.startDate) {
        where.startTime.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.startTime.lte = new Date(filters.endDate);
      }
    }

    const [total, items] = await Promise.all([
      this.db.booking.count({ where }),
      this.db.booking.findMany({
        where,
        include: {
          room: { select: { id: true, name: true, roomCode: true, capacity: true } },
          user: { select: { id: true, name: true, email: true, department: true } },
        },
        orderBy: { startTime: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 6. ดึงข้อมูลสำหรับการแสดงผลบน FullCalendar
   */
  async getCalendarEvents(params: { startDate: Date; endDate: Date; roomId?: string }) {
    const bookings = await this.db.booking.findMany({
      where: {
        status: { in: ['CONFIRMED', 'PENDING'] },
        ...(params.roomId ? { roomId: params.roomId } : {}),
        startTime: { gte: params.startDate },
        endTime: { lte: params.endDate },
      },
      include: {
        room: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
      },
      orderBy: { startTime: 'asc' },
    });

    // แปลง Format ให้เข้ากับ FullCalendar Event Object
    return bookings.map((b) => ({
      id: b.id,
      title: `${b.room.name}: ${b.title}`,
      start: b.startTime.toISOString(),
      end: b.endTime.toISOString(),
      backgroundColor: b.status === 'CONFIRMED' ? '#2563eb' : '#f59e0b',
      borderColor: b.status === 'CONFIRMED' ? '#1d4ed8' : '#d97706',
      extendedProps: {
        bookingCode: b.bookingCode,
        roomId: b.roomId,
        roomName: b.room.name,
        userId: b.userId,
        userName: b.user.name,
        status: b.status,
        attendeeCount: b.attendeeCount,
      },
    }));
  }
}
