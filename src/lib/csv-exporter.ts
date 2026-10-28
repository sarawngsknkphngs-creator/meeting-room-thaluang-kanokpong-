/**
 * CSV Exporter with UTF-8 BOM
 * ใส่ BOM (\uFEFF) เสมอ เพื่อให้ Microsoft Excel บน Windows และ Mac เปิดภาษาไทยได้โดยไม่เป็นภาษาต่างดาว
 */

export interface BookingReportRow {
  bookingCode: string;
  title: string;
  roomName: string;
  roomCode: string;
  userName: string;
  department: string;
  date: string;
  startTime: string;
  endTime: string;
  durationHours: string;
  attendeeCount: number;
  status: string;
}

export function generateBookingsCSV(rows: BookingReportRow[]): string {
  const headers = [
    'รหัสการจอง',
    'หัวข้อการประชุม',
    'ห้องประชุม',
    'รหัสห้อง',
    'ผู้จัดประชุม',
    'แผนก',
    'วันที่',
    'เวลาเริ่มต้น',
    'เวลาสิ้นสุด',
    'ระยะเวลา (ชม.)',
    'จำนวนผู้เข้าร่วม',
    'สถานะ',
  ];

  const escapeCSV = (value: string | number | undefined | null) => {
    if (value === undefined || value === null) return '""';
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      [
        escapeCSV(row.bookingCode),
        escapeCSV(row.title),
        escapeCSV(row.roomName),
        escapeCSV(row.roomCode),
        escapeCSV(row.userName),
        escapeCSV(row.department),
        escapeCSV(row.date),
        escapeCSV(row.startTime),
        escapeCSV(row.endTime),
        escapeCSV(row.durationHours),
        row.attendeeCount,
        escapeCSV(row.status),
      ].join(',')
    ),
  ].join('\r\n');

  // ใส่ UTF-8 BOM นำหน้า (\uFEFF)
  return `\uFEFF${csvContent}`;
}
