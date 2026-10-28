'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRealtimeCalendar, CalendarEvent } from '@/hooks/useRealtimeCalendar';
import { InteractiveCalendar } from '@/components/calendar/InteractiveCalendar';
import { BookingModal } from '@/components/booking/BookingModal';
import { BookingDetailModal } from '@/components/calendar/BookingDetailModal';
import { RoomCard } from '@/components/booking/RoomCard';
import { NotificationBell } from '@/components/notification/NotificationBell';
import { RoomItem } from '@/types/room';
import {
  Calendar as CalendarIcon,
  LayoutGrid,
  Plus,
  Radio,
  Building2,
  CheckCircle,
  Clock,
  Layers,
  Sparkles,
  RefreshCw,
  BarChart2,
} from 'lucide-react';

// Sample mock rooms for immediate UI demonstration
const INITIAL_ROOMS: RoomItem[] = [
  {
    id: 'room-1',
    name: 'ห้องประชุมใหญ่ ไพลิน (Pailin Grand Boardroom)',
    roomCode: 'MR-101',
    capacity: 20,
    floor: '10',
    location: 'อาคาร A ฝั่งตะวันออก',
    description: 'ห้องประชุมผู้บริหาร พร้อมระบบ Video Conference 4K และระบบแปลภาษา',
    status: 'AVAILABLE',
    amenities: [
      { amenity: { id: 'a1', name: '4K Projector' }, quantity: 1 },
      { amenity: { id: 'a2', name: 'Video Conference' }, quantity: 1 },
      { amenity: { id: 'a3', name: 'High-Speed Wi-Fi' }, quantity: 1 },
    ],
    isCurrentlyOccupied: false,
  },
  {
    id: 'room-2',
    name: 'ห้องประชุม มรกต (Emerald Meeting Room)',
    roomCode: 'MR-102',
    capacity: 10,
    floor: '10',
    location: 'อาคาร A ฝั่งตะวันตก',
    description: 'ห้องประชุมทีมขนาดกลาง พร้อม Smart TV และ ไวท์บอร์ดกระจก',
    status: 'AVAILABLE',
    amenities: [
      { amenity: { id: 'a4', name: 'Smart TV 75"' }, quantity: 1 },
      { amenity: { id: 'a5', name: 'Whiteboard' }, quantity: 2 },
    ],
    isCurrentlyOccupied: true,
    currentMeeting: {
      id: 'bk-mock-1',
      title: 'Sprint Planning Meeting',
      userName: 'กิตติศักดิ์ พ.',
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    },
  },
  {
    id: 'room-3',
    name: 'ห้องประชุม บุษราคัม (Topaz Brainstorming Hub)',
    roomCode: 'MR-103',
    capacity: 6,
    floor: '9',
    location: 'อาคาร B โซน Innovation',
    description: 'ห้องระดมสมองและประชุมย่อย โต๊ะปรับระดับยืนประชุมได้',
    status: 'AVAILABLE',
    amenities: [
      { amenity: { id: 'a2', name: 'Video Conference' }, quantity: 1 },
      { amenity: { id: 'a5', name: 'Whiteboard' }, quantity: 1 },
    ],
    isCurrentlyOccupied: false,
  },
  {
    id: 'room-4',
    name: 'ห้องประชุม ทับทิม (Ruby VIP Room)',
    roomCode: 'MR-104',
    capacity: 12,
    floor: '11',
    location: 'อาคาร A ชั้น VIP',
    description: 'ห้องประชุมปิดปรับปรุงระบบแสงและเสียง',
    status: 'MAINTENANCE',
    amenities: [
      { amenity: { id: 'a1', name: 'Projector' }, quantity: 1 },
    ],
    isCurrentlyOccupied: false,
  },
];

