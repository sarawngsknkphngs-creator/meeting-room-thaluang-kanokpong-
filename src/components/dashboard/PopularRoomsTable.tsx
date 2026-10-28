'use client';

import React from 'react';
import { Award, Users, Clock, ArrowUpRight } from 'lucide-react';

interface RoomStat {
  roomId: string;
  roomName: string;
  roomCode: string;
  capacity: number;
  bookingCount: number;
  totalHours: number;
  utilizationPercent: number;
}

interface PopularRoomsTableProps {
  rooms: RoomStat[];
}

export const PopularRoomsTable: React.FC<PopularRoomsTableProps> = ({ rooms }) => {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            อันดับห้องประชุมยอดนิยม (Popular Rooms Ranking)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            เรียงตามจำนวนชั่วโมงและอัตราการใช้งานสูงสุด
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
              <th className="pb-3 pl-2">อันดับ</th>
              <th className="pb-3">ห้องประชุม</th>
              <th className="pb-3">ความจุ</th>
              <th className="pb-3">จำนวนครั้งที่จอง</th>
              <th className="pb-3">ชั่วโมงรวม</th>
              <th className="pb-3 pr-2">อัตราการใช้งาน (Utilization)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {rooms.map((room, idx) => (
              <tr key={room.roomId} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3.5 pl-2">
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      idx === 0
                        ? 'bg-amber-100 text-amber-800'
                        : idx === 1
                        ? 'bg-slate-200 text-slate-700'
                        : idx === 2
                        ? 'bg-orange-100 text-orange-800'
                        : 'text-slate-400'
                    }`}
                  >
                    {idx + 1}
                  </span>
                </td>
                <td className="py-3.5">
                  <div className="font-semibold text-slate-800">{room.roomName}</div>
                  <div className="text-[11px] text-slate-400">{room.roomCode}</div>
                </td>
                <td className="py-3.5 text-slate-600">
                  <span className="inline-flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    {room.capacity} ที่นั่ง
                  </span>
                </td>
                <td className="py-3.5 text-slate-700">{room.bookingCount} ครั้ง</td>
                <td className="py-3.5 text-slate-900 font-bold">{room.totalHours} ชม.</td>
                <td className="py-3.5 pr-2">
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${
                          room.utilizationPercent > 70
                            ? 'bg-emerald-500'
                            : room.utilizationPercent > 40
                            ? 'bg-blue-500'
                            : 'bg-slate-400'
                        }`}
                        style={{ width: `${room.utilizationPercent}%` }}
                      ></div>
                    </div>
                    <span className="font-bold text-slate-800">{room.utilizationPercent}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PopularRoomsTable;
