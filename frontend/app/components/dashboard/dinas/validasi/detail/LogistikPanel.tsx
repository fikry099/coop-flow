// app/components/dashboard/dinas/validasi/detail/LogistikPanel.tsx
"use client";

import React, { useState } from "react";
import api from "@/app/lib/axios";
import { FaTruckLoading, FaWarehouse, FaCheckCircle } from "react-icons/fa";

interface LogistikPanelProps {
  orderId: number;
  statusLogistik: string;
  onSuccess: () => void;
}

export default function LogistikPanel({
  orderId,
  statusLogistik,
  onSuccess,
}: LogistikPanelProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirmArrival = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      await api.post(`/dinas/procurement/${orderId}/arrived-lini3`);
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
      onSuccess();
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Gagal merilis izin tebus ke Koperasi",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tahap A: Armada sudah dirilis Kemenko, menunggu konfirmasi fisik tiba
  if (statusLogistik === "PROD_LINI_1_2") {
    return (
      <div className="bg-white border border-zinc-100 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-teal-50 rounded-xl flex items-center justify-center text-teal-700">
            <FaTruckLoading className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-sm text-zinc-900">
              Armada Dalam Perjalanan
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Konfirmasi jika pupuk sudah tiba secara fisik di gudang Lini 3
              Kabupaten.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-semibold rounded-xl p-3">
            {error}
          </div>
        )}

        <button
          onClick={handleConfirmArrival}
          disabled={isSubmitting}
          className="w-full py-3 bg-emerald-700 text-white font-bold rounded-xl text-sm hover:bg-emerald-800 transition disabled:bg-emerald-700/50"
        >
          {isSubmitting ? "Memproses..." : "Konfirmasi Pupuk Telah Tiba"}
        </button>
      </div>
    );
  }

  // Tahap B: Sudah tiba, menunggu rilis izin tebus ke Koperasi
  if (statusLogistik === "GUDANG_LINI_3") {
    return (
      <div className="bg-teal-50 border border-teal-200 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-teal-800">
          <FaCheckCircle className="w-5 h-5" />
          <h3 className="font-black text-sm">Pupuk Sudah Tiba di Lini 3</h3>
        </div>
        <p className="text-xs text-zinc-600">
          Rilis izin tebus supaya Koperasi dapat mengambil pupuk bersubsidi ini.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-semibold rounded-xl p-3">
            {error}
          </div>
        )}

        <button
          onClick={handleReleaseToKoperasi}
          disabled={isSubmitting}
          className="w-full py-3 bg-teal-700 text-white font-bold rounded-xl text-sm hover:bg-teal-800 transition disabled:bg-teal-700/50 flex items-center justify-center gap-2"
        >
          <FaWarehouse className="w-4 h-4" />
          {isSubmitting ? "Memproses..." : "Rilis Izin Tebus ke Koperasi"}
        </button>
      </div>
    );
  }

  return null;
}
