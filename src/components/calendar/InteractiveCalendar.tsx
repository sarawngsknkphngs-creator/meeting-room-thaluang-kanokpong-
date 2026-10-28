'use client';

import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Sparkles,
  Calendar as CalendarIcon,
} from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  extendedProps?: Record<string, any>;
}

interface InteractiveCalendarProps {
  events: CalendarEvent[];
  onSelectSlot: (date: string, startTime: string, endTime: string) => void;
  onSelectEvent: (event: CalendarEvent) => void;
  selectedRoomId?: string;
}

const HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 08:00 - 18:00

export const InteractiveCalendar: React.FC<InteractiveCalendarProps> = ({
  events,
  onSelectSlot,
  onSelectEvent,
}) => {
  // Current view anchor date (defaults to today)
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');

  // Calculate current week days (Monday to Friday or Sunday to Saturday)
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday
    startOfWeek.setDate(diff);

    return Array.from({ length: 5 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
  }, [currentDate]);

  // Navigate Prev / Next
  const handlePrev = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() - (viewMode === 'week' ? 7 : 1));
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + (viewMode === 'week' ? 7 : 1));
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Helper to format ISO Date string
  const formatDateKey = (d: Date) => d.toISOString().slice(0, 10);

  // Helper to check if event overlaps a day and hour slot (handles multi-hour bookings)
  const getEventsForSlot = (day: Date, hour: number) => {
    const dayStr = formatDateKey(day);
    const slotStart = new Date(`${dayStr}T${hour.toString().padStart(2, '0')}:00:00`);
    const slotEnd = new Date(`${dayStr}T${(hour + 1).toString().padStart(2, '0')}:00:00`);

    return events.filter((ev) => {
      const evStart = new Date(ev.start);
      const evEnd = new Date(ev.end);
      // Mathematical interval overlap condition:
      return evStart < slotEnd && evEnd > slotStart;
    });
  };

  const isToday = (d: Date) => {
    const today = new Date();
    return d.toDateString() === today.toDateString();
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
      {/* Calendar Header Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <button
              onClick={handlePrev}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
              title="ก่อนหน้า"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              วันนี้
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
              title="ถัดไป"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
            {currentDate.toLocaleDateString('th-TH', {
              month: 'long',
              year: 'numeric',
            })}
          </h2>
        </div>

        {/* View Mode Toggle & Tip */}
        <div className="flex items-center gap-3">
          <span className="hidden md:inline-flex items-center gap-1 text-xs text-slate-400 bg-white px-2.5 py-1 rounded-full border border-slate-200/60">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> คลิกที่ช่องว่างเพื่อจองเวลาที่ต้องการ
          </span>

          <div className="flex bg-slate-200/70 p-1 rounded-xl text-xs font-semibold text-slate-600">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-lg transition-all ${
                viewMode === 'week' ? 'bg-white text-blue-600 shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              รายสัปดาห์ (จ.-ศ.)
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 rounded-lg transition-all ${
                viewMode === 'day' ? 'bg-white text-blue-600 shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              รายวัน
            </button>
          </div>
        </div>
      </div>

      {/* Week Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Day Headers */}
          <div className="grid grid-cols-[80px_repeat(5,1fr)] border-b border-slate-100 bg-slate-50/70 text-xs">
            <div className="p-3 text-center text-slate-400 font-medium border-r border-slate-100 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>

            {(viewMode === 'week' ? weekDays : [currentDate]).map((day, idx) => (
              <div
                key={idx}
                className={`p-3 text-center border-r border-slate-100 last:border-r-0 ${
                  isToday(day) ? 'bg-blue-50/50' : ''
                }`}
              >
                <div className="font-medium text-slate-500 text-[11px]">
                  {day.toLocaleDateString('th-TH', { weekday: 'short' })}
                </div>
                <div
                  className={`text-sm font-bold mt-0.5 inline-flex items-center justify-center w-7 h-7 rounded-full ${
                    isToday(day) ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-800'
                  }`}
                >
                  {day.getDate()}
                </div>
              </div>
            ))}
          </div>

          {/* Time Slots Grid */}
          <div className="divide-y divide-slate-100">
            {HOURS.map((hour) => {
              const hourLabel = `${hour.toString().padStart(2, '0')}:00`;
              const nextHourLabel = `${(hour + 1).toString().padStart(2, '0')}:00`;

              return (
                <div
                  key={hour}
                  className="grid grid-cols-[80px_repeat(5,1fr)] min-h-[70px] transition-colors"
                >
                  {/* Time Axis Column */}
                  <div className="p-2 text-right pr-3 text-xs font-semibold text-slate-400 border-r border-slate-100 bg-slate-50/30 select-none">
                    {hourLabel}
                  </div>

                  {/* Day Columns */}
                  {(viewMode === 'week' ? weekDays : [currentDate]).map((day, dIdx) => {
                    const dayKey = formatDateKey(day);
                    const slotEvents = getEventsForSlot(day, hour);

                    return (
                      <div
                        key={dIdx}
                        className={`p-1.5 border-r border-slate-100 last:border-r-0 relative group hover:bg-blue-50/20 transition-colors ${
                          isToday(day) ? 'bg-blue-50/10' : ''
                        }`}
                      >
                        {/* Empty Slot Click Trigger */}
                        {slotEvents.length === 0 ? (
                          <button
                            onClick={() => onSelectSlot(dayKey, hourLabel, nextHourLabel)}
                            className="w-full h-full min-h-[56px] rounded-xl border border-dashed border-transparent group-hover:border-blue-300 group-hover:bg-blue-50/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-blue-600 text-xs font-medium gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> จองช่วงนี้
                          </button>
                        ) : (
                          <div className="space-y-1.5">
                            {slotEvents.map((ev) => {
                              const evStart = new Date(ev.start);
                              const isStartHour = evStart.getHours() === hour;

                              if (isStartHour) {
                                return (
                                  <button
                                    key={ev.id}
                                    onClick={() => onSelectEvent(ev)}
                                    className="w-full text-left p-2 rounded-xl text-xs font-semibold shadow-sm transition-all transform hover:-translate-y-0.5 hover:shadow-md cursor-pointer border"
                                    style={{
                                      backgroundColor: ev.backgroundColor || '#eff6ff',
                                      borderColor: ev.borderColor || '#bfdbfe',
                                      color: '#1e3a8a',
                                    }}
                                  >
                                    <div className="truncate font-bold">{ev.title}</div>
                                    <div className="text-[10px] opacity-80 flex items-center gap-1 mt-0.5">
                                      <Clock className="w-2.5 h-2.5" />
                                      {new Date(ev.start).toLocaleTimeString('th-TH', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}{' '}
                                      -{' '}
                                      {new Date(ev.end).toLocaleTimeString('th-TH', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </div>
                                  </button>
                                );
                              }

                              // Continuation hour for long bookings
                              return (
                                <button
                                  key={ev.id}
                                  onClick={() => onSelectEvent(ev)}
                                  className="w-full text-left p-1.5 rounded-lg text-[10px] font-medium border border-dashed border-blue-200 bg-blue-50/80 text-blue-800 transition hover:bg-blue-100 flex items-center justify-between"
                                >
                                  <span className="truncate">↳ ต่อเนื่อง: {ev.title}</span>
                                  <span className="text-blue-600 font-bold shrink-0">
                                    ถึง {new Date(ev.end).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveCalendar;
