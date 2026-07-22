import React, { useState, useEffect } from "react";
import axios from "axios";
import api from "@/app/lib/axios";

// --- Types & Interfaces ---
export interface OrderItem {
  id: number;
  fertilizer_id: number;
  fertilizer_name: string;
  final_bags_ordered: number;
  packaging_size_kg: number;
  actual_received_bags?: number | null;
}

export interface ProcurementOrder {
  id: number;
  po_number: string;
  periode_pengadaan: string;
  items: OrderItem[];
}

interface ReceiptConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ProcurementOrder | null;
  onSuccess: () => void;
}

interface ItemInputState {
  id: number;
  actual_received_bags: number;
}

export const ReceiptConfirmationModal = ({
  isOpen,
  onClose,
  order,
  onSuccess,
}: ReceiptConfirmationModalProps) => {
  const [itemsInput, setItemsInput] = useState<ItemInputState[]>([]);
  const [receiptNotes, setReceiptNotes] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (order && order.items) {
      const initialItems = order.items.map((item) => ({
        id: item.id,
        actual_received_bags:
          item.actual_received_bags ?? item.final_bags_ordered,
      }));
      setItemsInput(initialItems);
      setReceiptNotes("");
      setErrorMessage(null);
    }
  }, [order, isOpen]);

  if (!isOpen || !order) return null;

  const handleBagChange = (id: number, value: number) => {
    setItemsInput((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, actual_received_bags: Math.max(0, value) }
          : item,
      ),
    );
  };

  const handleAutoFill = () => {
    if (!order) return;
    const filled = order.items.map((item) => ({
      id: item.id,
      actual_received_bags: item.final_bags_ordered,
    }));
    setItemsInput(filled);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const payload = {
        items: itemsInput,
        receipt_notes: receiptNotes,
      };

      await api.post(`/dinas/procurement/${order.id}/arrived-lini3`, payload);

      onSuccess();
      onClose();
    } catch (err: any) {
      let msg = "Gagal menyimpan konfirmasi penerimaan.";
      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message || msg;
      }
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/20 p-4 backdrop-blur-md transition-opacity">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl transition-all relative">
        {/* Tombol Close Soft */}
        <button
          onClick={onClose}
          type="button"
          className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600 transition"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="text-center sm:text-left space-y-1 pr-8">
          <h3 className="text-xl font-black text-zinc-800 tracking-tight">
            Konfirmasi Penerimaan Fisik (Lini 3)
          </h3>
          <p className="text-xs font-semibold text-zinc-400">
            Dokumen:{" "}
            <span className="text-amber-600 font-bold">{order.po_number}</span>
          </p>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {errorMessage && (
            <div className="rounded-2xl bg-rose-50 p-3.5 text-xs font-medium text-rose-600">
              {errorMessage}
            </div>
          )}

          {/* Banner Info Soft */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 rounded-2xl bg-amber-50/60 p-4 text-xs">
            <span className="text-amber-900/80 font-medium">
              Verifikasi fisik karung yang diterima di Gudang Lini 3 Kabupaten.
            </span>
            <button
              type="button"
              onClick={handleAutoFill}
              className="font-bold text-amber-600 hover:text-amber-700 underline shrink-0"
            >
              Samakan Semua
            </button>
          </div>

          {/* Table Container Soft & Borderless */}
          <div className="overflow-hidden rounded-2xl bg-zinc-50/70 p-2">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
                    <th className="px-4 py-3">Jenis Pupuk</th>
                    <th className="px-4 py-3 text-center">Ukuran</th>
                    <th className="px-4 py-3 text-center">Dikirim</th>
                    <th className="px-4 py-3 text-center">Diterima Fisik</th>
                    <th className="px-4 py-3 text-right">Total Fisik</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-700">
                  {order.items.map((item) => {
                    const currentInput = itemsInput.find(
                      (i) => i.id === item.id,
                    );
                    const receivedBags =
                      currentInput?.actual_received_bags ?? 0;
                    const totalKg = receivedBags * item.packaging_size_kg;
                    const isSelisih = receivedBags !== item.final_bags_ordered;

                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          isSelisih ? "bg-amber-100/40" : "hover:bg-white/50"
                        }`}
                      >
                        <td className="px-4 py-3.5 font-bold text-zinc-800">
                          {item.fertilizer_name}
                        </td>
                        <td className="px-4 py-3.5 text-center text-zinc-500 font-medium">
                          {item.packaging_size_kg} Kg
                        </td>
                        <td className="px-4 py-3.5 text-center font-bold text-zinc-600">
                          {item.final_bags_ordered}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <input
                            type="number"
                            min="0"
                            value={receivedBags}
                            onChange={(e) =>
                              handleBagChange(
                                item.id,
                                parseInt(e.target.value) || 0,
                              )
                            }
                            className="w-20 rounded-xl bg-white px-2.5 py-1.5 text-center font-bold text-zinc-800 shadow-sm border border-zinc-200/60 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition"
                          />
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-zinc-800">
                          {totalKg.toLocaleString("id-ID")} Kg
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Input Catatan Soft */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-600">
              Catatan Berita Acara / Keterangan Selisih (Opsional)
            </label>
            <textarea
              rows={3}
              value={receiptNotes}
              onChange={(e) => setReceiptNotes(e.target.value)}
              placeholder="Contoh: Pupuk NPK diterima 190 karung, 10 karung rusak/basah..."
              className="w-full rounded-2xl bg-zinc-50/70 border border-zinc-200/60 p-3.5 text-xs text-zinc-800 placeholder:text-zinc-400 focus:bg-white focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition"
            />
          </div>

          {/* Modal Footer / Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-zinc-200/80 text-xs font-bold text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-xs font-bold text-white shadow-sm disabled:opacity-50 transition"
            >
              {loading ? "Memproses..." : "Konfirmasi Penerimaan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
