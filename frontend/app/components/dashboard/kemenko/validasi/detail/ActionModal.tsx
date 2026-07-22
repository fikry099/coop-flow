"use client";

import React, { useState, useEffect } from "react";
import { FaExclamationTriangle, FaEdit } from "react-icons/fa";

interface AdjustedItemInput {
  id: number;
  fertilizer_name: string;
  packaging_size_kg?: number;
  final_bags_ordered: number;
}

interface AdjustedItemPayload {
  id: number;
  final_bags_ordered: number;
}

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload: {
    status: "APPROVED" | "REJECTED" | "ADJUST";
    reason?: string;
    items?: AdjustedItemPayload[];
  }) => void;
  type: "approve" | "reject" | "adjust" | null;
  data: any;
  isSubmitting: boolean;
}

export default function ActionModal({
  isOpen,
  onClose,
  onConfirm,
  type,
  data,
  isSubmitting,
}: ActionModalProps) {
  const [reason, setReason] = useState("");
  const [itemsState, setItemsState] = useState<AdjustedItemInput[]>([]);

  const isApprove = type === "approve";
  const isReject = type === "reject";
  const isAdjust = type === "adjust";

  useEffect(() => {
    if (!isOpen) return;

    setReason("");

    if (type === "adjust" && Array.isArray(data?.items)) {
      setItemsState(
        data.items.map((item: any) => ({
          id: item.id,
          fertilizer_name: item.fertilizer_name || item.name || "Pupuk",
          packaging_size_kg: item.packaging_size_kg,
          final_bags_ordered: item.final_bags_ordered ?? item.quantity ?? 0,
        })),
      );
    }
  }, [isOpen, type, data]);

  if (!isOpen || !type) return null;

  const handleItemQtyChange = (id: number, value: string) => {
    const parsed = value === "" ? 0 : parseInt(value, 10);
    setItemsState((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, final_bags_ordered: isNaN(parsed) ? 0 : parsed }
          : item,
      ),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if ((isReject || isAdjust) && !reason.trim()) return;

    if (isAdjust) {
      onConfirm({
        status: "ADJUST",
        reason,
        items: itemsState.map((item) => ({
          id: item.id,
          final_bags_ordered: Number(item.final_bags_ordered),
        })),
      });
      return;
    }

    onConfirm({
      status: isApprove ? "APPROVED" : "REJECTED",
      ...(isApprove ? {} : { reason }),
    });
  };

  const totalJenis = data?.items?.length || 0;
  const totalKarung =
    data?.items?.reduce(
      (acc: number, item: any) =>
        acc + (item.quantity || item.final_bags_ordered || 0),
      0,
    ) || 0;
  const totalBerat =
    data?.items?.reduce(
      (acc: number, item: any) => acc + (item.total_weight || 0),
      0,
    ) || 0;

  // 🟡 BANNER BACKGROUND: Mode Adjust menggunakan warna Amber (kuning keoranyean)
  const bannerBg = isApprove
    ? "bg-amber-50"
    : isReject
      ? "bg-red-50"
      : "bg-amber-50";

  // 🟡 TOMBOL SUBMIT: Mode Adjust menggunakan Amber
  const submitBtnCls = isApprove
    ? "bg-emerald-800 hover:bg-emerald-900 disabled:bg-emerald-800/50"
    : isReject
      ? "bg-red-600 hover:bg-red-700 disabled:bg-red-600/50"
      : "bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50";

  const isAdjustInvalid =
    isAdjust && (!reason.trim() || itemsState.length === 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className={`bg-white rounded-3xl p-8 w-full relative z-10 shadow-2xl border border-zinc-100 animate-in fade-in zoom-in-95 duration-200 ${
          isAdjust ? "max-w-xl" : "max-w-lg"
        }`}
      >
        <form
          onSubmit={handleSubmit}
          className="flex flex-col items-center text-center space-y-5"
        >
          {/* Top Banner Ikon */}
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center ${bannerBg}`}
          >
            {isApprove && (
              <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center text-amber-500 font-bold text-2xl">
                📋
              </div>
            )}
            {isReject && (
              <FaExclamationTriangle className="w-9 h-9 text-red-500" />
            )}
            {/* 🟡 IKON ADJUST (Kuning-keoranyean) */}
            {isAdjust && (
              <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                <FaEdit className="w-7 h-7" />
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-black text-zinc-900">
              Pengadaan Pupuk
            </h3>
            <p className="text-sm font-bold text-zinc-500 mt-0.5">
              {data?.po_number || "PGI_UNKNOWN"}
            </p>
          </div>

          {!isAdjust && (
            <div className="bg-zinc-50 rounded-2xl p-5 w-full border border-zinc-100 text-sm space-y-3">
              <div className="flex justify-between items-start gap-4">
                <span className="text-zinc-500 whitespace-nowrap">
                  Pengadaan :
                </span>
                <span className="font-semibold text-zinc-800 text-right">
                  {data?.cooperative?.name || "Koperasi"}
                </span>
              </div>

              <div className="flex justify-between items-start gap-4">
                <span className="text-zinc-500 whitespace-nowrap">
                  Tanggal Pengadaan :
                </span>
                <span className="font-semibold text-zinc-800 text-right">
                  {" "}
                  {data?.created_at
                    ? new Date(data.created_at).toLocaleDateString("id-ID")
                    : "-"}
                </span>
              </div>

              <div className="flex justify-between items-start gap-4">
                <span className="text-zinc-500 whitespace-nowrap">
                  Jenis Pupuk :
                </span>
                <span className="font-semibold text-zinc-800 text-right">
                  {totalJenis} Jenis
                </span>
              </div>

              <div className="flex justify-between items-start gap-4">
                <span className="text-zinc-500 whitespace-nowrap">
                  Jumlah Pupuk :
                </span>
                <span className="font-semibold text-zinc-800 text-right">
                  {data?.total_bags_ordered ?? totalKarung} Karung
                </span>
              </div>

              <div className="flex justify-between items-start gap-4">
                <span className="text-zinc-500 whitespace-nowrap">
                  Total Berat Pupuk :
                </span>
                <span className="font-semibold text-zinc-800 text-right">
                  {((data?.total_weight_kg ?? totalBerat) / 1000).toFixed(3)}{" "}
                  Ton
                </span>
              </div>
            </div>
          )}

          {isAdjust && (
            <div className="w-full text-left space-y-2">
              <div className="flex justify-between items-center px-1">
                <span className="text-sm font-bold text-zinc-700">
                  Sesuaikan Jumlah Karung
                </span>
                <span className="text-xs text-zinc-400">{data?.po_number}</span>
              </div>

              <div className="bg-zinc-50 rounded-2xl border border-zinc-100 divide-y divide-zinc-100 max-h-56 overflow-y-auto">
                {itemsState.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-zinc-800 truncate">
                        {item.fertilizer_name}
                      </p>
                      {item.packaging_size_kg ? (
                        <p className="text-xs text-zinc-400">
                          Kemasan {item.packaging_size_kg} Kg/karung
                        </p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="number"
                        min={0}
                        value={item.final_bags_ordered}
                        onChange={(e) =>
                          handleItemQtyChange(item.id, e.target.value)
                        }
                        // 🟡 Focus input menggunakan Amber
                        className="w-24 px-3 py-2 border border-zinc-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      />
                      <span className="text-xs text-zinc-400 w-14">Karung</span>
                    </div>
                  </div>
                ))}

                {itemsState.length === 0 && (
                  <div className="p-4 text-center text-xs text-zinc-400">
                    Tidak ada item pupuk pada pengadaan ini.
                  </div>
                )}
              </div>
            </div>
          )}

          {isReject && (
            <div className="w-full text-left space-y-1.5">
              <label className="text-sm font-bold text-zinc-700">
                Alasan Penolakan <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Masukkan alasan dokumen/kuota tidak valid..."
                className="w-full border border-zinc-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none h-20"
              />
            </div>
          )}

          {isAdjust && (
            <div className="w-full text-left space-y-1.5">
              <label className="text-sm font-bold text-zinc-700">
                Alasan Penyesuaian <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Misal: Stok pupuk NPK di lini 3 menipis, jumlah dikurangi..."
                // 🟡 Focus textarea menggunakan Amber
                className="w-full border border-zinc-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none h-20"
              />
            </div>
          )}

          {/* Copywriting tetap Kemenko */}
          <div className="space-y-1">
            <h4 className="text-sm font-black text-zinc-900">
              {isAdjust
                ? "Apakah Anda yakin menyesuaikan jumlah pengadaan ini?"
                : `Apakah Anda yakin untuk ${isApprove ? "menyetujui" : "menolak"} pengadaan ini?`}
            </h4>
            <p className="text-xs text-zinc-400">
              {isApprove &&
                "Pengadaan akan disetujui dan diteruskan ke pihak Logistik (PIHC) untuk proses penyaluran."}
              {isReject &&
                "Pengadaan ini akan ditolak oleh Kemenko dan dibatalkan secara permanen."}
              {isAdjust &&
                "Jumlah kuota akan disesuaikan (Adjust), dan dokumen akan otomatis diteruskan ke pihak Logistik."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full pt-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="py-3 px-6 border border-zinc-200 text-zinc-700 font-bold rounded-xl text-sm hover:bg-zinc-50 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={
                isSubmitting || (isReject && !reason.trim()) || isAdjustInvalid
              }
              className={`py-3 px-6 text-white font-bold rounded-xl text-sm transition shadow-sm ${submitBtnCls}`}
            >
              {isSubmitting ? "Memproses..." : isAdjust ? "Sesuaikan" : "Ya"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
