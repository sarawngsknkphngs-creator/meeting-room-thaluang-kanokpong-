'use client';

import React, { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  Calendar,
  CheckCircle2,
  Loader2,
  X,
} from 'lucide-react';

const MONTH_NAMES = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

export const ExportReportButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      setDownloadSuccess(false);

      const downloadUrl = `/api/reports/export-csv?year=${selectedYear}&month=${selectedMonth}`;

      // ทำการดาวน์โหลดผ่าน browser download trigger
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `meeting_room_report_${selectedYear}_${selectedMonth}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadSuccess(true);
      setTimeout(() => {
        setDownloadSuccess(false);
        setIsOpen(false);
      }, 1500);
    } catch (err) {
      console.error('Export error:', err);
      alert('เกิดข้อผิดพลาดในการดาวน์โหลดรายงาน');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all"
      >
        <FileSpreadsheet className="w-4 h-4" />
        <span>ดาวน์โหลดรายงาน (CSV)</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    ส่งออกรายงานการใช้งานห้องประชุม
                  </h3>
                  <p className="text-xs text-slate-500">รูปแบบ CSV (รองรับภาษาไทยใน Microsoft Excel)</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-white text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  เลือกเดือนที่ต้องการส่งออก
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  {MONTH_NAMES.map((name, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  เลือกปี พ.ศ. / ค.ศ.
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value={2026}>2026 (พ.ศ. 2569)</option>
                  <option value={2025}>2025 (พ.ศ. 2568)</option>
                  <option value={2024}>2024 (พ.ศ. 2567)</option>
                </select>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1 text-slate-600">
                <span className="font-semibold text-slate-800 block">ข้อมูลที่จะถูกส่งออก:</span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-500">
                  <li>รหัสการจอง และหัวข้อการประชุม</li>
                  <li>ห้องประชุม, ผู้จัด และแผนก</li>
                  <li>วันเวลาเริ่ม-สิ้นสุด และจำนวนชั่วโมงใช้งาน</li>
                  <li>จำนวนผู้เข้าร่วมประชุม และสถานะการจอง</li>
                </ul>
              </div>

              {downloadSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  เริ่มดาวน์โหลดรายงานเรียบร้อยแล้ว!
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-white transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleExportCSV}
                disabled={isExporting}
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-xs flex items-center gap-1.5 transition-all"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    กำลังสร้างไฟล์...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    ดาวน์โหลดทันที
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExportReportButton;
