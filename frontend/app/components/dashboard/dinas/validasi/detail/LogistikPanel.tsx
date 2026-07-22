"use client";

import React, { useState } from "react";
import api from "@/app/lib/axios";
import { FaTruckLoading, FaWarehouse, FaKey, FaTimes } from "react-icons/fa";

interface LogistikPanelProps {
  orderId: number;
  statusLogistik: string;
  poNumber?: string;
  onSuccess: () => void;
}

export default function LogistikPanel({
  orderId,
  statusLogistik,
  poNumber,
  onSuccess,
}: LogistikPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmingAction, setIsConfirmingAction] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirmArrival = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      await api.post(`/dinas/procurement/${orderId}/arrived-lini3`);
      setIsOpen(false);
      onSuccess();
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Gagal mengonfirmasi kedatangan pupuk",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReleaseToKoperasi = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      await api.post(`/dinas/procurement/${orderId}/release-lini4`);
      setIsOpen(false);
      onSuccess();
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Gagal merilis izin tebus ke Koperasi",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // 🟢 TAHAP A: Armada Dalam Perjalanan (PROD_LINI_1_2) -> Popup Konfirmasi Kedatangan
  if (statusLogistik === "PROD_LINI_1_2") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md transition-opacity">
        <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl transition-all relative border border-zinc-100 space-y-6 animate-in fade-in zoom-in-95 duration-200">
          {/* Close Button Soft */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600 transition"
          >
            <FaTimes className="w-3.5 h-3.5" />
          </button>

          {/* Header Modal Icon */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner">
              <FaTruckLoading className="w-8 h-8" />
            </div>
            <div>
              <span className="inline-block px-3 py-1 bg-amber-100/60 text-amber-800 rounded-full text-[11px] font-bold tracking-wide uppercase mb-1">
                Status: Dalam Perjalanan
              </span>
              <h3 className="text-xl font-black text-zinc-800 tracking-tight">
                Armada Logistik Dalam Perjalanan
              </h3>
              {poNumber && (
                <p className="text-xs text-zinc-400 mt-1">
                  Dokumen PO:{" "}
                  <span className="font-bold text-zinc-700">{poNumber}</span>
                </p>
              )}
            </div>
          </div>

          {/* Info Box Soft */}
          <div className="bg-zinc-50/80 rounded-2xl p-4 border border-zinc-100 text-center space-y-1">
            <p className="text-xs font-semibold text-zinc-600">
              Pengiriman pupuk sedang menuju Gudang Lini 3 Kabupaten.
            </p>
            <p className="text-xs text-zinc-400">
              Silakan konfirmasi jika seluruh barang telah tiba secara fisik.
            </p>
          </div>

          {error && (
            <div className="rounded-2xl bg-rose-50 p-3.5 text-xs font-semibold text-rose-600 text-center">
              {error}
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2">
            <button
              onClick={handleConfirmArrival}
              disabled={isSubmitting}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-sm disabled:opacity-50 transition"
            >
              {isSubmitting ? "Memproses..." : "Konfirmasi Pupuk Telah Tiba"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 🟢 TAHAP B: Sudah Tiba di Lini 3 (GUDANG_LINI_3) -> Popup Rilis Izin Tebus
  if (statusLogistik === "GUDANG_LINI_3") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/20 p-4 backdrop-blur-md transition-opacity">
        <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl transition-all relative border border-zinc-100 space-y-6 animate-in fade-in zoom-in-95 duration-200">
          {/* Close Button Soft */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600 transition"
          >
            <FaTimes className="w-3.5 h-3.5" />
          </button>

          {/* Header Modal Icon */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner">
              <FaWarehouse className="w-8 h-8" />
            </div>
            <div>
              <span className="inline-block px-3 py-1 bg-emerald-100/60 text-emerald-800 rounded-full text-[11px] font-bold tracking-wide uppercase mb-1">
                Status: Tiba di Lini 3
              </span>
              <h3 className="text-xl font-black text-zinc-800 tracking-tight">
                Pupuk Sudah Tiba di Lini 3
              </h3>
              {poNumber && (
                <p className="text-xs text-zinc-400 mt-1">
                  Dokumen PO:{" "}
                  <span className="font-bold text-zinc-700">{poNumber}</span>
                </p>
              )}
            </div>
          </div>

          {/* Info Box Soft */}
          <div className="bg-zinc-50/80 rounded-2xl p-4 border border-zinc-100 text-center space-y-1">
            <p className="text-xs font-semibold text-zinc-600">
              Seluruh fisik pupuk telah terverifikasi di Gudang Lini 3.
            </p>
            <p className="text-xs text-zinc-400">
              Rilis izin tebus supaya Koperasi dapat segera mengambil pupuk
              bersubsidi ini.
            </p>
          </div>

          {error && (
            <div className="rounded-2xl bg-rose-50 p-3.5 text-xs font-semibold text-rose-600 text-center">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            {!isConfirmingAction ? (
              <button
                onClick={() => setIsConfirmingAction(true)}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-sm transition flex items-center justify-center gap-2"
              >
                <FaKey className="w-3.5 h-3.5" /> Rilis Izin Tebus ke Koperasi
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-center text-xs font-bold text-zinc-700 mb-2">
                  Apakah Anda yakin ingin merilis izin tebus ini?
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsConfirmingAction(false)}
                    disabled={isSubmitting}
                    className="flex-1 py-3 border border-zinc-200 text-zinc-600 font-bold rounded-xl text-xs hover:bg-zinc-50 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleReleaseToKoperasi}
                    disabled={isSubmitting}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm disabled:opacity-50 transition"
                  >
                    {isSubmitting ? "Memproses..." : "Ya, Rilis Sekarang"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
