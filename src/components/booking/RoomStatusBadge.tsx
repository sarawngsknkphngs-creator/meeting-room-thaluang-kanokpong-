import React from 'react';

interface RoomStatusBadgeProps {
  status: 'AVAILABLE' | 'MAINTENANCE' | 'INACTIVE';
  isOccupiedNow?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const RoomStatusBadge: React.FC<RoomStatusBadgeProps> = ({
  status,
  isOccupiedNow = false,
  size = 'md',
}) => {
  let badgeColor = '';
  let dotColor = '';
  let label = '';

  if (status === 'MAINTENANCE') {
    badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
    dotColor = 'bg-amber-500 animate-pulse';
    label = 'กำลังปรับปรุง';
  } else if (status === 'INACTIVE') {
    badgeColor = 'bg-slate-100 text-slate-600 border-slate-200';
    dotColor = 'bg-slate-400';
    label = 'ปิดใช้งาน';
  } else if (isOccupiedNow) {
    // กำลังมีประชุมอยู่ ณ ปัจจุบัน
    badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
    dotColor = 'bg-rose-500 animate-ping';
    label = 'กำลังใช้งานอยู่ (ไม่ว่าง)';
  } else {
    // ว่างพร้อมใช้งาน
    badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    dotColor = 'bg-emerald-500';
    label = 'ว่างพร้อมใช้งาน';
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-medium',
    lg: 'px-3 py-1.5 text-sm font-medium',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border shadow-sm ${badgeColor} ${sizeClasses[size]}`}
    >
      <span className="relative flex h-2 w-2">
        {isOccupiedNow && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`}></span>
      </span>
      {label}
    </span>
  );
};

export default RoomStatusBadge;
