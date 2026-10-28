import { EventEmitter } from 'events';
import { RealtimeEventType, RealtimeMessage } from '@/types/booking';

/**
 * RealtimeBroadcaster: จัดการการกระจาย Event แบบ Real-time ไปยังไคลเอนต์
 * รองรับทั้ง Server-Sent Events (SSE) และ WebSocket Subscribers
 */
class RealtimeBroadcaster extends EventEmitter {
  private static instance: RealtimeBroadcaster;

  private constructor() {
    super();
    // เพิ่ม max listeners เพื่อรองรับ concurrent clients
    this.setMaxListeners(200);
  }

  public static getInstance(): RealtimeBroadcaster {
    if (!RealtimeBroadcaster.instance) {
      RealtimeBroadcaster.instance = new RealtimeBroadcaster();
    }
    return RealtimeBroadcaster.instance;
  }

  /**
   * Broadcast ข้อความไปยัง Subscriber ทุกคนที่กำลังเชื่อมต่อ
   */
  public broadcast<T>(type: RealtimeEventType, payload: T): void {
    const message: RealtimeMessage<T> = {
      type,
      timestamp: new Date().toISOString(),
      payload,
    };

    // ส่ง event ให้ subscriber ทั้งระบบ
    this.emit('broadcast', message);

    // หรือส่งเฉพาะ channel ประเภทนั้นๆ
    this.emit(`channel:${type}`, message);
  }

  /**
   * สร้าง ReadableStream สำหรับ Server-Sent Events (SSE) ใน Next.js Route Handlers
   */
  public createSSEStream(reqSignal?: AbortSignal): ReadableStream {
    const encoder = new TextEncoder();
    let listener: ((message: RealtimeMessage) => void) | null = null;
    let heartbeatTimer: NodeJS.Timeout | null = null;

    return new ReadableStream({
      start: (controller) => {
        // ส่ง Header เริ่มต้นแจ้งสถานะเชื่อมต่อ
        controller.enqueue(encoder.encode(`event: connected\ndata: ${JSON.stringify({ status: 'connected' })}\n\n`));

        // Listener รับ event และ stream ข้อมูลออกไป
        listener = (message: RealtimeMessage) => {
          try {
            const data = `event: ${message.type}\ndata: ${JSON.stringify(message)}\n\n`;
            controller.enqueue(encoder.encode(data));
          } catch {
            // Controller อาจปิดไปแล้ว
          }
        };

        this.on('broadcast', listener);

        // Heartbeat ทุกๆ 25 วินาที เพื่อไม่ให้ connection หลุด (Proxy / Cloudflare Timeout)
        heartbeatTimer = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(`: heartbeat\n\n`));
          } catch {
            if (heartbeatTimer) clearInterval(heartbeatTimer);
          }
        }, 25000);

        // จัดการเมื่อ Client disconnect
        if (reqSignal) {
          reqSignal.addEventListener('abort', () => {
            if (listener) this.off('broadcast', listener);
            if (heartbeatTimer) clearInterval(heartbeatTimer);
            try {
              controller.close();
            } catch {
              // ignore
            }
          });
        }
      },
      cancel: () => {
        if (listener) this.off('broadcast', listener);
        if (heartbeatTimer) clearInterval(heartbeatTimer);
      },
    });
  }
}

export const realtimeBroadcaster = RealtimeBroadcaster.getInstance();
export default realtimeBroadcaster;
