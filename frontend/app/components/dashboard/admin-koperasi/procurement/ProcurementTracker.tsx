"use client";

import React from "react";
import {
  FaFileAlt,
  FaCheckCircle,
  FaShieldAlt,
  FaTruck,
  FaWarehouse,
  FaStore,
  FaCheck,
  FaExclamationTriangle,
} from "react-icons/fa";

interface ProcurementTrackerProps {
  order: any;
  onClose?: () => void;
  onCompleteOrder: (id: number) => Promise<void>;
}

export default function ProcurementTracker({
  order,
  onCompleteOrder,
}: ProcurementTrackerProps) {
  // 🎯 Pemisahan Total Menjadi 7 Langkah (Lini 3 dan Lini 4 Dipisah)
  const trackingSteps = [
    {
      title: "Pengajuan",
      desc: "Koperasi",
      isDone: true,
      icon: FaFileAlt,
    },
    {
      title: "Verifikasi Dinas",
      desc:
        order.status_verifikasi === "REJECTED_DINAS" ? "Ditolak" : "Disetujui",
      isDone:
        ["PENDING_KEMENKO", "APPROVED", "REJECTED_KEMENKO"].includes(
          order.status_verifikasi,
        ) || order.status_logistik !== "NONE",
      isRejected: order.status_verifikasi === "REJECTED_DINAS",
      icon: FaCheckCircle,
    },
    {
      title: "Kuota Kemenko",
      desc:
        order.status_verifikasi === "REJECTED_KEMENKO"
          ? "Ditolak"
          : "Disetujui",
      isDone:
        order.status_verifikasi === "APPROVED" ||
        order.status_logistik !== "NONE",
      isRejected: order.status_verifikasi === "REJECTED_KEMENKO",
      icon: FaShieldAlt,
    },
    {
      title: "Rilis Armada",
      desc:
        order.status_logistik === "PROD_LINI_1_2" ? "Perjalanan" : "Diproses",
      isDone: ["GUDANG_LINI_3", "SIAP_TEBUS_LINI_4", "SELESAI"].includes(
        order.status_logistik,
      ),
      icon: FaTruck,
    },
    {
      title: "Tiba Lini 3",
      desc: "Gudang Kabupaten",
      isDone: ["GUDANG_LINI_3", "SIAP_TEBUS_LINI_4", "SELESAI"].includes(
        order.status_logistik,
      ),
      icon: FaWarehouse,
    },
    {
      title: "Tiba Lini 4",
      desc:
        order.status_logistik === "SIAP_TEBUS_LINI_4"
          ? "Siap Verifikasi"
          : order.status_logistik === "SELESAI"
            ? "Selesai Tebus"
            : "Menunggu Rilis",
      isDone: order.status_logistik === "SELESAI",
      icon: FaStore,
    },
    {
      title: "Selesai",
      desc: "Masuk Stok",
      isDone: order.status_logistik === "SELESAI",
      icon: FaCheck,
    },
  ];

  const currentStatus =
    order.status_logistik !== "NONE"
      ? order.status_logistik
      : order.status_verifikasi;

  // Mencari index langkah yang sedang berjalan saat ini
  const currentActiveStepIndex = trackingSteps.findIndex(
    (s) => !s.isDone && !s.isRejected,
  );

  return (
    <div className="border border-zinc-100 rounded-2xl bg-white p-6 space-y-6 shadow-sm">
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
          <span className="font-bold text-emerald-600 uppercase tracking-wider">
            {currentStatus?.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      {/* Stepper Flow Horizontal Modern (7 Langkah) */}
      <div className="w-full py-4 overflow-x-auto scrollbar-none">
        <div className="flex items-start justify-between px-2 w-full relative">
          {trackingSteps.map((step, idx) => {
            const Icon = step.icon;

            let circleStyles = "text-zinc-400 bg-zinc-50 border-zinc-200";
            let isLineActive = false;
            let isProcessing = false;

            if (step.isRejected) {
              circleStyles =
                "text-rose-600 bg-rose-50 border-rose-200 shadow-sm shadow-rose-100";
            } else if (step.isDone) {
              circleStyles =
                "text-emerald-600 bg-emerald-50 border-emerald-200 shadow-sm shadow-emerald-100";
              isLineActive = true;
            } else if (idx === currentActiveStepIndex) {
              circleStyles =
                "text-emerald-700 bg-white border-emerald-600 shadow-lg shadow-emerald-100 font-semibold";
              isProcessing = true;
            }

            return (
              <div
                key={idx}
                className="flex flex-col items-center text-center relative flex-1"
              >
                {/* KONSTRUKSI GARIS PENGHUBUNG */}
                {idx < trackingSteps.length - 1 && (
                  <div className="absolute top-5 left-[calc(50%+1.2rem)] right-[calc(-50%+1.2rem)] h-0.5 flex items-center z-0">
                    <svg className="w-full h-full" pointerEvents="none">
                      <line
                        x1="0"
                        y1="50%"
                        x2="100%"
                        y2="50%"
                        stroke={isLineActive ? "#059669" : "#e4e4e7"}
                        strokeWidth="2"
                        strokeDasharray={isLineActive ? "0" : "4 4"}
                        className="transition-all duration-500"
                      />
                    </svg>
                  </div>
                )}

                {/* Container Bulatan Ikon dengan Efek Loading Spin */}
                <div className="relative w-10 h-10 flex items-center justify-center z-10">
                  {isProcessing && (
                    <div
                      className="absolute inset-0 rounded-xl border-2 border-dashed border-emerald-500 animate-spin"
                      style={{ animationDuration: "4s" }}
                    />
                  )}

                  <div
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-300 bg-white relative z-10 ${circleStyles}`}
                  >
                    {step.isRejected ? (
                      <FaExclamationTriangle className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                </div>

                {/* Label Teks */}
                <div className="mt-3 space-y-0.5 max-w-24 relative z-10">
                  <p
                    className={`text-[11px] font-semibold tracking-tight ${step.isRejected ? "text-rose-600" : step.isDone ? "text-zinc-800" : isProcessing ? "text-emerald-800 font-bold" : "text-zinc-400"}`}
                  >
                    {step.title}
                  </p>
                  <p
                    className={`text-[9px] font-medium leading-relaxed ${isProcessing ? "text-emerald-600 font-semibold" : "text-zinc-400"}`}
                  >
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Panel Banner Aksi Verifikasi Koperasi di Lini 4 */}
      {order.status_logistik === "SIAP_TEBUS_LINI_4" && (
        <div className="flex flex-col sm:flex-row items-center justify-between bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-3 text-xs text-emerald-900">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
              <FaStore className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-sm text-emerald-950">
                Izin Penebusan Lini 4 Telah Dirilis
              </p>
              <p className="text-emerald-800/80 mt-0.5">
                Pupuk tiba di titik distribusi akhir koperasi. Lakukan
                verifikasi fisik karung sebelum masuk inventaris.
              </p>
            </div>
          </div>
          <button
            onClick={() => onCompleteOrder(order.id)}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition-all shadow-sm shrink-0 flex items-center justify-center gap-2"
          >
            Verifikasi & Konfirmasi Bongkar
          </button>
        </div>
      )}

      {/* Alasan Penolakan Jika Ada */}
      {order.rejection_reason && (
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-3.5 text-xs text-rose-800 flex gap-2.5">
          <FaExclamationTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <p>
            <span className="font-bold">Alasan Penolakan Sistem:</span>{" "}
            {order.rejection_reason}
          </p>
        </div>
      )}
    </div>
  );
}
