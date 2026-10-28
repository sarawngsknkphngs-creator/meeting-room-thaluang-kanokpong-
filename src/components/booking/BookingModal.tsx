'use client';

import React, { useState, useEffect, useId } from 'react';
import { RoomItem } from '@/types/room';
import {
  X,
  Calendar,
  Clock,
  Users,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Plus,
  Trash2,
  Sparkles,
} from 'lucide-react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  rooms: RoomItem[];
  preSelectedRoomId?: string;
  initialStartTime?: string;
  initialEndTime?: string;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  rooms,
  preSelectedRoomId,
  initialStartTime,
  initialEndTime,
}) => {
  const formId = useId();

  // Form States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState(preSelectedRoomId || '');
  const [date, setDate] = useState(() => {
    if (initialStartTime) return initialStartTime.slice(0, 10);
    return new Date().toISOString().slice(0, 10);
  });
  const [startTime, setStartTime] = useState(() => {
    if (initialStartTime) return initialStartTime.slice(11, 16);
    return '09:00';
  });
  const [endTime, setEndTime] = useState(() => {
    if (initialEndTime) return initialEndTime.slice(11, 16);
    return '10:00';
  });
  const [attendeeCount, setAttendeeCount] = useState(2);

  // Attendees List
  const [attendees, setAttendees] = useState<{ email: string; name: string }[]>([]);
  const [newAttendeeEmail, setNewAttendeeEmail] = useState('');
  const [newAttendeeName, setNewAttendeeName] = useState('');

  // Selected Amenities
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    'Projector',
    'Video Conference',
  ]);

  // Conflict Checking States
  const [isCheckingConflict, setIsCheckingConflict] = useState(false);
  const [conflictResult, setConflictResult] = useState<{
    isAvailable: boolean;
    reason?: string;
    conflicts?: any[];
  } | null>(null);

  // Submission States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Sync props when modal opens or preselected values change
  useEffect(() => {
    if (isOpen) {
      if (preSelectedRoomId) setSelectedRoomId(preSelectedRoomId);
      if (initialStartTime) {
        setDate(initialStartTime.slice(0, 10));
        setStartTime(initialStartTime.slice(11, 16));
      }
      if (initialEndTime) {
        setEndTime(initialEndTime.slice(11, 16));
      }
      setFormError(null);
    }
  }, [isOpen, preSelectedRoomId, initialStartTime, initialEndTime]);

  // Selected Room Object
  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  // Debounced Conflict Check whenever Room or Time changes
  useEffect(() => {
    if (!selectedRoomId || !date || !startTime || !endTime) {
      setConflictResult(null);
      return;
    }

    const startISO = `${date}T${startTime}:00`;
    const endISO = `${date}T${endTime}:00`;

    if (new Date(startISO) >= new Date(endISO)) {
      setConflictResult({
        isAvailable: false,
        reason: 'เวลาเริ่มต้นต้องมาก่อนเวลาสิ้นสุด',
      });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsCheckingConflict(true);
        const url = `/api/bookings/check?roomId=${encodeURIComponent(
          selectedRoomId
        )}&startTime=${encodeURIComponent(startISO)}&endTime=${encodeURIComponent(
          endISO
        )}`;
        const res = await fetch(url);
        const json = await res.json();

        if (json.success) {
          setConflictResult(json.data);
        } else {
          setConflictResult({
            isAvailable: false,
            reason: json.error || 'ตรวจสอบห้องว่างไม่สำเร็จ',
          });
        }
      } catch (err: any) {
        setConflictResult({
          isAvailable: false,
          reason: 'ไม่สามารถติดต่อเซิร์ฟเวอร์เพื่อเช็กห้องว่างได้',
        });
      } finally {
        setIsCheckingConflict(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [selectedRoomId, date, startTime, endTime]);

  // Handle Add Attendee
  const handleAddAttendee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttendeeEmail || !newAttendeeEmail.includes('@')) {
      alert('กรุณากรอกอีเมลที่ถูกต้อง');
      return;
    }
    if (attendees.some((a) => a.email.toLowerCase() === newAttendeeEmail.toLowerCase())) {
      alert('อีเมลนี้ถูกเพิ่มไปแล้ว');
      return;
    }

    setAttendees([...attendees, { email: newAttendeeEmail, name: newAttendeeName || newAttendeeEmail.split('@')[0] }]);
    setNewAttendeeEmail('');
    setNewAttendeeName('');
  };

  const handleRemoveAttendee = (email: string) => {
    setAttendees(attendees.filter((a) => a.email !== email));
  };

  const toggleAmenity = (name: string) => {
    if (selectedAmenities.includes(name)) {
      setSelectedAmenities(selectedAmenities.filter((a) => a !== name));
    } else {
      setSelectedAmenities([...selectedAmenities, name]);
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('กรุณากรอกชื่อการประชุม');
      return;
    }
    if (!selectedRoomId) {
      setFormError('กรุณาเลือกห้องประชุม');
      return;
    }
    if (conflictResult && !conflictResult.isAvailable) {
      setFormError(conflictResult.reason || 'ห้องประชุมไม่ว่างในช่วงเวลาดังกล่าว');
      return;
    }

    const startISO = `${date}T${startTime}:00`;
    const endISO = `${date}T${endTime}:00`;

    try {
      setIsSubmitting(true);

      // Demo User ID (In production, retrieved from NextAuth session)
      const mockUserId = 'usr-current-user-001';

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: `${description}\nอุปกรณ์ที่ขอ: ${selectedAmenities.join(', ')}`,
          roomId: selectedRoomId,
          userId: mockUserId,
          startTime: startISO,
          endTime: endISO,
          attendeeCount: Math.max(attendeeCount, attendees.length + 1),
          attendees: attendees.map((a) => ({
            email: a.email,
            name: a.name,
            isInternal: true,
          })),
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'ไม่สามารถทำการจองได้');
      }

      // Success
      onSuccess();
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'เกิดข้อผิดพลาดในการบันทึกการจอง');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              จองห้องประชุมใหม่
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ระบบจะตรวจสอบความพร้อมของห้องแบบเรียลไทม์เพื่อป้องกันการจองซ้ำ
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {formError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>{formError}</div>
            </div>
          )}

          {/* 1. Meeting Title */}
          <div>
            <label htmlFor={`${formId}-title`} className="block text-xs font-semibold text-slate-700 mb-1.5">
              หัวข้อการประชุม <span className="text-rose-500">*</span>
            </label>
            <input
              id={`${formId}-title`}
              type="text"
              required
              placeholder="เช่น ประชุมวางแผน Sprint 4, สัมภาษณ์พนักงานใหม่"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* 2. Room Selection */}
          <div>
            <label htmlFor={`${formId}-room`} className="block text-xs font-semibold text-slate-700 mb-1.5">
              เลือกห้องประชุม <span className="text-rose-500">*</span>
            </label>
            <select
              id={`${formId}-room`}
              required
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            >
              <option value="">-- กรุณาเลือกห้องประชุม --</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id} disabled={room.status !== 'AVAILABLE'}>
                  {room.name} ({room.roomCode}) - ความจุ {room.capacity} ที่นั่ง{' '}
                  {room.status !== 'AVAILABLE' ? `[${room.status}]` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Date & Time Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor={`${formId}-date`} className="block text-xs font-semibold text-slate-700 mb-1.5">
                วันที่ประชุม
              </label>
              <div className="relative">
                <input
                  id={`${formId}-date`}
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor={`${formId}-start-time`} className="block text-xs font-semibold text-slate-700 mb-1.5">
                เวลาเริ่มต้น
              </label>
              <div className="relative">
                <input
                  id={`${formId}-start-time`}
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor={`${formId}-end-time`} className="block text-xs font-semibold text-slate-700 mb-1.5">
                เวลาสิ้นสุด
              </label>
              <div className="relative">
                <input
                  id={`${formId}-end-time`}
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Quick Duration Buttons for Long Booking */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[11px] text-slate-400 font-medium">จองยาวด่วน:</span>
            <button
              type="button"
              onClick={() => {
                const [h, m] = startTime.split(':').map(Number);
                const endH = Math.min(20, h + 1);
                setEndTime(`${endH.toString().padStart(2, '0')}:${(m || 0).toString().padStart(2, '0')}`);
              }}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 transition"
            >
              +1 ชม.
            </button>
            <button
              type="button"
              onClick={() => {
                const [h, m] = startTime.split(':').map(Number);
                const endH = Math.min(20, h + 2);
                setEndTime(`${endH.toString().padStart(2, '0')}:${(m || 0).toString().padStart(2, '0')}`);
              }}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 transition"
            >
              +2 ชม.
            </button>
            <button
              type="button"
              onClick={() => {
                const [h, m] = startTime.split(':').map(Number);
                const endH = Math.min(20, h + 4);
                setEndTime(`${endH.toString().padStart(2, '0')}:${(m || 0).toString().padStart(2, '0')}`);
              }}
              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-semibold transition"
            >
              +4 ชม. (ครึ่งวัน)
            </button>
            <button
              type="button"
              onClick={() => {
                setStartTime('09:00');
                setEndTime('17:00');
              }}
              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-semibold transition"
            >
              +8 ชม. (ทั้งวัน 09:00 - 17:00)
            </button>
          </div>

          {/* REAL-TIME CONFLICT CHECK BANNER */}
          {selectedRoomId && (
            <div className="transition-all duration-300">
              {isCheckingConflict ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-xs flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  กำลังตรวจสอบความพร้อมของห้องแบบเรียลไทม์...
                </div>
              ) : conflictResult?.isAvailable ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ห้องว่าง สามารถจองช่วงเวลานี้ได้ทันที
                  </span>
                  <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    พร้อมใช้งาน 🟢
                  </span>
                </div>
              ) : conflictResult?.isAvailable === false ? (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-rose-700 mb-1">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    ห้องไม่ว่างในช่วงเวลาดังกล่าว!
                  </div>
                  <p className="text-rose-600">{conflictResult.reason}</p>
                  {conflictResult.conflicts && conflictResult.conflicts.length > 0 && (
                    <div className="mt-2 text-[11px] text-rose-700 bg-rose-100/60 p-2 rounded-lg">
                      รายการที่ทับซ้อน: {conflictResult.conflicts[0].title} (
                      {new Date(conflictResult.conflicts[0].startTime).toLocaleTimeString('th-TH', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      -{' '}
                      {new Date(conflictResult.conflicts[0].endTime).toLocaleTimeString('th-TH', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      )
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* 4. Equipment & Amenities Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              อุปกรณ์เสริมและสิ่งอำนวยความสะดวกที่ต้องการ
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                'Projector & Screen',
                'Video Conference (Zoom/Teams)',
                'Whiteboard & ปากกาเคมี',
                'Microphone & ลำโพง',
                'High-Speed Wi-Fi',
                'บริการน้ำดื่ม/ของว่าง',
              ].map((amenity) => {
                const isSelected = selectedAmenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                      isSelected
                        ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {amenity}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Attendee Management */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                รายชื่อผู้เข้าร่วมประชุม (Attendees)
              </label>
              <span className="text-xs text-slate-500">
                รวมทั้งหมด: {attendees.length + 1} คน{' '}
                {selectedRoom && selectedRoom.capacity < attendees.length + 1 && (
                  <span className="text-rose-500 font-bold">(เกินความจุห้อง {selectedRoom.capacity} คน!)</span>
                )}
              </span>
            </div>

            {/* Add Attendee Input */}
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                placeholder="ชื่อผู้เข้าร่วม"
                value={newAttendeeName}
                onChange={(e) => setNewAttendeeName(e.target.value)}
                className="w-1/3 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <input
                type="email"
                placeholder="email@company.com"
                value={newAttendeeEmail}
                onChange={(e) => setNewAttendeeEmail(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                type="button"
                onClick={handleAddAttendee}
                className="px-3 py-2 text-xs font-medium rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> เพิ่ม
              </button>
            </div>

            {/* Attendee Badges List */}
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1">
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/50">
                👤 คุณ (ผู้จัดการประชุม)
              </span>
              {attendees.map((attendee) => (
                <span
                  key={attendee.email}
                  className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200"
                >
                  <span>{attendee.name}</span>
                  <span className="text-[10px] text-slate-400">({attendee.email})</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttendee(attendee.email)}
                    className="text-slate-400 hover:text-rose-500 ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> แจ้งเตือนทาง In-App & Email อัตโนมัติ
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-xl border border-slate-200 text-slate-600 hover:bg-white transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || (conflictResult ? !conflictResult.isAvailable : false)}
              className={`px-5 py-2 text-xs font-semibold rounded-xl text-white shadow-sm flex items-center gap-2 transition-all ${
                isSubmitting || (conflictResult && !conflictResult.isAvailable)
                  ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
              }`}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              ยืนยันการจองห้อง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
