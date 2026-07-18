'use client';

import React from 'react';
import { FaFileAlt, FaCheckCircle, FaClock, FaTimesCircle, FaLayerGroup } from 'react-icons/fa';

interface OverviewProps {
  totalPengajuan: number;
  totalJenisPupuk: number;
  disetujuiCount: number;
  menungguCount: number;
  ditolakCount: number;
}

export default function ProcurementOverview({
  totalPengajuan,
  totalJenisPupuk,
  disetujuiCount,
  menungguCount,
  ditolakCount,
}: OverviewProps) {
  
  const metrics = [
    { 
      title: 'Total Pengajuan', 
      value: totalPengajuan, 
      icon: FaFileAlt, 
      color: 'bg-blue-50 text-blue-600 border-blue-100' 
    },
    { 
      title: 'Total Jenis Pupuk', 
      value: `${totalJenisPupuk} Jenis`, 
      icon: FaLayerGroup, 
      color: 'bg-purple-50 text-purple-600 border-purple-100' 
    },
    { 
      title: 'Disetujui', 
      value: disetujuiCount, 
      icon: FaCheckCircle, 
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100' 
    },
    { 
      title: 'Menunggu', 
      value: menungguCount, 
      icon: FaClock, 
      color: 'bg-amber-50 text-amber-600 border-amber-100' 
    },
    { 
      title: 'Ditolak', 
      value: ditolakCount, 
      icon: FaTimesCircle, 
      color: 'bg-red-50 text-red-600 border-red-100' 
    },
  ];

  return (
    /* Perubahan Layout Grid: 1 Kolom di HP, 3 Kolom di Tablet, 5 Kolom di Desktop dengan gap lebih lega */
    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {metrics.map((item, index) => {
        const Icon = item.icon;
        return (
          <div 
            key={index} 
            className="border border-zinc-100 rounded-lg p-5 bg-white shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-4.5"
          >
            {/* Ukuran Box Ikon Diperbesar & Diberi Border Halus Senada */}
            <div className={`w-14 h-14 rounded-full border flex items-center justify-center shrink-0 ${item.color}`}>
              <Icon className="w-6 h-6" />
            </div>
            
            {/* Penataan Tipografi Lebih Lega */}
            <div className="space-y-0.5 min-w-0">
              <p className="text-sm text-zinc-400 font-semibold tracking-wide">
                {item.title}
              </p>
              <p className="text-2xl font-extrabold text-zinc-800 tracking-tight truncate">
                {item.value}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}