"use client";

import React, { useState } from "react";
import api from "@/app/lib/axios";
import { FaTruck, FaShip, FaCheckCircle } from "react-icons/fa";

interface GisInfo {
  jarak_riil: string;
  estimasi_waktu_realistis: string;
  lintas_pulau: string;
  log_simulasi: string[];
}

interface DispatchPanelProps {
  orderId: number;
  onSuccess: () => void;
}

export default function DispatchPanel({
  orderId,
  onSuccess,
}: DispatchPanelProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [result, setResult] = useState<GisInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDispatch = async () => {
    try {
      setIsDispatching(true);
      setError(null);
      const res = await api.post(`/procurement/${orderId}/dispatch-truck`);
      setResult(res.data.gis_info);
      setIsConfirming(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal merilis armada logistik");
    } finally {
      setIsDispatching(false);
    }
  };

  const handleFinish = () => {
    setResult(null);
    onSuccess();
  };

  return (
    <>
      {/* Panel Utama (Kartu Aksi Rilis Armada) */}
      <div className="bg-white border border-zinc-100 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-teal-50 rounded-xl flex items-center justify-center text-teal-700">
            <FaTruck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-sm text-zinc-900">
              Kuota Disetujui — Siap Rilis Armada
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Sistem akan menghitung rute, moda transportasi, dan estimasi waktu
              tiba secara otomatis.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-semibold rounded-xl p-3">
            {error}
          </div>
        )}

        {!isConfirming ? (
          <button
            onClick={() => setIsConfirming(true)}
            className="w-full py-3 bg-emerald-700 text-white font-bold rounded-xl text-sm hover:bg-emerald-800 transition flex items-center justify-center gap-2"
          >
            <FaShip className="w-4 h-4" /> Rilis Armada Logistik
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => setIsConfirming(false)}
              disabled={isDispatching}
              className="flex-1 py-2.5 border border-zinc-200 text-zinc-700 font-bold rounded-xl text-xs hover:bg-zinc-50 transition"
            >
              Batal
            </button>
            <button
              onClick={handleDispatch}
              disabled={isDispatching}
              className="flex-1 py-2.5 bg-emerald-700 text-white font-bold rounded-xl text-xs hover:bg-emerald-800 transition disabled:bg-emerald-700/50"
            >
              {isDispatching ? "Menghitung Rute..." : "Ya, Rilis Sekarang"}
            </button>
          </div>
        )}
      </div>

      {/* 🟢 MODAL HASIL RILIS ARMADA (Hanya Tampil Jika Result Ada) */}
      {result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Overlay Blur */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full relative z-10 shadow-2xl border border-zinc-100 animate-in fade-in zoom-in-95 duration-200 space-y-5">
            {/* Header Modal */}
            <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
              <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-700 shrink-0">
                <FaCheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-base text-zinc-900">
                  Armada Berhasil Dirilis!
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Detail rute dan penugasan armada telah berhasil disimulasikan.
                </p>
              </div>
            </div>

            {/* Grid Informasi GIS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-zinc-50 rounded-2xl p-3.5 border border-zinc-100">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
                  Jarak Tempuh
                </p>
                <p className="text-zinc-900 font-black text-sm mt-1">
                  {result.jarak_riil}
                </p>
              </div>

              <div className="bg-zinc-50 rounded-2xl p-3.5 border border-zinc-100">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
                  Estimasi Waktu
                </p>
                <p className="text-zinc-900 font-black text-sm mt-1">
                  {result.estimasi_waktu_realistis}
                </p>
              </div>

              <div className="bg-zinc-50 rounded-2xl p-3.5 border border-zinc-100">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
                  Rute
                </p>
                <p className="text-zinc-900 font-black text-xs mt-1 truncate">
                  {result.lintas_pulau}
                </p>
              </div>
            </div>

            {/* Log Simulasi Logistik */}
            <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100 space-y-2">
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                Log Simulasi Logistik
              </p>
              <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                {result.log_simulasi?.map((log, i) => (
                  <p key={i} className="text-xs text-zinc-600 leading-relaxed">
                    • {log}
                  </p>
                ))}
              </div>
            </div>

            {/* Tombol Lanjutkan */}
            <div className="pt-2">
              <button
                onClick={handleFinish}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-sm transition shadow-sm"
              >
                Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
