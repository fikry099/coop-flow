'use client';

import React from 'react';
import { 
  FaFileAlt, FaCheckCircle, FaShieldAlt, 
  FaTruck, FaMapMarkerAlt, FaCheck, FaExclamationTriangle 
} from 'react-icons/fa';

interface ProcurementTrackerProps {
  order: any;
  onClose: () => void;
  onCompleteOrder: (id: number) => Promise<void>;
}

export default function ProcurementTracker({ 
  order, 
  onCompleteOrder 
}: ProcurementTrackerProps) {
  
  // Konfigurasi langkah pelacakan horizontal
  const trackingSteps = [
    { 
      title: 'Pengajuan', 
      desc: 'Koperasi', 
      isDone: true, 
      icon: FaFileAlt,
    },
    { 
      title: 'Verifikasi Dinas', 
      desc: order.status_verifikasi === 'REJECTED_DINAS' ? 'Ditolak' : 'Disetujui', 
      isDone: ['PENDING_KEMENKO', 'APPROVED', 'REJECTED_KEMENKO'].includes(order.status_verifikasi) || order.status_logistik !== 'NONE',
      isRejected: order.status_verifikasi === 'REJECTED_DINAS',
      icon: FaCheckCircle,
    },
    { 
      title: 'Kuota Kemenko', 
      desc: order.status_verifikasi === 'REJECTED_KEMENKO' ? 'Ditolak' : 'Disetujui', 
      isDone: order.status_verifikasi === 'APPROVED' || order.status_logistik !== 'NONE',
      isRejected: order.status_verifikasi === 'REJECTED_KEMENKO',
      icon: FaShieldAlt,
    },
    { 
      title: 'Rilis Armada', 
      desc: order.status_logistik === 'PROD_LINI_1_2' ? 'Lini 1-2' : 'Diproses', 
      isDone: ['PROD_LINI_1_2', 'GUDANG_LINI_3', 'SIAP_TEBUS_LINI_4', 'SELESAI'].includes(order.status_logistik),
      icon: FaTruck,
    },
    { 
      title: 'Tiba Lini 3 & 4', 
      desc: order.status_logistik === 'SIAP_TEBUS_LINI_4' ? 'Siap Tebet' : 'Bongkar Muat', 
      isDone: ['GUDANG_LINI_3', 'SIAP_TEBUS_LINI_4', 'SELESAI'].includes(order.status_logistik),
      icon: FaMapMarkerAlt,
    },
    { 
      title: 'Selesai', 
      desc: 'Masuk Gudang', 
      isDone: order.status_logistik === 'SELESAI', 
      icon: FaCheck,
    }
  ];

  const currentStatus = order.status_logistik !== 'NONE' ? order.status_logistik : order.status_verifikasi;

  // Mencari index langkah yang sedang berjalan saat ini (yang pertama kali isDone-nya false dan tidak reject)
  const currentActiveStepIndex = trackingSteps.findIndex(s => !s.isDone && !s.isRejected);

  return (
    <div className="border border-zinc-100 rounded-lg bg-white p-6 space-y-6">
      
      {/* Top Header Row Info */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="text-zinc-400 font-medium">Sedang Dipantau:</span>
          <span className="font-bold text-zinc-800">{order.po_number}</span>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium text-[11px]">
            {order.periode_pengadaan}
          </span>
        </div>
        <div>
          <span className="text-zinc-400 font-medium">Status: </span>
          <span className="font-bold text-blue-600 uppercase tracking-wider">
            {currentStatus?.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Stepper Flow Horizontal Modern */}
      <div className="w-full py-6 overflow-x-auto scrollbar-none">
        <div className="flex items-start justify-between px-2 w-full relative">
          
          {trackingSteps.map((step, idx) => {
            const Icon = step.icon;
            
            // Penentuan State Lingkaran & Garis
            let circleStyles = "text-zinc-400 bg-zinc-50 border-zinc-200";
            let isLineActive = false;
            let isProcessing = false; // Flag baru untuk efek loading

            if (step.isRejected) {
              circleStyles = "text-red-600 bg-red-50 border-red-200 shadow-sm shadow-red-100";
            } else if (step.isDone) {
              circleStyles = "text-emerald-600 bg-emerald-50 border-emerald-200 shadow-sm shadow-emerald-100";
              isLineActive = true;
            } else if (idx === currentActiveStepIndex) {
              // State Berjalan / Active Saat Ini
              circleStyles = "text-teal-700 bg-white border-teal-600 shadow-lg shadow-teal-100 font-semibold";
              isProcessing = true; // Aktifkan efek loading di sini
            }

            return (
              <div key={idx} className="flex flex-col items-center text-center relative flex-1">
                
                {/* KONSTRUKSI GARIS MODERN */}
                {idx < trackingSteps.length - 1 && (
                  <div className="absolute top-5 left-[calc(50%+1.5rem)] right-[calc(-50%+1.5rem)] h-[2px] flex items-center -z-0">
                    <svg className="w-full h-full" pointerEvents="none">
                      <line
                        x1="0"
                        y1="50%"
                        x2="100%"
                        y2="50%"
                        stroke={isLineActive ? "#10b981" : "#e4e4e7"}
                        strokeWidth="2"
                        strokeDasharray={isLineActive ? "0" : "4 4"}
                        className="transition-all duration-500"
                      />
                    </svg>
                  </div>
                )}

                {/* Container Bulatan Ikon dengan Efek Loading */}
                <div className="relative w-10 h-10 flex items-center justify-center z-10">
                  
                  {/* Efek Loading Putar Terus Menerus (Hanya muncul jika isProcessing true) */}
                  {isProcessing && (
                    <div className="absolute inset-0 rounded-xl border-2 border-dashed border-teal-400 animate-spin" style={{ animationDuration: '3s' }}></div>
                  )}

                  {/* Bulatan Ikon Utama */}
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-300 bg-white relative z-10 ${circleStyles}`}>
                    {step.isRejected ? (
                      <FaExclamationTriangle className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                </div>

                {/* Label Teks */}
                <div className="mt-4 space-y-1 max-w-[120px] relative z-10">
                  <p className={`text-xs font-semibold tracking-tight ${step.isRejected ? 'text-red-600' : step.isDone ? 'text-zinc-800' : isProcessing ? 'text-teal-800 font-bold' : 'text-zinc-400'}`}>
                    {step.title}
                  </p>
                  <p className={`text-[10px] font-medium leading-relaxed ${isProcessing ? 'text-teal-600' : 'text-zinc-400'}`}>
                    {step.desc}
                  </p>
                </div>

              </div>
            );
          })}

        </div>
      </div>

      {/* Informasi Tambahan Logistik & Tombol Konfirmasi jika Status Lini 4 */}
      {order.status_logistik === 'SIAP_TEBUS_LINI_4' && (
        <div className="flex items-center justify-between bg-zinc-50 border border-zinc-100 rounded-xl p-3.5 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5 text-xs text-zinc-600">
            <FaTruck className="text-emerald-600 w-4 h-4" />
            <p>Fisik armada logistik telah sampai di lokasi tujuan lini pengiriman Anda.</p>
          </div>
          <button
            onClick={() => onCompleteOrder(order.id)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-1.5 px-4 rounded-xl text-xs transition-all shadow-sm flex items-center gap-2"
          >
            Konfirmasi Bongkar Gudang
          </button>
        </div>
      )}

      {/* Alasan Penolakan Jika Mengalami Gagal Verifikasi */}
      {order.rejection_reason && (
        <div className="bg-red-50/50 border border-red-100 rounded-xl p-3 text-xs text-red-800 flex gap-2">
          <FaExclamationTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
          <p><span className="font-bold">Alasan Penolakan Sistem:</span> {order.rejection_reason}</p>
        </div>
      )}

    </div>
  );
}