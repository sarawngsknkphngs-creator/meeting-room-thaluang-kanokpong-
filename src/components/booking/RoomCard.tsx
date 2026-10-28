'use client';

import React from 'react';
import { RoomItem } from '@/types/room';
import RoomStatusBadge from './RoomStatusBadge';
import { Users, MapPin, Tv, Video, Wifi, Presentation, CalendarPlus, Clock } from 'lucide-react';

interface RoomCardProps {
  room: RoomItem;
  onBookRoom: (room: RoomItem) => void;
  onViewSchedule: (room: RoomItem) => void;
}

// Map icon amenities
const renderAmenityIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('projector') || lower.includes('โปรเจกเตอร์')) {
    return <Presentation className="w-3.5 h-3.5 text-blue-500" />;
  }
  if (lower.includes('video') || lower.includes('กล้อง')) {
    return <Video className="w-3.5 h-3.5 text-purple-500" />;
  }
  if (lower.includes('wifi') || lower.includes('เน็ต')) {
    return <Wifi className="w-3.5 h-3.5 text-emerald-500" />;
  }
  return <Tv className="w-3.5 h-3.5 text-slate-500" />;
};

export const RoomCard: React.FC<RoomCardProps> = ({
  room,
  onBookRoom,
  onViewSchedule,
}) => {
  const isOccupied = room.isCurrentlyOccupied ?? false;
  const isAvailableForBooking = room.status === 'AVAILABLE';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group">
      {/* Header Info */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                {room.roomCode}
              </span>
              <h3 className="font-semibold text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
                {room.name}
              </h3>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {room.floor ? `ชั้น ${room.floor} • ` : ''}
              {room.location || 'อาคารหลัก'}
            </p>
          </div>

          {/* Real-time Status Indicator */}
          <RoomStatusBadge status={room.status} isOccupiedNow={isOccupied} />
        </div>

        {/* Room Capacity & Description */}
        <div className="flex items-center gap-4 text-xs text-slate-600 mb-4 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
          <div className="flex items-center gap-1.5 font-medium">
            <Users className="w-4 h-4 text-slate-500" />
            ความจุ {room.capacity} ที่นั่ง
          </div>
          {room.description && (
            <span className="truncate text-slate-400 text-xs" title={room.description}>
              {room.description}
            </span>
          )}
        </div>

        {/* Current Meeting Notice if Occupied */}
        {isOccupied && room.currentMeeting && (
          <div className="mb-4 p-2.5 bg-rose-50/80 border border-rose-200/60 rounded-xl text-xs text-rose-800">
            <div className="flex items-center gap-1 font-semibold mb-0.5">
              <Clock className="w-3.5 h-3.5" /> กำลังใช้งาน: {room.currentMeeting.title}
            </div>
            <div className="text-rose-600">
              โดย {room.currentMeeting.userName} (สิ้นสุดเวลา{' '}
              {new Date(room.currentMeeting.endTime).toLocaleTimeString('th-TH', {
                hour: '2-digit',
                minute: '2-digit',
              })}
              )
            </div>
          </div>
        )}

        {/* Amenities Chips */}
        <div>
          <span className="text-xs font-medium text-slate-400 block mb-1.5">อุปกรณ์ประจำห้อง:</span>
          <div className="flex flex-wrap gap-1.5">
            {room.amenities && room.amenities.length > 0 ? (
              room.amenities.map((item, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/50"
                >
                  {renderAmenityIcon(item.amenity.name)}
                  {item.amenity.name}
                  {item.quantity > 1 && (
                    <span className="text-slate-400 font-normal">x{item.quantity}</span>
                  )}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400 italic">ไม่มีอุปกรณ์พิเศษ</span>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="px-5 py-3 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between gap-2">
        <button
          onClick={() => onViewSchedule(room)}
          className="text-xs text-slate-600 hover:text-blue-600 font-medium px-3 py-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
        >
          ดูตารางห้อง
        </button>

        <button
          onClick={() => onBookRoom(room)}
          disabled={!isAvailableForBooking}
          className={`inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-lg shadow-sm transition-all ${
            isAvailableForBooking
              ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <CalendarPlus className="w-3.5 h-3.5" />
          จองห้องนี้
        </button>
      </div>
    </div>
  );
};

export default RoomCard;
