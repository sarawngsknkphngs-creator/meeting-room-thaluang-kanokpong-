'use client';

import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, Users, Trash2, Loader2, AlertTriangle } from 'lucide-react';

interface BookingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancelled: () => void;
  event: any | null;
}

export const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
  isOpen,
  onClose,
  onCancelled,
  event,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !event) return null;

  const props = event.extendedProps || {};
  const startDate = new Date(event.start);
  const endDate = new Date(event.end);

  const handleCancelBooking = async () => {
    try {
      setIsDeleting(true);
      setError(null);

      const res = await fetch(`/api/bookings/${event.id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': props.userId || 'usr-current-user-001',
          'x-user-role': 'ADMIN', // เพื่อความสะดวกในการทดสอบ
        },
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'ไม่สามารถยกเลิกการจองได้');
      }

      onCancelled();
      onClose();
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการยกเลิก');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
          <div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
              {props.bookingCode || 'BOOKING'}
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-1">{event.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 flex items-center gap-1 mb-1">
                <MapPin className="w-3.5 h-3.5" /> ห้องประชุม
              </span>
              <p className="font-semibold text-slate-800 text-sm">{props.roomName || 'ห้องประชุม'}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 flex items-center gap-1 mb-1">
                <Users className="w-3.5 h-3.5" /> ผู้จอง
              </span>
              <p className="font-semibold text-slate-800 text-sm">{props.userName || 'พนักงาน'}</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-slate-700 font-medium">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              {startDate.toLocaleDateString('th-TH', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
            <div className="flex items-center gap-1.5 text-slate-500">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {startDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} -{' '}
              {endDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
            </div>
          </div>

          {/* Cancellation Confirmation Box */}
          {showConfirm ? (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-2">
              <div className="flex items-center gap-2 text-amber-800 font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                ยืนยันที่จะยกเลิกการจองนี้ใช่หรือไม่?
              </div>
              <p className="text-amber-700">
                เมื่อยกเลิกแล้ว ห้องจะว่างและเปิดให้ผู้อื่นสามารถจองได้ทันที
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleCancelBooking}
                  disabled={isDeleting}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium flex items-center gap-1"
                >
                  {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  ยืนยันยกเลิก
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
                >
                  ย้อนกลับ
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          {!showConfirm && (
            <button
              onClick={() => setShowConfirm(true)}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> ยกเลิกการจองนี้
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-auto px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailModal;
