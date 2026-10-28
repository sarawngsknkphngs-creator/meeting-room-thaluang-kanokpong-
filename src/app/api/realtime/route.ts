import { NextRequest } from 'next/server';
import { realtimeBroadcaster } from '@/lib/realtime-broadcaster';

// บังคับให้ Endpoint นี้เป็น Dynamic เสมอ
export const dynamic = 'force-dynamic';

/**
 * GET /api/realtime
 * Server-Sent Events (SSE) Stream
 * ให้ไคลเอนต์ (เช่น หน้า Calendar, แดชบอร์ดห้องว่าง) สมัครรับ Event การเปลี่ยนแปลงตารางจองแบบทันที
 */
export async function GET(request: NextRequest) {
  const stream = realtimeBroadcaster.createSSEStream(request.signal);

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // สำหรับ Nginx / Reverse Proxy ไม่ให้ Buffer
    },
  });
}
