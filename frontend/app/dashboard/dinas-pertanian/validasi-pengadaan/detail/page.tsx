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
import { ReceiptConfirmationModal } from "@/app/components/dashboard/dinas/validasi/detail/ReceiptConfirmationModal";

// Interface untuk item penyesuaian (adjust)
interface AdjustedItemPayload {
  id: number;
  final_bags_ordered: number;
}

type ModalType = "approve" | "reject" | "adjust" | null;

export default function DetailValidasiPage() {
  const router = useRouter();
  const { selectedId, setSelectedId } = useProcurementStore();

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State Pengendali Modal Kontrol (approve | reject | adjust)
  const [modalType, setModalType] = useState<ModalType>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // State khusus Modal Konfirmasi Penerimaan Fisik (Stage 4 - Lini 3)
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);

  // Function untuk mengambil data detail pengadaan
  const fetchDetailData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api.get(`/cooperative/procurement/${selectedId}`);
      const result = response.data;
      setData(result.data || result);
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            "Gagal mengambil data detail pengadaan",
        );
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

  // Handler Konfirmasi Aksi dari Modal (Setuju / Tolak / Penyesuaian)
  const handleActionConfirm = async (payload: {
    status: "APPROVED" | "REJECTED" | "ADJUST";
    reason?: string;
    items?: AdjustedItemPayload[];
  }) => {
    try {
      setIsSubmitting(true);

      const actionType =
        payload.status === "APPROVED"
          ? "APPROVE"
          : payload.status === "REJECTED"
            ? "REJECT"
            : "ADJUST";

      const requestPayload: Record<string, any> = {
        action: actionType,
      };

      if (payload.status === "REJECTED") {
        requestPayload.rejection_reason = payload.reason;
      } else if (payload.status === "ADJUST") {
        requestPayload.adjustment_reason = payload.reason;
        requestPayload.items = payload.items;
      }

      await api.post(`/dinas/procurement/${selectedId}/verify`, requestPayload);

      setModalType(null);
      fetchDetailData();
    } catch (err: any) {
      alert(
        err.response?.data?.message || "Gagal memperbarui status pengajuan.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // UI Skeleton saat Loading Data
  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse p-2">
        <div className="h-6 bg-zinc-200 rounded w-1/4"></div>
        <div className="h-20 bg-zinc-100 rounded-xl"></div>
        <div className="h-44 bg-zinc-100 rounded-xl"></div>
        <div className="h-56 bg-zinc-100 rounded-xl"></div>
      </div>
    );
  }

  // UI Tampilan Error
  if (error) {
    return (
      <div className="p-6 max-w-md mx-auto text-center space-y-4">
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl font-medium text-sm">
          {error}
        </div>
        <button
          onClick={handleBack}
          className="px-4 py-2 bg-zinc-800 text-white rounded-lg text-xs font-semibold hover:bg-zinc-700 transition"
        >
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
          title="Kembali"
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
          <h1 className="text-2xl font-black text-emerald-700 mt-0.5">
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
            onClick={() => setModalType("adjust")}
            className="px-5 py-2.5 bg-amber-500 text-white font-bold rounded-xl text-xs hover:bg-amber-600 transition tracking-wide shadow-sm"
          >
            Sesuaikan Pupuk
          </button>
          <button
            onClick={() => setModalType("approve")}
            className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700 shadow-sm transition tracking-wide"
          >
            Setujui Pengajuan
          </button>
        </div>
      )}

      {/* 5. Stage 4: Konfirmasi Penerimaan Fisik di Lini 3 (status_logistik = PROD_LINI_1_2) */}
      {data?.status_logistik === "PROD_LINI_1_2" && (
        <div className="flex justify-end pt-2">
          <button
            onClick={() => setIsReceiptModalOpen(true)}
            className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-sm transition-all duration-200 flex items-center justify-center gap-2"
          >
            Konfirmasi Penerimaan Fisik (Lini 3)
          </button>
        </div>
      )}

      {/* 6. Panel Logistik Dinas — rilis ke Koperasi (Lini 4) setelah barang ada di Gudang Lini 3 */}
      {data?.status_logistik === "GUDANG_LINI_3" && (
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

      {/* Modal Konfirmasi Penerimaan Fisik Stage 4 */}
      <ReceiptConfirmationModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        order={data}
        onSuccess={() => {
          setIsReceiptModalOpen(false);
          fetchDetailData();
        }}
      />
    </div>
  );
}
