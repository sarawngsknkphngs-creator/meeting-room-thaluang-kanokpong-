'use client';

import React, { useState } from 'react';
import { BarChart3, Info } from 'lucide-react';

interface RoomStat {
  roomId: string;
  roomName: string;
  roomCode: string;
  capacity: number;
  bookingCount: number;
  totalHours: number;
  utilizationPercent: number;
}

interface RoomUsageBarChartProps {
  data: RoomStat[];
}

export const RoomUsageBarChart: React.FC<RoomUsageBarChartProps> = ({ data }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const maxHours = Math.max(...data.map((d) => d.totalHours), 10);

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            สถิติการใช้งานแยกตามรายห้อง (Meeting Room Usage)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            เปรียบเทียบชั่วโมงการใช้งานและอัตราความหนาแน่นประจำเดือน
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
          หน่วย: ชั่วโมง
        </span>
      </div>

      {/* Bar Chart Grid */}
      <div className="space-y-4">
        {data.map((room, idx) => {
          const percentage = Math.round((room.totalHours / maxHours) * 100);
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={room.roomId}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="group cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                    {room.roomName}
                  </span>
                  <span className="text-[11px] text-slate-400">({room.roomCode})</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 font-medium">{room.bookingCount} ครั้ง</span>
                  <span className="font-bold text-slate-900 w-16 text-right">
                    {room.totalHours} ชม.
                  </span>
                </div>
              </div>

              {/* Progress Track & Bar */}
              <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isHovered
                      ? 'bg-blue-600 shadow-sm'
                      : idx === 0
                      ? 'bg-blue-500'
                      : idx === 1
                      ? 'bg-indigo-500'
                      : idx === 2
                      ? 'bg-emerald-500'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>

              {/* Detail tooltip row */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                <span>ความจุ: {room.capacity} ที่นั่ง</span>
                <span className="font-medium text-slate-600">
                  Utilization: {room.utilizationPercent}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-blue-500" />
          ห้องที่ถูกใช้งานมากที่สุดคือ <strong>{data[0]?.roomName || '-'}</strong>
        </span>
        <span className="text-slate-400 text-[11px]">คิดจากฐาน 8 ชม./วัน</span>
      </div>
    </div>
  );
};

export default RoomUsageBarChart;
