"use client";

import { useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
import api from "@/app/lib/axios";
import Swal from "sweetalert2";
import SelectedItemsList from "./SelectedItemsList";

export interface SelectedFertilizerItem {
  bagKey: string;
  fertilizer_id: number;
  fertilizer_code: string;
  nama: string;
  weightKg: number;
  price_per_kg: number;
  subtotal: number;
  isChecked: boolean;
  image_url: string | null;
  packaging_size_kg?: number;
  original_recommended_kg: number;
  land_id: number;
  analysis_meta_snapshot: {
    luas_lahan_hektar: number;
    jenis_komoditas: string;
    fase_tanam_saat_ini: string;
    suhu_rata_rata_celcius: number;
    kelembapan_persen: number;
    curah_hujan_mm: number;
  };
}

interface TransactionPanelProps {
  farmerId: number;
  grandTotalCost: number;
  items: SelectedFertilizerItem[];
  onBack: () => void;
  onSuccess?: () => void;
  farmerName: string;
  farmerAddress: string;
  villageName: string;
}

const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function TransactionPanel({
  farmerId,
  grandTotalCost,
  items,
  onBack,
  onSuccess,
  farmerName,
  farmerAddress,
  villageName,
}: TransactionPanelProps) {
  const [paymentMethod, setPaymentMethod] = useState<string>("Tunai");
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const changeAmount = amountPaid - grandTotalCost;
  const changeDisplay = changeAmount > 0 ? changeAmount : 0;

  const getImageUrl = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    const cleanPath = url.startsWith("/") ? url : `/${url}`;
    return `${BACKEND_BASE_URL}${cleanPath}`.replace(/([^:]\/)\/+/g, "$1");
  };

  // Filter item yang dicentang oleh pengguna
  const activeBags = items.filter((item) => item.isChecked);

  // MENGHITUNG TOTAL KG AKUMULASI
  const totalKgCount = Number(
    activeBags.reduce((acc, item) => acc + item.weightKg, 0).toFixed(2)
  );

  // MENGHITUNG DUA RINCIAN KARUNG & ECERAN SECARA DINAMIS
  const bagBreakdown = activeBags.map((item) => {
    const packagingSize = item.packaging_size_kg || 50; // Default ke 50 Kg jika tidak diset
    const fullBags = Math.floor(item.weightKg / packagingSize);
    const remainderKg = Number((item.weightKg % packagingSize).toFixed(2));

    return {
      name: item.nama,
      fullBags,
      remainderKg,
      packagingSize,
    };
  });

  // Total Karung Utuh Gabungan
  const totalFullBagsCount = bagBreakdown.reduce((acc, b) => acc + b.fullBags, 0);

  // Total Sisa Kg Eceran (Jika Ada Pecahan/Sisa Pembelian)
  const totalRemainderKg = Number(
    bagBreakdown.reduce((acc, b) => acc + b.remainderKg, 0).toFixed(2)
  );

  // DETEKSI DINI: Memeriksa apakah ada ID pupuk yang tidak valid (0, NaN, atau undefined)
  const hasInvalidFertilizer = activeBags.some((bag) => {
    const rawId = bag.fertilizer_id;
    return !rawId || isNaN(Number(rawId)) || Number(rawId) <= 0;
  });

  const handlePayment = async () => {
    // 🔍 LOG 1: Cek Input Awal & State
    console.log("=== [1] MEMULAI PROSES PEMBAYARAN ===");
    console.log("Farmer ID:", farmerId);
    console.log("Payment Method:", paymentMethod);
    console.log("Amount Paid:", amountPaid);
    console.log("Grand Total Cost:", grandTotalCost);
    console.log("Raw Active Bags Items:", activeBags);

    if (paymentMethod === "Tunai" && amountPaid < grandTotalCost) {
      console.warn("⚠️ Pembayaran dibatalkan: Nominal tunai kurang.");
      setErrorMessage("Nominal pembayaran tunai kurang dari total harga!");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    const groupedItemsMap: {
      [key: string]: {
        fertilizer_id: number;
        actual_purchased_kg: number;
        price_per_kg: number;
        subtotal: number;
        original_recommended_kg: number;
        land_id: number;
        analysis_meta_snapshot: {
          luas_lahan_hektar: number;
          jenis_komoditas: string;
          fase_tanam_saat_ini: string;
          suhu_rata_rata_celcius: number;
          kelembapan_persen: number;
          curah_hujan_mm: number;
        };
      };
    } = {};

    let dataCacatTerdeteksi = false;

    activeBags.forEach((bag, index) => {
      const rawId = bag.fertilizer_id;
      const sanitizedFertilizerId =
        rawId && !isNaN(Number(rawId)) ? Number(rawId) : 0;

      if (sanitizedFertilizerId === 0) {
        console.error(
          `❌ Item ke-${index} memiliki fertilizer_id tidak valid:`,
          bag,
        );
        dataCacatTerdeteksi = true;
      }

      const key = `${bag.land_id}-${sanitizedFertilizerId}`;

      if (groupedItemsMap[key]) {
        groupedItemsMap[key].actual_purchased_kg += bag.weightKg;
        groupedItemsMap[key].subtotal += bag.subtotal;
      } else {
        groupedItemsMap[key] = {
          fertilizer_id: sanitizedFertilizerId,
          actual_purchased_kg: bag.weightKg,
          price_per_kg: bag.price_per_kg,
          subtotal: bag.subtotal,
          original_recommended_kg: bag.original_recommended_kg,
          land_id: bag.land_id,
          analysis_meta_snapshot: {
            luas_lahan_hektar:
              bag.analysis_meta_snapshot?.luas_lahan_hektar ?? 0,
            jenis_komoditas:
              bag.analysis_meta_snapshot?.jenis_komoditas ?? "Tidak Diketahui",
            fase_tanam_saat_ini:
              bag.analysis_meta_snapshot?.fase_tanam_saat_ini ??
              "Tidak Diketahui",
            suhu_rata_rata_celcius:
              bag.analysis_meta_snapshot?.suhu_rata_rata_celcius ?? 0,
            // PENYESUAIAN 1: Membulatkan kelembapan agar sesuai tipe data Integer di backend
            kelembapan_persen: Math.round(
              bag.analysis_meta_snapshot?.kelembapan_persen ?? 0,
            ),
            curah_hujan_mm: bag.analysis_meta_snapshot?.curah_hujan_mm ?? 0,
          },
        };
      }
    });

    const optimizedItems = Object.values(groupedItemsMap);

    // BLOKIR SEBELUM REQUEST JIKA DATA TIDAK VALID
    if (dataCacatTerdeteksi) {
      console.error(
        "⛔ Transaksi diblokir di frontend karena ada ID pupuk cacat (0/null).",
      );
      setLoading(false);
      Swal.fire({
        title: "Aplikasi Memblokir Transaksi",
        text: "Gagal mengirim data! Terdeteksi pupuk dengan ID database tidak valid (0 / null). Silakan refresh halaman dan pilih ulang pupuk.",
        icon: "warning",
        confirmButtonText: "Mengerti",
      });
      return;
    }

    // PENYESUAIAN 2: Menambahkan grand_total ke dalam payload
    const payload = {
      farmer_id: farmerId,
      payment_method: paymentMethod,
      grand_total: grandTotalCost, // <--- Ditambahkan di sini
      amount_paid: paymentMethod === "Tunai" ? amountPaid : grandTotalCost,
      items: optimizedItems,
    };

    console.log("=== [2] PAYLOAD FINAL YANG DIKIRIM KE BACKEND ===");
    console.log(JSON.stringify(payload, null, 2));

    try {
      const response = await api.post(
        "/cooperative/transaction/transactionsfix",
        payload,
      );

      // 🔍 LOG 3: Response Berhasil
      console.log("=== [3] RESPON SUKSES DARI BACKEND ===", response.data);

      if (response.data.success) {
        const tglHariIni = new Date()
          .toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
          .replace(/\//g, "-");

        const trCode =
          response.data.data?.transaction_code ||
          "GAF-" +
            Math.floor(100 + Math.random() * 900) +
            "-" +
            Math.floor(1000 + Math.random() * 9000);

        Swal.fire({
          html: `
            <div class="flex flex-col items-center">
              <div class="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl font-bold mb-4">✓</div>
              <h3 class="text-lg font-extrabold text-gray-800">Pembelian Berhasil</h3>
              <p class="text-xs font-bold text-gray-500 tracking-wider mt-1">${trCode}</p>
              
              <div class="w-full mt-6 space-y-3.5 text-xs text-left">
                <div class="flex justify-between items-center">
                  <span class="text-gray-500 font-semibold">Petani</span>
                  <span class="text-gray-800 font-bold">${farmerName}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-gray-500 font-semibold">Tanggal</span>
                  <span class="text-gray-800 font-bold">${tglHariIni}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-gray-500 font-semibold">Total Pembayaran</span>
                  <span class="text-gray-800 font-black">Rp ${grandTotalCost.toLocaleString("id-ID")}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-gray-500 font-semibold">Metode</span>
                  <span class="text-gray-800 font-bold">${paymentMethod}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-gray-500 font-semibold">Dibayar</span>
                  <span class="text-gray-800 font-bold">Rp ${(paymentMethod === "Tunai" ? amountPaid : grandTotalCost).toLocaleString("id-ID")}</span>
                </div>
                <div class="flex justify-between items-center pt-2 border-t border-dashed border-gray-200">
                  <span class="text-gray-500 font-semibold">Kembalian</span>
                  <span class="text-emerald-600 font-black">Rp ${changeDisplay.toLocaleString("id-ID")}</span>
                </div>
              </div>
            </div>
          `,
          showCancelButton: true,
          confirmButtonText: "Kembali Ke Halaman",
          cancelButtonText: "🖨️ Cetak Struk",
          reverseButtons: true,
          customClass: {
            popup: "rounded-3xl p-6 max-w-sm",
            confirmButton:
              "bg-[#064e3b] text-white font-bold px-6 py-2.5 rounded-xl text-xs w-full hover:bg-emerald-950 transition",
            cancelButton:
              "bg-white border border-gray-200 text-gray-700 font-bold px-6 py-2.5 rounded-xl text-xs w-full hover:bg-gray-50 transition",
          },
          buttonsStyling: false,
        }).then((result) => {
          if (result.dismiss === Swal.DismissReason.cancel) {
            window.print();
          }
          if (onSuccess) {
            onSuccess();
          } else {
            window.location.href = "/dashboard/admin-koprasi/penyaluran";
          }
        });
      }
    } catch (error: any) {
      console.error("=== [4] ERROR SAAT REQUEST KE BACKEND ===", error);

      let serverMessage = "Terjadi kesalahan saat memproses pembayaran.";
      let detailValidationErrors = "";

      if (error.response) {
        if (error.response.status === 422 && error.response.data.errors) {
          // Error validasi Laravel (field kosong / format salah, dsb)
          const errorsObj = error.response.data.errors;
          console.table(errorsObj);

          detailValidationErrors = Object.keys(errorsObj)
            .map(
              (key) => `<li><b>${key}:</b> ${errorsObj[key].join(", ")}</li>`,
            )
            .join("");
          serverMessage = "Validasi data gagal di server Laravel.";
        } else if (
          error.response.status === 422 &&
          error.response.data.message
        ) {
          // BARU: tangkap pesan spesifik dari backend, mis. "Stok NPK tidak
          // mencukupi..." atau "Pupuk dengan ID X tidak ditemukan." yang
          // dilempar dari TransactionController saat cek stok gagal.
          serverMessage = error.response.data.message;
        } else {
          serverMessage = error.response.data.message || serverMessage;
        }
      }

      Swal.fire({
        title: "Pembayaran Gagal (Error 422)",
        html: `
          <div class="text-left text-xs space-y-2">
            <p class="text-gray-600">${serverMessage}</p>
            ${
              detailValidationErrors
                ? `
              <div class="bg-red-50 p-3 rounded-lg border border-red-200 mt-2">
                <p class="font-bold text-red-700 mb-1">Detail Validasi Laravel:</p>
                <ul class="list-disc pl-4 space-y-1 text-red-600 max-h-32 overflow-y-auto">${detailValidationErrors}</ul>
              </div>
            `
                : ""
            }
          </div>
        `,
        icon: "error",
        confirmButtonText: "Perbaiki Data",
        customClass: {
          confirmButton:
            "bg-[#115e59] text-white font-bold px-6 py-2.5 rounded-xl text-xs",
        },
        buttonsStyling: false,
      });

      setErrorMessage(serverMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
      {/* Header Panel */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          disabled={loading}
          className="w-8 h-8 rounded-lg border border-gray-150 hover:bg-gray-50 flex items-center justify-center text-gray-500 transition-colors disabled:opacity-50"
        >
          <FiArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h3 className="text-base font-bold text-gray-800">
            Konfirmasi Pembayaran
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Selesaikan transaksi penyaluran pupuk bersubsidi
          </p>
        </div>
      </div>

      {/* Alert Error */}
      {(errorMessage || hasInvalidFertilizer) && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-semibold">
          {hasInvalidFertilizer
            ? "⚠️ PERINGATAN: Terdeteksi pupuk tanpa ID database yang valid di daftar belanja. Hubungi admin sistem atau pilih pupuk kembali."
            : errorMessage}
        </div>
      )}

      {/* SUB-KOMPONEN 1: Daftar Pembelian & Detail Petani */}
      <SelectedItemsList
        farmerName={farmerName}
        farmerAddress={farmerAddress}
        villageName={villageName}
        activeBags={activeBags}
        getImageUrl={getImageUrl}
      />

      {/* Rincian Total Disesuaikan Secara Dinamis */}
      <div className="bg-gray-50/80 border border-gray-100 rounded-xl p-4 space-y-2 text-xs text-gray-600">
        <div className="flex justify-between">
          <span>Jumlah Jenis Pupuk</span>
          <span className="font-bold text-gray-800">
            {new Set(activeBags.map((b) => b.fertilizer_code)).size} Jenis
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span>Total Akumulasi</span>
          <span className="font-bold text-gray-800 text-right">
            {totalKgCount} Kg{" "}
            <span className="text-emerald-700 font-bold ml-1">
              ({totalFullBagsCount} Karung Utuh
              {totalRemainderKg > 0 ? ` + ${totalRemainderKg} Kg eceran` : ""})
            </span>
          </span>
        </div>

        <div className="flex justify-between pt-2 border-t border-gray-200 text-sm">
          <span className="font-semibold text-gray-800">Total Harga</span>
          <span className="font-black text-zinc-900 text-base">
            Rp {grandTotalCost.toLocaleString("id-ID")}
          </span>
        </div>
      </div>

      {/* Pilihan Metode Pembayaran */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Metode Pembayaran
        </h4>
        <div className="flex gap-6 text-xs font-semibold text-gray-700">
          {["Tunai", "Transfer", "Qris"].map((method) => (
            <label
              key={method}
              className="flex items-center gap-2 cursor-pointer select-none"
            >
              <input
                type="radio"
                name="payment_method"
                value={method}
                checked={paymentMethod === method}
                onChange={() => setPaymentMethod(method)}
                disabled={loading}
                className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500 cursor-pointer disabled:opacity-50"
              />
              {method}
            </label>
          ))}
        </div>
      </div>

      {/* Input Nominal Dibayar */}
      {paymentMethod === "Tunai" && (
        <div className="space-y-3 bg-gray-50/40 p-3.5 border border-dashed border-gray-200 rounded-xl">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Nominal Dibayar
          </h4>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
              Rp
            </span>
            <input
              type="number"
              placeholder="0"
              value={amountPaid || ""}
              onChange={(e) =>
                setAmountPaid(
                  e.target.value === "" ? 0 : Number(e.target.value),
                )
              }
              disabled={loading}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:outline-none focus:border-emerald-500 transition disabled:bg-gray-100"
            />
          </div>
          <div className="flex justify-between items-center pt-1.5 text-xs">
            <span className="font-semibold text-zinc-500">Kembalian Cash</span>
            <span className="font-black text-emerald-600 text-sm">
              Rp {changeDisplay.toLocaleString("id-ID")}
            </span>
          </div>
        </div>
      )}

      {/* Tombol Aksi Bawah */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
        <button
          onClick={onBack}
          disabled={loading}
          className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
        >
          Kembali
        </button>
        <button
          onClick={handlePayment}
          disabled={loading || activeBags.length === 0 || hasInvalidFertilizer}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition text-white ${
            hasInvalidFertilizer
              ? "bg-amber-600 hover:bg-amber-700 cursor-not-allowed"
              : "bg-[#115e59] hover:bg-[#134e4a] disabled:opacity-50"
          }`}
        >
          {loading
            ? "Memproses..."
            : hasInvalidFertilizer
              ? "⚠️ ID Pupuk Cacat"
              : "Konfirmasi Pembayaran"}
        </button>
      </div>
    </div>
  );
}