import { PrismaClient } from '@prisma/client';
import { AvailabilityResult, CheckAvailabilityQuery } from '@/types/booking';

/**
 * ตรวจสอบความถูกต้องของช่วงเวลา (Time Range Validation)
 */
export function validateBookingTime(startTime: Date, endTime: Date): { isValid: boolean; error?: string } {
  const now = new Date();

  if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
    return { isValid: false, error: 'รูปแบบวันและเวลาไม่ถูกต้อง' };
  }

  if (startTime >= endTime) {
    return { isValid: false, error: 'เวลาเริ่มต้นต้องมาก่อนเวลาสิ้นสุด' };
  }

  // ห้ามจองย้อนหลัง (เผื่อ buffer เล็กน้อย 2 นาทีสำหรับ network delay)
  const bufferPast = new Date(now.getTime() - 2 * 60 * 1000);
  if (startTime < bufferPast) {
    return { isValid: false, error: 'ไม่สามารถจองห้องประชุมย้อนหลังได้' };
  }

  // ระยะเวลาจองขั้นต่ำ 15 นาที
  const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
  if (durationMinutes < 15) {
    return { isValid: false, error: 'ระยะเวลาจองห้องประชุมขั้นต่ำคือ 15 นาที' };
  }

  // ระยะเวลาจองสูงสุดไม่เกิน 24 ชั่วโมงต่อครั้ง
  if (durationMinutes > 24 * 60) {
    return { isValid: false, error: 'ระยะเวลาการจองสูงสุดต้องไม่เกิน 24 ชั่วโมง' };
  }

  return { isValid: true };
}

/**
 * ตรวจสอบความขัดแย้งของเวลา (Conflict Checking) สำหรับห้องประชุมที่กำหนด
 * เงื่อนไขการทับซ้อน (Overlap Condition):
 * (Existing.startTime < New.endTime) AND (Existing.endTime > New.startTime)
 */
export async function checkRoomAvailability(
  db: PrismaClient,
  query: CheckAvailabilityQuery
): Promise<AvailabilityResult> {
  const start = new Date(query.startTime);
  const end = new Date(query.endTime);

  const validation = validateBookingTime(start, end);
  if (!validation.isValid) {
    return {
      isAvailable: false,
      roomId: query.roomId,
      startTime: start,
      endTime: end,
      conflicts: [],
      reason: validation.error,
    };
  }

  // 1. ตรวจสอบสถานะของห้องก่อนว่าพร้อมใช้งานหรือไม่
  const room = await db.room.findUnique({
    where: { id: query.roomId },
    select: { id: true, name: true, status: true },
  });

  if (!room) {
    return {
      isAvailable: false,
      roomId: query.roomId,
      startTime: start,
      endTime: end,
      conflicts: [],
      reason: 'ไม่พบห้องประชุมที่ระบุในระบบ',
    };
  }

  if (room.status !== 'AVAILABLE') {
    return {
      isAvailable: false,
      roomId: query.roomId,
      startTime: start,
      endTime: end,
      conflicts: [],
      reason: `ห้องประชุมนี้ปิดให้บริการชั่วคราว (สถานะ: ${room.status})`,
    };
  }

  // 2. ค้นหารายการจองที่ทับซ้อนกันในช่วงเวลานี้
  const conflicts = await db.booking.findMany({
    where: {
      roomId: query.roomId,
      status: { in: ['CONFIRMED', 'PENDING'] },
      // เงื่อนไขคณิตศาสตร์ของการทับซ้อนของช่วงเวลา
      startTime: { lt: end },
      endTime: { gt: start },
      // ถ้าเป็นการแก้ไข Booking เดิม ให้ยกเว้น ID ของตัวเอง
      ...(query.excludeBookingId ? { id: { not: query.excludeBookingId } } : {}),
    },
    select: {
      id: true,
      bookingCode: true,
      title: true,
      startTime: true,
      endTime: true,
      status: true,
    },
    orderBy: {
      startTime: 'asc',
    },
  });

  const isAvailable = conflicts.length === 0;

  return {
    isAvailable,
    roomId: query.roomId,
    startTime: start,
    endTime: end,
    conflicts: conflicts as any,
    reason: isAvailable ? undefined : 'มีรายการจองอื่นในช่วงเวลาดังกล่าวแล้ว',
  };
}

/**
 * ค้นหาห้องประชุมทั้งหมดที่ว่างในช่วงเวลาที่ต้องการ พร้อมรองรับตัวกรองความจุและอุปกรณ์
 */
export async function getAvailableRooms(
  db: PrismaClient,
  params: {
    startTime: Date;
    endTime: Date;
    minCapacity?: number;
    amenityIds?: string[];
  }
) {
  const { startTime, endTime, minCapacity, amenityIds } = params;

  return db.room.findMany({
    where: {
      status: 'AVAILABLE',
      ...(minCapacity ? { capacity: { gte: minCapacity } } : {}),
      ...(amenityIds && amenityIds.length > 0
        ? {
            amenities: {
              some: {
                amenityId: { in: amenityIds },
              },
            },
          }
        : {}),
      // เงื่อนไข: ต้องไม่มี Booking ใดๆ ที่ทับซ้อน
      bookings: {
        none: {
          status: { in: ['CONFIRMED', 'PENDING'] },
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
      },
    },
    include: {
      amenities: {
        include: {
          amenity: true,
        },
      },
    },
    orderBy: {
      capacity: 'asc',
    },
  });
}
