'use client';

import React from 'react';
import { TrendingUp, Clock } from 'lucide-react';

interface DailyTrend {
  date: string;
  dayName: string;
  bookings: number;
  hours: number;
}

interface HourlyDistribution {
  hour: string;
  bookings: number;
}

interface DailyUsageTrendChartProps {
  dailyTrends: DailyTrend[];
  hourlyDistribution: HourlyDistribution[];
}

export const DailyUsageTrendChart: React.FC<DailyUsageTrendChartProps> = ({
  dailyTrends,
  hourlyDistribution,
}) => {
  const maxHourlyBooking = Math.max(...hourlyDistribution.map((h) => h.bookings), 1);

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              ความหนาแน่นตามช่วงเวลา (Peak Hours Distribution)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              จำนวนครั้งการจองแยกตามช่วงชั่วโมงของวัน (08:00 - 18:00)
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
            ยอดฮิต: 10:00 & 14:00
          </span>
        </div>

        {/* Hourly Vertical Bars Visual */}
        <div className="h-44 flex items-end justify-between gap-1.5 sm:gap-2 pt-6 pb-2 border-b border-slate-100">
          {hourlyDistribution.map((item, idx) => {
            const heightPercent = Math.max(12, Math.round((item.bookings / maxHourlyBooking) * 100));
            const isPeak = item.bookings === maxHourlyBooking;

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                <span className="text-[10px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.bookings}
                </span>
                <div className="w-full bg-slate-100 rounded-t-lg h-32 flex items-end overflow-hidden">
                  <div
                    className={`w-full rounded-t-lg transition-all duration-300 group-hover:brightness-110 ${
                      isPeak
                        ? 'bg-gradient-to-t from-amber-500 to-amber-400 shadow-xs'
                        : 'bg-gradient-to-t from-indigo-600 to-indigo-400'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  ></div>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  {item.hour.slice(0, 2)}h
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7-Day Trend Quick Summary */}
      <div className="mt-5 pt-3">
        <span className="text-xs font-semibold text-slate-700 block mb-2">
          แนวโน้มการจอง 7 วันล่าสุด:
        </span>
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {dailyTrends.map((d, i) => (
            <div key={i} className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 block">{d.dayName}</span>
              <span className="text-xs font-bold text-slate-800">{d.bookings} ครั้ง</span>
              <span className="text-[10px] text-indigo-600 block">{d.hours} ชม.</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DailyUsageTrendChart;
