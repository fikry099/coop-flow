'use client';

import React from 'react';

interface ProcurementTableProps {
  loading: boolean;
  loadingDetail?: boolean; // Menerima status loading detail dari parent
  orders: any[];
  selectedOrderId: number | null;
  onSelectOrder: (order: any) => void;
  selectedOrderData?: any; 
}

export default function ProcurementTable({
  loading,
  loadingDetail = false,
  orders,
  selectedOrderId,
  onSelectOrder,
  selectedOrderData, 
}: ProcurementTableProps) {
  
  const formatRupiah = (value: any) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(Number(value));
  };

  return (
    // Penambahan max-h dan overflow-y-auto untuk mengaktifkan scroll internal pada tabel data banyak
    <div className="border border-gray-100 rounded-lg overflow-hidden shadow-sm bg-white max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200">
      <table className="w-full text-left border-collapse">
        {/* head dibuat sticky agar tetap terlihat saat di-scroll */}
        <thead className="sticky top-0 bg-gray-50 z-10 shadow-sm">
          <tr className="text-gray-400 text-xs font-bold border-b border-gray-100">
            <th className="p-4 bg-gray-50">No. Pengadaan</th>
            <th className="p-4 bg-gray-50">Periode / Tanggal</th>
            <th className="p-4 bg-gray-50">Jenis Pupuk</th>
            <th className="p-4 bg-gray-50">Total Berat</th>
            <th className="p-4 bg-gray-50">Total Karung</th>
            <th className="p-4 bg-gray-50">Status</th>
          </tr>
        </thead>
        <tbody className="text-sm divide-y divide-gray-50">
          {loading ? (
            <tr>
              <td colSpan={6} className="text-center p-12 text-gray-400">
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Memuat data dokumen pengadaan...</span>
                </div>
              </td>
            </tr>
          ) : orders.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center p-8 text-gray-400">
                Tidak ada pengajuan pada tab ini.
              </td>
            </tr>
          ) : (
            orders.map((order) => {
              const isSelected = selectedOrderId === order.id;
              const isApproved = ['APPROVED', 'SELESAI'].includes(order.status_verifikasi) || order.status_logistik !== 'NONE';
              const isRejected = ['REJECTED_DINAS', 'REJECTED_KEMENKO'].includes(order.status_verifikasi);

              const displayDetails = isSelected && selectedOrderData ? selectedOrderData : order;

              return (
                <React.Fragment key={order.id}>
                  {/* BARIS UTAMA DATA */}
                  <tr 
                    className={`cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? 'bg-emerald-50/50 font-medium hover:bg-emerald-50/70 border-l-4 border-l-emerald-600 shadow-sm' 
                        : 'hover:bg-gray-50/80'
                    }`}
                    onClick={() => onSelectOrder(order)}
                  >
                    <td className={`p-4 font-bold text-gray-900 ${isSelected ? 'pl-3' : ''}`}>
                      {order.po_number}
                    </td>
                    <td className="p-4 text-gray-500">
                      <div>{order.periode_pengadaan}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {order.created_at ? new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                      </div>
                    </td>
                    <td className="p-4 text-gray-700">{order.total_items} Jenis</td>
                    <td className="p-4 text-gray-900 font-medium">{(order.total_weight_kg / 1000).toFixed(1)} Ton</td>
                    <td className="p-4 text-gray-500">{order.total_bags_ordered} Karung</td>
                    <td className="p-4">
                      <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${
                        isApproved 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : isRejected
                            ? 'bg-red-50 text-red-700 border border-red-100'
                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {order.status_logistik !== 'NONE' ? `LOGISTIK: ${order.status_logistik}` : order.status_verifikasi.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>

                  {/* BARIS DETAIL DI BAWAHNYA DENGAN TAMPILAN MODERN */}
                  {isSelected && (
                    <tr className="bg-zinc-50/80 border-l-4 border-l-emerald-600 transition-all duration-300">
                      <td colSpan={6} className="p-4">
                        <div className="bg-white rounded-lg border border-zinc-200/80 p-5 shadow-sm space-y-4">
                          
                          {/* Info Ringkasan Koperasi */}
                          <div className="flex flex-col sm:flex-row justify-between border-b border-zinc-100 pb-4 text-xs text-zinc-600 gap-3">
                            <div className="space-y-1">
                              <span className="text-zinc-400 block font-medium uppercase tracking-wider text-[10px]">Tujuan Koperasi</span>
                              <span className="font-semibold text-zinc-800 text-sm">{displayDetails.cooperative?.name || '-'}</span>
                              <span className="text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded ml-2 font-mono">{displayDetails.cooperative?.cooperative_code || '-'}</span>
                            </div>
                            <div className="space-y-1 sm:text-right">
                              <span className="text-zinc-400 block font-medium uppercase tracking-wider text-[10px]">Total Estimasi Biaya</span>
                              <span className="text-emerald-700 font-extrabold text-base">{formatRupiah(displayDetails.total_estimated_cost)}</span>
                            </div>
                          </div>

                          {/* Detail Items Section */}
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Rincian Komoditas Pupuk</h4>
                            
                            {loadingDetail ? (
                              /* SKELETON LAODING EFFECT UNTUK DETAIL FETCHING */
                              <div className="space-y-2 py-4">
                                <div className="h-8 bg-zinc-100 animate-pulse rounded-lg w-full"></div>
                                <div className="h-12 bg-zinc-50 animate-pulse rounded-lg w-full"></div>
                                <div className="h-12 bg-zinc-50 animate-pulse rounded-lg w-full"></div>
                              </div>
                            ) : (
                              <div className="overflow-x-auto border border-zinc-100 rounded-lg">
                                <table className="w-full text-xs text-left">
                                  <thead>
                                    <tr className="border-b border-zinc-200 text-zinc-400 font-bold bg-zinc-50/70">
                                      <th className="p-3">Nama Komoditas</th>
                                      <th className="p-3 text-center">Ukuran</th>
                                      <th className="p-3 text-center">Rekomendasi AI</th>
                                      <th className="p-3 text-center">Final Karung</th>
                                      <th className="p-3 text-right">Total Berat</th>
                                      <th className="p-3 text-right">Harga / Karung</th>
                                      <th className="p-3 text-right">Subtotal</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-zinc-100 text-zinc-700">
                                    {displayDetails.items && displayDetails.items.length > 0 ? (
                                      displayDetails.items.map((item: any) => (
                                        <tr key={item.id} className="hover:bg-zinc-50/50 transition-colors">
                                          <td className="p-3 font-semibold text-zinc-900">
                                            {/* Penggabungan Image Produk secara Modern */}
                                            <div className="flex items-center gap-3">
                                              <div className="w-10 h-10 rounded-lg bg-zinc-100 border border-zinc-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                                {item.fertilizer_image ? (
                                                  <img 
                                                    src={item.fertilizer_image} 
                                                    alt={item.fertilizer_name}
                                                    className="w-full h-full object-cover"
                                                  />
                                                ) : (
                                                  // Fallback visual jika tidak ada url image dari backend
                                                  <div className="w-full h-full bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-bold text-[10px] flex items-center justify-center text-center px-0.5 leading-tight">
                                                    PUPUK
                                                  </div>
                                                )}
                                              </div>
                                              <div>
                                                <div className="font-bold text-zinc-800">{item.fertilizer_name}</div>
                                                <div className="text-[10px] text-zinc-400 mt-0.5">Subsidi Sektor Pertanian</div>
                                              </div>
                                            </div>
                                          </td>
                                          <td className="p-3 text-center text-zinc-500 font-medium">{item.packaging_size_kg} kg</td>
                                          <td className="p-3 text-center text-zinc-400 font-mono">{item.ai_suggested_bags} krg</td>
                                          <td className="p-3 text-center font-bold text-emerald-700 bg-emerald-50/30">{item.final_bags_ordered} krg</td>
                                          <td className="p-3 text-right font-medium">{(Number(item.final_weight_kg) / 1000).toFixed(2)} Ton</td>
                                          <td className="p-3 text-right text-zinc-500">{formatRupiah(item.harga_per_karung)}</td>
                                          <td className="p-3 text-right font-bold text-zinc-900">{formatRupiah(item.subtotal_price)}</td>
                                        </tr>
                                      ))
                                    ) : (
                                      <tr>
                                        <td colSpan={7} className="text-center p-6 text-zinc-400">
                                          Tidak ada item rincian pupuk ditemukan.
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>

                          {/* Catatan Rejection */}
                          {displayDetails.rejection_reason && (
                            <div className="bg-red-50 text-red-800 text-xs p-3.5 rounded-lg border border-red-100 flex items-start gap-2">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-600 mt-1.5 flex-shrink-0"></span>
                              <div>
                                <span className="font-bold">Alasan Penolakan Tim Teknis:</span> {displayDetails.rejection_reason}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}