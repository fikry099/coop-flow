"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProcurementStore } from "@/app/store/useProcurementStore";
import api from "@/app/lib/axios";
import axios from "axios";

import DetailStepper from "@/app/components/dashboard/dinas/validasi/detail/DetailStepper";
import InfoPengadaan from "@/app/components/dashboard/dinas/validasi/detail/InfoPengadaan";
import RincianItemTable from "@/app/components/dashboard/dinas/validasi/detail/RincianItemTable";
import ActionModal from "@/app/components/dashboard/kemenko/validasi/detail/ActionModal";
import DispatchPanel from "@/app/components/dashboard/kemenko/validasi/detail/DispatchPanel";

export default function DetailValidasiKemenkoPage() {
  const router = useRouter();
  const { selectedId, setSelectedId } = useProcurementStore();

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State modalType mendukung 'approve', 'reject', dan 'adjust'
  const [modalType, setModalType] = useState<
    "approve" | "reject" | "adjust" | null
  >(null);
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
      router.replace("/dashboard/kemenko-pangan/validasi-pengadaan");
      return;
    }
    fetchDetailData();
  }, [selectedId, router]);

  const handleBack = () => {
    setSelectedId(null);
    router.push("/dashboard/kemenko-pangan/validasi-pengadaan");
  };

  const handleActionConfirm = async (payload: {
    status: "APPROVED" | "REJECTED" | "ADJUST";
    reason?: string;
    items?: Array<{ id: number; final_bags_ordered: number }>;
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

      await api.post(
        `/procurement/${selectedId}/approve-quota`,
        requestPayload,
      );

      setModalType(null);
      fetchDetailData();
    } catch (err: any) {
      alert(
        err.response?.data?.message ||
          "Gagal memperbarui status verifikasi Kemenko",
      );
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
        <div className="p-4 bg-red-50 text-red-600 rounded-xl font-medium">
          {error}
        </div>
        <button
          onClick={handleBack}
          className="px-4 py-2 bg-zinc-800 text-white rounded-lg text-sm"
        >
          Kembali ke Tabel
        </button>
      </div>
    );
  }

  // Kondisi tahap mana yang sedang aktif
    const needsApproval =
      data?.status_verifikasi === "PENDING_KEMENKO" ||
      data?.status_verifikasi === "PENDING_KEMENKO_ADJUSTED";
  
  const needsDispatch =
    data?.status_verifikasi === "APPROVED" && data?.status_logistik === "NONE";

  return (
    <div className="space-y-6">
      {/* Header Breadcrumb & Navigation */}
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
            <span>Dashboard</span> &gt; <span>Validasi Kemenko</span> &gt;{" "}
            <span className="text-zinc-500">Detail Pengajuan</span>
          </div>
          <h1 className="text-2xl font-black text-emerald-700 mt-0.5">
            Detail Pengajuan
          </h1>
        </div>
      </div>

      <DetailStepper
        statusVerifikasi={data?.status_verifikasi}
        statusLogistik={data?.status_logistik}
        createdAt={data?.created_at}
        dispatchedAt={data?.dispatched_at}
        dinasReceivedAt={data?.dinas_received_at}
        completedAt={data?.completed_at}
      />

      <InfoPengadaan data={data} />
      <RincianItemTable items={data?.items} />

      {/* TAHAP 1: Tombol Aksi Kemenko (Muncul saat PENDING_KEMENKO) */}
      {needsApproval && (
        <div className="flex justify-end items-center gap-3 pt-2">
          <button
            onClick={() => setModalType("reject")}
            className="px-5 py-2.5 bg-white border border-red-200 text-red-600 font-bold rounded-xl text-xs hover:bg-red-50 transition tracking-wide shadow-sm"
          >
            Tolak Kuota
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
            Setujui Kuota
          </button>
        </div>
      )}

      {/* TAHAP 2: Rilis armada — hanya muncul setelah APPROVED dan logistik belum dirilis */}
      {needsDispatch && (
        <DispatchPanel
          orderId={selectedId as number}
          onSuccess={fetchDetailData}
        />
      )}

      {/* Modal Konfirmasi & Adjust */}
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
