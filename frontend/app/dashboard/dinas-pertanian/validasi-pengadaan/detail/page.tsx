"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProcurementStore } from "@/app/store/useProcurementStore";
import api from "@/app/lib/axios";
import axios from "axios";

import DetailStepper from "@/app/components/dashboard/dinas/validasi/detail/DetailStepper";
import InfoPengadaan from "@/app/components/dashboard/dinas/validasi/detail/InfoPengadaan";
import RincianItemTable from "@/app/components/dashboard/dinas/validasi/detail/RincianItemTable";
import ActionModal from "@/app/components/dashboard/dinas/validasi/detail/ActionModal";
import LogistikPanel from "@/app/components/dashboard/dinas/validasi/detail/LogistikPanel";

export default function DetailValidasiPage() {
  const router = useRouter();
  const { selectedId, setSelectedId } = useProcurementStore();
  
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State Pengendali Modal Kontrol
  const [modalType, setModalType] = useState<"approve" | "reject" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDetailData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.get(`/cooperative/procurement/${selectedId}`);
      const result = response.data;
      setData(result.data || result);
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Gagal mengambil data detail pengadaan");
      } else {
        setError("Terjadi kesalahan sistem");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedId) {
      router.replace("/dashboard/dinas-pertanian/validasi-pengadaan");
      return;
    }
    fetchDetailData();
  }, [selectedId, router]);

  const handleBack = () => {
    setSelectedId(null);
    router.push("/dashboard/dinas-pertanian/validasi-pengadaan");
  };

const handleActionConfirm = async (payload: { status: "APPROVED" | "REJECTED"; reason?: string }) => {
  try {
    setIsSubmitting(true);
    
    // Sesuaikan payload agar key-nya cocok dengan validasi backend
    await api.post(`/dinas/procurement/${selectedId}/verify`, {
      action: payload.status === "APPROVED" ? "APPROVE" : "REJECT", // Ubah ke 'action'
      rejection_reason: payload.reason,
    });

    setModalType(null);
    fetchDetailData();
  } catch (err: any) {
    alert(err.response?.data?.message || "Gagal memperbarui status pengiriman.");
  } finally {
    setIsSubmitting(false);
  }
};

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 bg-zinc-200 rounded w-1/4"></div>
        <div className="h-20 bg-zinc-100 rounded-xl"></div>
        <div className="h-44 bg-zinc-100 rounded-xl"></div>
        <div className="h-56 bg-zinc-100 rounded-xl"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-md mx-auto text-center space-y-4">
        <div className="p-4 bg-red-50 text-red-600 rounded-xl font-medium">{error}</div>
        <button onClick={handleBack} className="px-4 py-2 bg-zinc-800 text-white rounded-lg text-sm">
          Kembali ke Tabel
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleBack}
          className="p-2 hover:bg-zinc-100 rounded-xl transition border border-zinc-200 bg-white"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="w-4 h-4 text-zinc-600"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
        </button>
        <div>
          <div className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
            <span>Dashboard</span> &gt; <span>Validasi Pengadaan</span> &gt;{" "}
            <span className="text-zinc-500">Detail Pengajuan</span>
          </div>
          <h1 className="text-xl font-black text-zinc-900 mt-0.5">
            Detail Pengajuan
          </h1>
        </div>
      </div>

      {/* 1. Komponen Alur Progres Tracking Dinamis */}
      <DetailStepper
        statusVerifikasi={data?.status_verifikasi}
        statusLogistik={data?.status_logistik}
        createdAt={data?.created_at}
        dispatchedAt={data?.dispatched_at}
        dinasReceivedAt={data?.dinas_received_at}
        completedAt={data?.completed_at}
      />

      {/* 2. Bagian Utama Informasi Ringkasan */}
      <InfoPengadaan data={data} />

      {/* 3. Bagian Tabel Rincian Pupuk */}
      <RincianItemTable items={data?.items} />

      {/* 4. Action Buttons Dinas (Hanya aktif jika status PENDING_DINAS) */}
      {data?.status_verifikasi === "PENDING_DINAS" && (
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={() => setModalType("reject")}
            className="px-6 py-2.5 bg-white border border-red-200 text-red-600 font-bold rounded-xl text-xs hover:bg-red-50 transition tracking-wide shadow-sm"
          >
            Tolak Pengajuan
          </button>
          <button
            onClick={() => setModalType("approve")}
            className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700 shadow-sm transition tracking-wide"
          >
            Setujui Pengajuan
          </button>
        </div>
      )}

      {/* 5. Panel Logistik Dinas — konfirmasi tiba & rilis ke Koperasi */}
      {["PROD_LINI_1_2", "GUDANG_LINI_3"].includes(data?.status_logistik) && (
        <LogistikPanel
          orderId={selectedId as number}
          statusLogistik={data?.status_logistik}
          onSuccess={fetchDetailData}
        />
      )}

      {/* Rangkai Komponen Modal Konfirmasi Bersama State Tambahan */}
      <ActionModal
        isOpen={modalType !== null}
        type={modalType}
        data={data}
        isSubmitting={isSubmitting}
        onClose={() => setModalType(null)}
        onConfirm={handleActionConfirm}
      />
    </div>
  );
}