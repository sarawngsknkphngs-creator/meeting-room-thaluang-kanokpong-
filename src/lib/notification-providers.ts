/**
 * External Notification Providers
 * รองรับการส่งข้อความแจ้งเตือนผ่าน LINE Notify / LINE Messaging API และ Email (SMTP/Resend)
 */

export interface BookingNotificationPayload {
  bookingCode: string;
  title: string;
  roomName: string;
  roomCode: string;
  userName: string;
  userEmail: string;
  startTime: Date;
  endTime: Date;
  attendeeEmails?: string[];
  reason?: string;
}

// -----------------------------------------------------------------------------
// 1. LINE Notify & LINE Messaging API
// -----------------------------------------------------------------------------

/**
 * ส่งข้อความแจ้งเตือนผ่าน LINE Notify (หรือ LINE Official Account Webhook)
 */
export async function sendLineBookingNotification(payload: BookingNotificationPayload): Promise<boolean> {
  const lineToken = process.env.LINE_NOTIFY_TOKEN;

  const dateStr = payload.startTime.toLocaleDateString('th-TH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const timeStr = `${payload.startTime.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
  })} - ${payload.endTime.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
  })} น.`;

  const message = `
🔔 [จองห้องประชุมสำเร็จ]
─────────────────
🏢 ห้อง: ${payload.roomName} (${payload.roomCode})
📝 หัวข้อ: ${payload.title}
📅 วันที่: ${dateStr}
⏰ เวลา: ${timeStr}
👤 ผู้จอง: ${payload.userName}
🔖 รหัสการจอง: ${payload.bookingCode}
─────────────────
ดูรายละเอียด: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/
`.trim();

  if (!lineToken) {
    console.log('[LINE Notify Mock] LINE_NOTIFY_TOKEN ไม่ได้ถูกตั้งค่า ข้ามการส่งจริง ข้อความ:', message);
    return true;
  }

  try {
    const res = await fetch('https://notify-api.line.me/api/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Bearer ${lineToken}`,
      },
      body: new URLSearchParams({ message }).toString(),
    });

    return res.ok;
  } catch (error) {
    console.error('Error sending LINE Notification:', error);
    return false;
  }
}

// -----------------------------------------------------------------------------
// 2. Email Notifications (HTML Email Template & Calendar Add Link)
// -----------------------------------------------------------------------------

function generateGoogleCalendarUrl(payload: BookingNotificationPayload): string {
  const formatGCalDate = (d: Date) =>
    d.toISOString().replace(/-|:|\.\d\d\d/g, '');

  const start = formatGCalDate(payload.startTime);
  const end = formatGCalDate(payload.endTime);
  const title = encodeURIComponent(`ประชุม: ${payload.title}`);
  const details = encodeURIComponent(
    `รหัสการจอง: ${payload.bookingCode}\nห้อง: ${payload.roomName}\nผู้จัด: ${payload.userName}`
  );
  const location = encodeURIComponent(payload.roomName);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
}

export function generateBookingEmailHTML(payload: BookingNotificationPayload): string {
  const dateStr = payload.startTime.toLocaleDateString('th-TH', {
    dateStyle: 'full',
  });
  const timeStr = `${payload.startTime.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
  })} - ${payload.endTime.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
  })} น.`;
  const gcalUrl = generateGoogleCalendarUrl(payload);

  return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #2563eb, #4f46e5); color: #ffffff; padding: 28px; text-align: center; }
    .content { padding: 28px; }
    .info-box { background: #f1f5f9; border-radius: 12px; padding: 18px; margin: 20px 0; }
    .row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
    .btn { display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; margin-top: 10px; }
    .footer { text-align: center; font-size: 12px; color: #94a3b8; padding: 18px; border-top: 1px solid #f1f5f9; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h2 style="margin:0 0 6px 0; font-size:22px;">จองห้องประชุมสำเร็จ ✅</h2>
      <p style="margin:0; opacity:0.9; font-size:13px;">ระบบจองห้องประชุมระดับองค์กร (Meeting Room Booking)</p>
    </div>
    <div class="content">
      <p>เรียนคุณ <strong>${payload.userName}</strong>,</p>
      <p>รายการจองห้องประชุมของคุณได้รับการยืนยันเรียบร้อยแล้ว โดยมีรายละเอียดดังต่อไปนี้:</p>
      
      <div class="info-box">
        <div class="row"><strong>รหัสการจอง:</strong> <span>${payload.bookingCode}</span></div>
        <div class="row"><strong>หัวข้อการประชุม:</strong> <span>${payload.title}</span></div>
        <div class="row"><strong>ห้องประชุม:</strong> <span>${payload.roomName} (${payload.roomCode})</span></div>
        <div class="row"><strong>วันที่:</strong> <span>${dateStr}</span></div>
        <div class="row"><strong>เวลา:</strong> <span>${timeStr}</span></div>
      </div>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${gcalUrl}" target="_blank" class="btn">📅 เพิ่มลงใน Google Calendar</a>
      </div>

      <p style="font-size: 13px; color: #64748b;">
        * หากต้องการยกเลิกหรือเปลี่ยนแปลงเวลา กรุณาเข้าสู่ระบบก่อนเวลาเริ่มประชุมอย่างน้อย 15 นาที
      </p>
    </div>
    <div class="footer">
      อีเมลนี้เป็นข้อความอัตโนมัติจากระบบ กรุณาอย่าตอบกลับ
    </div>
  </div>
</body>
</html>
`.trim();
}

/**
 * ส่งอีเมลยืนยันการจองห้องประชุม (จำลองหรือใช้ Resend/Nodemailer)
 */
export async function sendBookingEmail(payload: BookingNotificationPayload): Promise<boolean> {
  const htmlContent = generateBookingEmailHTML(payload);
  const recipients = [payload.userEmail, ...(payload.attendeeEmails || [])].filter(Boolean);

  console.log(`[Email Dispatcher] กำลังส่งอีเมลแจ้งเตือนไปยัง ${recipients.length} ผู้รับ: ${recipients.join(', ')}`);
  console.log(`[Email Subject] ยืนยันการจองห้อง: ${payload.roomName} (${payload.title})`);

  // ตัวอย่างการเชื่อมต่อกับ Resend API หากมี RESEND_API_KEY
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'Meeting Room <no-reply@company.com>',
          to: recipients,
          subject: `[ยืนยันการจอง] ${payload.title} - ${payload.roomName}`,
          html: htmlContent,
        }),
      });
      return res.ok;
    } catch (err) {
      console.error('Error dispatching email via Resend:', err);
      return false;
    }
  }

  // หากไม่มี API KEY ใน dev mode ให้ส่ง mock success
  return true;
}
