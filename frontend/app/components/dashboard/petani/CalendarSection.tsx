'use client';

import React, { useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface PlantingItem {
  id: number;
  plant_name: string;
  date: string; // ISO String (YYYY-MM-DD)
  phase?: string;
}

interface FertilizerItem {
  id: number;
  fertilizer_name: string;
  date: string; // ISO String (YYYY-MM-DD)
  stage?: string;
}

interface CalendarProps {
  calendars?: {
    planting?: PlantingItem[];
    fertilizer?: FertilizerItem[];
  };
}

export default function CalendarSection({ calendars }: CalendarProps) {
  // State navigasi bulan/tahun (Default ke bulan berjalan saat ini)
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  
  // State untuk menyimpan item aktif yang diklik pengguna (untuk menampilkan detail agenda)
  const [selectedAgenda, setSelectedAgenda] = useState<{
    type: 'planting' | 'fertilizer';
    title: string;
    sub: string;
    date: string;
  } | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0 - 11

  // Format Nama Bulan & Tahun (Bahasa Indonesia) - 🟢 DIPERBAIKI: 'Long' diubah jadi 'long'
  const monthLabel = currentDate.toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  });

  // Navigasi Bulan
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedAgenda(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedAgenda(null);
  };

  // Perhitungan Struktur Hari dalam Bulan Active
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Posisi hari pertama (0 = Minggu, 1 = Senin, dst). Disesuaikan agar Senin = index 0
  const firstDayRaw = new Date(year, month, 1).getDay();
  const startOffset = firstDayRaw === 0 ? 6 : firstDayRaw - 1;

  // Helper untuk memformat angka tanggal ke YYYY-MM-DD lokal
  const formatYmd = (dayNum: number) => {
    const d = new Date(year, month, dayNum);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Helper Pencarian Data Kalender Tanam
  const getPlantingEvent = (dayNum: number) => {
    if (!calendars?.planting) return null;
    const targetDateStr = formatYmd(dayNum);
    return calendars.planting.find((p) => p.date?.startsWith(targetDateStr));
  };

  // Helper Pencarian Data Kalender Pemupukan
  const getFertilizerEvent = (dayNum: number) => {
    if (!calendars?.fertilizer) return null;
    const targetDateStr = formatYmd(dayNum);
    return calendars.fertilizer.find((f) => f.date?.startsWith(targetDateStr));
  };

  // Penentuan Gaya Warna Kalender Tanam
  const getPlantingClass = (dayNum: number) => {
    const event = getPlantingEvent(dayNum);
    if (!event) return 'text-slate-700 hover:bg-slate-100 rounded-full';

    const phase = (event.phase || '').toLowerCase();
    if (phase.includes('tanam') || phase.includes('vegetatif')) {
      return 'bg-emerald-600 text-white font-bold rounded-full shadow-xs';
    }
    if (phase.includes('olah') || phase.includes('persiapan')) {
      return 'bg-sky-500 text-white font-bold rounded-full shadow-xs';
    }
    if (phase.includes('generatif') || phase.includes('pelihara')) {
      return 'bg-amber-400 text-slate-900 font-bold rounded-full shadow-xs';
    }
    if (phase.includes('panen')) {
      return 'bg-red-500 text-white font-bold rounded-full shadow-xs';
    }
    return 'bg-emerald-700 text-white font-bold rounded-full shadow-xs';
  };

  // Penentuan Gaya Warna Kalender Pemupukan
  const getFertilizerClass = (dayNum: number) => {
    const event = getFertilizerEvent(dayNum);
    if (!event) return 'text-slate-700 hover:bg-slate-100 rounded-full';

    const stage = (event.stage || '').toLowerCase();
    if (stage.includes('dasar')) {
      return 'bg-emerald-700 text-white font-bold rounded-full shadow-xs';
    }
    if (stage.includes('susulan 1') || stage.includes('1')) {
      return 'bg-sky-500 text-white font-bold rounded-full shadow-xs';
    }
    if (stage.includes('susulan 2') || stage.includes('2')) {
      return 'bg-amber-400 text-slate-900 font-bold rounded-full shadow-xs';
    }
    return 'bg-purple-600 text-white font-bold rounded-full shadow-xs';
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-extrabold text-slate-900">Kalender Kegiatan</h2>
        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 capitalize">
          {monthLabel}
        </span>
      </div>

      {/* Pop-up Detail Agenda Jika Tanggal Ditekan */}
      {selectedAgenda && (
        <div className="bg-emerald-900 text-white p-3.5 rounded-2xl text-xs space-y-1 animate-fadeIn flex justify-between items-center shadow-md">
          <div>
            <p className="text-[10px] text-emerald-300 font-semibold tracking-wide uppercase">
              {selectedAgenda.date} • {selectedAgenda.type === 'planting' ? 'Jadwal Tanam' : 'Jadwal Pemupukan'}
            </p>
            <p className="font-extrabold text-sm">{selectedAgenda.title}</p>
            <p className="text-emerald-200 text-[11px]">{selectedAgenda.sub}</p>
          </div>
          <button
            onClick={() => setSelectedAgenda(null)}
            className="text-emerald-300 hover:text-white font-bold text-base px-2"
          >
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. KALENDER TANAM */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <p className="font-extrabold text-xs text-slate-800 flex items-center justify-between">
            <span>Kalender Tanam</span>
            <span className="text-[10px] text-slate-400 font-normal">
              {calendars?.planting?.length || 0} agenda
            </span>
          </p>

          {/* Header Navigasi Bulan */}
          <div className="flex justify-between items-center text-xs font-bold text-slate-700 px-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition"
            >
              <FaChevronLeft className="text-[10px]" />
            </button>
            <span className="capitalize">{monthLabel}</span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition"
            >
              <FaChevronRight className="text-[10px]" />
            </button>
          </div>

          {/* Grid Hari */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px]">
            {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((d) => (
              <span key={d} className="font-bold text-slate-400 py-1">
                {d}
              </span>
            ))}

            {/* Empty Offset Day Slots */}
            {Array.from({ length: startOffset }).map((_, idx) => (
              <div key={`p-empty-${idx}`} className="py-1" />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const event = getPlantingEvent(day);
              return (
                <div
                  key={`p-${day}`}
                  onClick={() => {
                    if (event) {
                      setSelectedAgenda({
                        type: 'planting',
                        title: event.plant_name,
                        sub: `Fase: ${event.phase || 'Tanam'}`,
                        date: formatYmd(day),
                      });
                    }
                  }}
                  className={`h-7 w-7 mx-auto text-[11px] flex items-center justify-center cursor-pointer transition ${getPlantingClass(
                    day
                  )}`}
                >
                  {day}
                </div>
              );
            })}
          </div>

          {/* Legend Keterangan Warna */}
          <div className="pt-2.5 border-t border-slate-100 flex flex-wrap gap-2 text-[9px] text-slate-500">
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span>Tanam / Vegetatif</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
              <span>Persiapan Lahan</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>Generatif</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span>Panen</span>
            </div>
          </div>
        </div>

        {/* 2. KALENDER PEMUPUKAN */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <p className="font-extrabold text-xs text-slate-800 flex items-center justify-between">
            <span>Kalender Pemupukan</span>
            <span className="text-[10px] text-slate-400 font-normal">
              {calendars?.fertilizer?.length || 0} agenda
            </span>
          </p>

          {/* Header Navigasi Bulan */}
          <div className="flex justify-between items-center text-xs font-bold text-slate-700 px-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition"
            >
              <FaChevronLeft className="text-[10px]" />
            </button>
            <span className="capitalize">{monthLabel}</span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition"
            >
              <FaChevronRight className="text-[10px]" />
            </button>
          </div>

          {/* Grid Hari */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px]">
            {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((d) => (
              <span key={d} className="font-bold text-slate-400 py-1">
                {d}
              </span>
            ))}

            {/* Empty Offset Day Slots */}
            {Array.from({ length: startOffset }).map((_, idx) => (
              <div key={`f-empty-${idx}`} className="py-1" />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const event = getFertilizerEvent(day);
              return (
                <div
                  key={`f-${day}`}
                  onClick={() => {
                    if (event) {
                      setSelectedAgenda({
                        type: 'fertilizer',
                        title: event.fertilizer_name,
                        sub: `Tahap: ${event.stage || 'Pemupukan'}`,
                        date: formatYmd(day),
                      });
                    }
                  }}
                  className={`h-7 w-7 mx-auto text-[11px] flex items-center justify-center cursor-pointer transition ${getFertilizerClass(
                    day
                  )}`}
                >
                  {day}
                </div>
              );
            })}
          </div>

          {/* Legend Keterangan Warna */}
          <div className="pt-2.5 border-t border-slate-100 flex flex-wrap gap-2 text-[9px] text-slate-500">
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-700"></span>
              <span>Pupuk Dasar</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
              <span>Susulan 1</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>Susulan 2</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-purple-600"></span>
              <span>Lainnya</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}