export default function MeetingRoomApp() {
  const [rooms] = useState<RoomItem[]>(INITIAL_ROOMS);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'calendar' | 'rooms'>('calendar');

  // Real-time Calendar Hook
  const {
    events,
    isLoading,
    isConnected,
    lastNotification,
    refresh,
  } = useRealtimeCalendar(selectedRoomId || undefined);

  // Modals States
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [modalPreSelectedRoomId, setModalPreSelectedRoomId] = useState<string>('');
  const [modalInitialStart, setModalInitialStart] = useState<string>('');
  const [modalInitialEnd, setModalInitialEnd] = useState<string>('');

  const [selectedEventForDetail, setSelectedEventForDetail] = useState<CalendarEvent | null>(null);

  // Handle slot selection from Calendar
  const handleSelectSlot = (date: string, startTime: string, endTime: string) => {
    setModalPreSelectedRoomId(selectedRoomId || rooms[0]?.id || '');
    setModalInitialStart(`${date}T${startTime}:00`);
    setModalInitialEnd(`${date}T${endTime}:00`);
    setIsBookingModalOpen(true);
  };

  // Handle direct "Book this room" button
  const handleBookDirect = (room: RoomItem) => {
    setModalPreSelectedRoomId(room.id);
    setModalInitialStart('');
    setModalInitialEnd('');
    setIsBookingModalOpen(true);
  };

  // Metrics Calculation
  const stats = useMemo(() => {
    const totalRooms = rooms.length;
    const occupiedNow = rooms.filter((r) => r.isCurrentlyOccupied).length;
    const availableNow = rooms.filter((r) => r.status === 'AVAILABLE' && !r.isCurrentlyOccupied).length;
    const todayBookingsCount = events.length;

    return { totalRooms, occupiedNow, availableNow, todayBookingsCount };
  }, [rooms, events]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                ระบบจองห้องประชุม
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 hidden sm:inline-block">
                  Enterprise v2.0
                </span>
              </h1>
              <p className="text-xs text-slate-400">Meeting Room Booking & Real-time Calendar</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Real-time Indicator Pill */}
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border shadow-xs transition-colors ${
                isConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}
            >
              <span className="relative flex h-2 w-2">
                {isConnected && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    isConnected ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}
                ></span>
              </span>
              <span className="hidden sm:inline">
                {isConnected ? 'Real-time เชื่อมต่ออยู่' : 'ออฟไลน์'}
              </span>
            </div>

            {/* Notification Bell */}
            <NotificationBell />

            {/* Link to Dashboard */}
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
            >
              <BarChart2 className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">แดชบอร์ด & สถิติ</span>
            </Link>

            {/* Book Now Button */}
            <button
              onClick={() => {
                setModalPreSelectedRoomId(selectedRoomId || rooms[0]?.id || '');
                setModalInitialStart('');
                setModalInitialEnd('');
                setIsBookingModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>จองห้องประชุม</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 space-y-6">
        {/* Real-time Toast Notification banner */}
        {lastNotification && (
          <div className="p-3.5 bg-blue-50/90 border border-blue-200 rounded-2xl text-blue-900 text-xs flex items-center justify-between shadow-xs animate-in slide-in-from-top duration-300">
            <span className="flex items-center gap-2 font-medium">
              <Radio className="w-4 h-4 text-blue-600 animate-pulse" />
              {lastNotification}
            </span>
            <span className="text-[11px] text-blue-500 bg-blue-100/60 px-2 py-0.5 rounded-full">
              อัปเดตเรียลไทม์
            </span>
          </div>
        )}

        {/* Dashboard Quick Stats Bar */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">ห้องประชุมทั้งหมด</p>
              <p className="text-xl font-bold text-slate-900">{stats.totalRooms} ห้อง</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">ว่างพร้อมใช้งานตอนนี้</p>
              <p className="text-xl font-bold text-emerald-600">{stats.availableNow} ห้อง</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">กำลังใช้งานอยู่ (ไม่ว่าง)</p>
              <p className="text-xl font-bold text-rose-600">{stats.occupiedNow} ห้อง</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">รายการจองวันนี้</p>
              <p className="text-xl font-bold text-purple-600">{stats.todayBookingsCount} รายการ</p>
            </div>
          </div>
        </section>

        {/* Tab & Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
          {/* Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${
                activeTab === 'calendar'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              ปฏิทินการจอง (Calendar View)
            </button>
            <button
              onClick={() => setActiveTab('rooms')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${
                activeTab === 'rooms'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              สถานะห้องประชุม (Room Status Grid)
            </button>
          </div>

          {/* Filters & Refresh */}
          <div className="flex items-center gap-2">
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">ห้องประชุมทั้งหมด (All Rooms)</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name} ({room.roomCode})
                </option>
              ))}
            </select>

            <button
              onClick={() => refresh()}
              disabled={isLoading}
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200/60"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tab 1: Interactive Calendar View */}
        {activeTab === 'calendar' && (
          <InteractiveCalendar
            events={events}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={(ev) => setSelectedEventForDetail(ev)}
            selectedRoomId={selectedRoomId}
          />
        )}

        {/* Tab 2: Room Status Grid */}
        {activeTab === 'rooms' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {rooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onBookRoom={handleBookDirect}
                onViewSchedule={(r) => {
                  setSelectedRoomId(r.id);
                  setActiveTab('calendar');
                }}
              />
            ))}
          </div>
        )}
      </main>

      {/* Booking Form Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onSuccess={() => refresh()}
        rooms={rooms}
        preSelectedRoomId={modalPreSelectedRoomId}
        initialStartTime={modalInitialStart}
        initialEndTime={modalInitialEnd}
      />

      {/* Booking Detail & Cancel Modal */}
      <BookingDetailModal
        isOpen={!!selectedEventForDetail}
        onClose={() => setSelectedEventForDetail(null)}
        onCancelled={() => refresh()}
        event={selectedEventForDetail}
      />
    </div>
  );
}
