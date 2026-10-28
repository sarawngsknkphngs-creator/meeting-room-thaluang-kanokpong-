'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { StatCards } from '@/components/dashboard/StatCards';
import { RoomUsageBarChart } from '@/components/dashboard/RoomUsageBarChart';
import { DailyUsageTrendChart } from '@/components/dashboard/DailyUsageTrendChart';
import { PopularRoomsTable } from '@/components/dashboard/PopularRoomsTable';
import { ExportReportButton } from '@/components/dashboard/ExportReportModal';
import { NotificationBell } from '@/components/notification/NotificationBell';
import { AnalyticsSummary } from '@/lib/analytics-service';
import {
  BarChart2,
  Calendar,
  Building2,
  RefreshCw,
  ArrowLeft,
  CalendarDays,
} from 'lucide-react';

export default function DashboardPage() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/analytics?year=${selectedYear}&month=${selectedMonth}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedMonth, selectedYear]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
              title="กลับหน้าปฏิทิน"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                แดชบอร์ดและรายงานสถิติ
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60 hidden sm:inline-block">
                  Analytics & Reports
                </span>
              </h1>
              <p className="text-xs text-slate-400">ภาพรวมการใช้งานห้องประชุมและอัตราความหนาแน่น</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Link to Calendar */}
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
            >
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>หน้าปฏิทินการจอง</span>
            </Link>

            {/* Export CSV Button */}
            <ExportReportButton />

            {/* Notification Bell */}
            <NotificationBell />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 space-y-6">
        {/* Filter & Refresh Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <CalendarDays className="w-4 h-4 text-slate-400" />
            <span>ช่วงเวลาที่ต้องการดูสถิติ:</span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {[
                'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
              ].map((m, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
            </select>

            <button
              onClick={fetchAnalytics}
              disabled={isLoading}
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200/60"
              title="รีเฟรชข้อมูลสถิติ"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 1. Stat Cards */}
        {data && <StatCards metrics={data.metrics} />}

        {/* 2. Charts Row */}
        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RoomUsageBarChart data={data.roomStats} />
            <DailyUsageTrendChart
              dailyTrends={data.dailyTrends}
              hourlyDistribution={data.hourlyDistribution}
            />
          </div>
        )}

        {/* 3. Popular Rooms Ranking Table */}
        {data && <PopularRoomsTable rooms={data.roomStats} />}
      </main>
    </div>
  );
}
