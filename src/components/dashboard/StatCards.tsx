'use client';

import React from 'react';
import {
  CalendarCheck,
  Building2,
  Percent,
  Clock,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

interface StatCardsProps {
  metrics: {
    totalBookings: number;
    totalBookingsChangePercent: number;
    activeRoomsCount: number;
    totalRoomsCount: number;
    utilizationRateToday: number;
    totalMeetingHoursThisMonth: number;
    peakTimeSlot: string;
    cancelledBookings: number;
  };
}

export const StatCards: React.FC<StatCardsProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Bookings */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Bookings
          </span>
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <CalendarCheck className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-3xl font-extrabold text-slate-900">
            {metrics.totalBookings.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            <span className="inline-flex items-center gap-0.5 text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md">
              <TrendingUp className="w-3 h-3" /> +{metrics.totalBookingsChangePercent}%
            </span>
            <span className="text-slate-400">เทียบกับเดือนก่อน</span>
          </div>
        </div>
      </div>

      {/* 2. Active Rooms */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Active Rooms วันนี้
          </span>
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-3xl font-extrabold text-indigo-600">
            {metrics.activeRoomsCount}{' '}
            <span className="text-lg font-normal text-slate-400">/ {metrics.totalRoomsCount}</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            {Math.round((metrics.activeRoomsCount / metrics.totalRoomsCount) * 100)}% มีการใช้งานในวันนี้
          </div>
        </div>
      </div>

      {/* 3. Utilization Rate Today */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Utilization Rate วันนี้
          </span>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Percent className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-3xl font-extrabold text-emerald-600">
            {metrics.utilizationRateToday}%
          </div>
          {/* Visual Mini Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, metrics.utilizationRateToday)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 4. Peak Hours Slot */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            ช่วงเวลายอดฮิต (Peak Hour)
          </span>
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-extrabold text-amber-700">
            {metrics.peakTimeSlot}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            รวมเวลาประชุมเดือนนี้: <span className="font-semibold text-slate-700">{metrics.totalMeetingHoursThisMonth} ชม.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatCards;
