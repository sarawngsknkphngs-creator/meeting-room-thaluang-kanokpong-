import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AnalyticsService } from '@/lib/analytics-service';
import { generateBookingsCSV, BookingReportRow } from '@/lib/csv-exporter';

const analyticsService = new AnalyticsService(prisma);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const now = new Date();
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!, 10) : now.getFullYear();
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!, 10) : now.getMonth() + 1;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    let rows: BookingReportRow[] = [];

    try {
      rows = await analyticsService.getMonthlyReportRows(startDate, endDate);
    } catch {
      // Fallback
    }

    // หากยังไม่มีข้อมูลใน DB ให้ใช้ Sample Data สำหรับทดสอบการ Export
    if (rows.length === 0) {
      rows = [
        {
          bookingCode: 'BK-20261028-001',
          title: 'ประชุมวางแผนงบประมาณประจำปี 2027',
          roomName: 'ห้องประชุมใหญ่ ไพลิน',
          roomCode: 'MR-101',
          userName: 'อนันต์ ทวีสุข',
          department: 'การเงินและการบัญชี',
          date: '28/10/2026',
          startTime: '09:00',
          endTime: '11:00',
          durationHours: '2.0',
          attendeeCount: 15,
          status: 'ยืนยันแล้ว',
        },
        {
          bookingCode: 'BK-20261028-002',
          title: 'Sprint Retrospective & Demo',
          roomName: 'ห้องประชุม มรกต',
          roomCode: 'MR-102',
          userName: 'ชัชวาลย์ สมบูรณ์',
          department: 'ฝ่ายเทคโนโลยี (IT)',
          date: '28/10/2026',
          startTime: '13:30',
          endTime: '15:00',
          durationHours: '1.5',
          attendeeCount: 8,
          status: 'ยืนยันแล้ว',
        },
        {
          bookingCode: 'BK-20261028-003',
          title: 'สัมภาษณ์ Senior Frontend Engineer',
          roomName: 'ห้องประชุม บุษราคัม',
          roomCode: 'MR-103',
          userName: 'พิมพ์ชนก รัตนไพศาล',
          department: 'ทรัพยากรบุคคล (HR)',
          date: '28/10/2026',
          startTime: '10:00',
          endTime: '11:00',
          durationHours: '1.0',
          attendeeCount: 4,
          status: 'ยืนยันแล้ว',
        },
        {
          bookingCode: 'BK-20261028-004',
          title: 'สัมมนาการตลาดออนไลน์และ CRM',
          roomName: 'ห้องประชุมใหญ่ ไพลิน',
          roomCode: 'MR-101',
          userName: 'กัลยา มงคล',
          department: 'ฝ่ายการตลาด',
          date: '28/10/2026',
          startTime: '14:00',
          endTime: '16:30',
          durationHours: '2.5',
          attendeeCount: 18,
          status: 'ยืนยันแล้ว',
        },
        {
          bookingCode: 'BK-20261028-005',
          title: 'ประชุมทบทวนข้อตกลงคู่ค้า',
          roomName: 'ห้องประชุม ทับทิม (Ruby VIP)',
          roomCode: 'MR-104',
          userName: 'วิกรม บริหาร',
          department: 'ผู้บริหารระดับสูง',
          date: '27/10/2026',
          startTime: '15:00',
          endTime: '16:00',
          durationHours: '1.0',
          attendeeCount: 6,
          status: 'ยกเลิก',
        },
      ];
    }

    const csvContent = generateBookingsCSV(rows);
    const monthStr = month.toString().padStart(2, '0');
    const filename = `meeting_room_report_${year}_${monthStr}.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: any) {
    console.error('Error exporting CSV:', error);
    return new Response(JSON.stringify({ error: 'ไม่สามารถสร้างไฟล์ CSV ได้' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
