<?php

namespace App\Http\Controllers;

use App\Models\ProcurementOrder;
use App\Models\ProcurementOrderItem;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProcurementOrderController extends Controller
{
    // Konstanta Kecepatan Moda Transportasi
    const TRUCK_SPEED_KMH = 45;      
    const VESSEL_SPEED_KMH = 18;      
    const MAX_DRIVING_HOURS_PER_DAY = 8;
    const DRIVER_REST_DURATION_HOURS = 9; 
    const PORT_BUFFER_HOURS = 6;      



/**
     * MENAMPILKAN SEMUA DATA PO (INDEX)
     * Otomatis memfilter data berdasarkan peran user yang sedang login
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Menggunakan 'province' dan 'city_koor' sesuai skema tabel cooperatives Anda
        $query = ProcurementOrder::with(['cooperative:id,name,province,city_koor']);

        /**
         * KONTROL AKSES OTOMATIS BERDASARKAN ROLE USER
         * 1. Jika Petugas Koperasi: Hanya melihat PO miliknya sendiri
         * 2. Jika Dinas Pertanian: Melihat PO dari koperasi yang kota/kabupatennya cocok
         * 3. Jika Kemenko: Hanya melihat PO yang sudah lolos validasi Dinas Pertanian
         */
        if ($user->hasRole('petugas-koperasi') || isset($user->cooperative_id)) {
            $query->where('cooperative_id', $user->cooperative_id);
        } elseif ($user->hasRole('dinas-pertanian')) {
            $query->whereHas('cooperative', function ($q) use ($user) {
                // PERBAIKAN: Menggunakan $user->city_code sesuai dengan tabel users yang baru
                $q->whereRaw('LOWER(city_koor) = ?', [strtolower($user->city_code)]);
            });
        } elseif ($user->hasRole('kemenko')) {
            $query->whereIn('status_verifikasi', [
                'PENDING_KEMENKO',
                'APPROVED',
                'REJECTED_KEMENKO',
            ]);
        }

        // Urutkan berdasarkan PO terbaru yang diajukan
        $orders = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar pengadaan pupuk bersubsidi berhasil diambil.',
            'data' => $orders
        ], 200);
    }

    /**
     * MENAMPILKAN DETAIL DATA PO TERTENTU (SHOW)
     * Mengambil struktur dokumen induk lengkap beserta seluruh rincian item pupuknya
     */
    public function show(Request $request, $id): JsonResponse
    {
        $user = $request->user();

        // Mengambil data PO beserta koperasi dan seluruh daftar item detailnya
        $order = ProcurementOrder::with([
            'cooperative', 
            'items.fertilizer' // Mengambil detail pupuk per item jika dibutuhkan gambarnya
        ])->find($id);

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Dokumen pengadaan (PO) tidak ditemukan.'
            ], 404);
        }

        // Proteksi Tambahan: Memastikan Koperasi tidak bisa mengintip PO milik Koperasi lain
        if (($user->hasRole('petugas-koperasi') || isset($user->cooperative_id)) && $order->cooperative_id !== $user->cooperative_id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki hak akses untuk melihat dokumen PO ini.'
            ], 403);
        }

        return response()->json([
            'success' => true,
            'message' => 'Detail dokumen pengadaan berhasil dimuat.',
            'data' => $order
        ], 200);
    }

    /**
     * STAGE 1: SUBMIT OLEH KOPERASI KDMP
     * Mengunci rekomendasi AI dari DRAFT menjadi PROCESSED saat PO dibuat
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'periode_pengadaan' => 'required|string',
            'items' => 'required|array|min:1',
            'items.*.fertilizer_id' => 'required|exists:fertilizers,id',
            'items.*.fertilizer_name' => 'required|string',
            'items.*.final_bags_ordered' => 'required|integer|min:0',
            'items.*.packaging_size_kg' => 'required|integer',
            'items.*.price_per_kg' => 'required|numeric',
            'items.*.harga_per_karung' => 'required|numeric',
        ]);

        $user = $request->user();
        $cooperativeId = $user->cooperative_id;

        $filteredItems = array_filter($request->items, function ($item) {
            return $item['final_bags_ordered'] > 0;
        });

        if (empty($filteredItems)) {
            return response()->json([
                'success' => false, 
                'message' => 'Gagal memproses, minimal harus ada 1 pupuk dengan jumlah karung lebih dari 0.'
            ], 422);
        }

        DB::beginTransaction();
        try {
            $poNumber = 'PO-' . now()->format('Ymd') . '-' . strtoupper(Str::random(5));

            // 1. Buat Induk Dokumen PO
            $order = ProcurementOrder::create([
                'cooperative_id' => $cooperativeId,
                'po_number' => $poNumber,
                'periode_pengadaan' => $request->periode_pengadaan,
                'status_verifikasi' => 'PENDING_DINAS', 
                'status_logistik' => 'NONE',
            ]);

            $totalBags = 0;
            $totalKg = 0;
            $totalCost = 0;
            $itemCount = 0;

            // Proses semua item kiriman request untuk memperbarui status ai_predictions secara adil
            foreach ($request->items as $item) {
                
                if ($item['final_bags_ordered'] > 0) {
                    $itemWeight = $item['final_bags_ordered'] * $item['packaging_size_kg'];
                    $itemSubtotal = $item['final_bags_ordered'] * $item['harga_per_karung'];

                    // 2. Buat Item Detail PO (hanya yang dipesan)
                    ProcurementOrderItem::create([
                        'procurement_order_id' => $order->id,
                        'fertilizer_id' => $item['fertilizer_id'],
                        'fertilizer_name' => $item['fertilizer_name'],
                        'ai_suggested_bags' => $item['ai_suggested_bags'] ?? 0,
                        'ai_suggested_kg' => $item['ai_suggested_kg'] ?? 0,
                        'final_bags_ordered' => $item['final_bags_ordered'],
                        'final_weight_kg' => $itemWeight,
                        'packaging_size_kg' => $item['packaging_size_kg'],
                        'price_per_kg' => $item['price_per_kg'],
                        'harga_per_karung' => $item['harga_per_karung'],
                        'subtotal_price' => $itemSubtotal,
                    ]);

                    $totalBags += $item['final_bags_ordered'];
                    $totalKg += $itemWeight;
                    $totalCost += $itemSubtotal;
                    $itemCount++;

                    // SINKRONISASI AI: Kunci status menjadi PROCESSED karena dibeli
                    DB::table('ai_predictions')
                        ->where('cooperative_id', $cooperativeId)
                        ->where('fertilizer_id', $item['fertilizer_id'])
                        ->where('status_saran', 'DRAFT')
                        ->update([
                            'status_saran' => 'PROCESSED',
                            'updated_at' => now()
                        ]);
                } else {
                    // SINKRONISASI AI: Ubah ke SKIPPED karena diabaikan/tidak dipesan oleh koperasi pada periode ini
                    DB::table('ai_predictions')
                        ->where('cooperative_id', $cooperativeId)
                        ->where('fertilizer_id', $item['fertilizer_id'])
                        ->where('status_saran', 'DRAFT')
                        ->update([
                            'status_saran' => 'SKIPPED', 
                            'updated_at' => now()
                        ]);
                }
            }

            // 3. Update nilai agregat pada tabel induk PO
            $order->update([
                'total_items' => $itemCount,
                'total_bags_ordered' => $totalBags,
                'total_weight_kg' => $totalKg,
                'total_estimated_cost' => $totalCost,
            ]);

            DB::commit();
            return response()->json(['success' => true, 'message' => 'Pengadaan pupuk berhasil diajukan ke Dinas Pertanian & Rekomendasi AI berhasil disinkronkan.', 'data' => $order], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Terjadi kesalahan internal: ' . $e->getMessage()], 500);
        }
    }

    /**
     * STAGE 2: VERIFIKASI OLEH DINAS PERTANIAN KABUPATEN
     */
    public function verifyByDinas(Request $request, $id): JsonResponse
    {
        $request->validate([
            'action' => 'required|in:APPROVE,REJECT',
            'rejection_reason' => 'required_if:action,REJECT|string|nullable',
            'notes' => 'string|nullable'
        ]);

        $order = ProcurementOrder::findOrFail($id);

        if ($request->action === 'APPROVE') {
            $order->update([
                'status_verifikasi' => 'PENDING_KEMENKO',
                'notes_from_verifier' => $request->notes
            ]);
            $msg = 'Dokumen disetujui Dinas Pertanian & diteruskan ke Kemenko.';
        } else {
            $order->update([
                'status_verifikasi' => 'REJECTED_DINAS',
                'rejection_reason' => $request->rejection_reason
            ]);
            $msg = 'Dokumen pengadaan ditolak oleh Dinas Pertanian.';
        }

        return response()->json(['success' => true, 'message' => $msg]);
    }

    /**
     * STAGE 3A: PERSETUJUAN DOKUMEN / KUOTA OLEH KEMENKO
     */
    public function approveByKemenko(Request $request, $id): JsonResponse
    {
        $request->validate([
            'action' => 'required|in:APPROVE,REJECT',
            'rejection_reason' => 'required_if:action,REJECT|string|nullable',
            'notes' => 'string|nullable'
        ]);

        $order = ProcurementOrder::findOrFail($id);

        if ($order->status_verifikasi !== 'PENDING_KEMENKO') {
            return response()->json(['success' => false, 'message' => 'Status dokumen tidak valid untuk verifikasi Kemenko.'], 400);
        }

        if ($request->action === 'REJECT') {
            $order->update([
                'status_verifikasi' => 'REJECTED_KEMENKO',
                'rejection_reason' => $request->rejection_reason
            ]);
            return response()->json(['success' => true, 'message' => 'Dokumen pengadaan resmi ditolak oleh Kemenko.']);
        }

        $order->update([
            'status_verifikasi' => 'APPROVED',
            'status_logistik' => 'NONE',
            'notes_from_verifier' => $request->notes
        ]);

        return response()->json([
            'success' => true, 
            'message' => 'Dokumen disetujui Kemenko. Alokasi kuota dikunci dan diteruskan ke PT Pupuk Indonesia untuk persiapan logistik.'
        ]);
    }

    /**
     * STAGE 3B: RILIS PENGIRIMAN LOGISTIK OLEH KEMENKO (Integrasi Rantai Pasok Maritim & Hambatan Riil)
     */
    public function dispatchShipmentByKemenko($id): JsonResponse
    {
        $order = ProcurementOrder::with('cooperative')->findOrFail($id);

        if ($order->status_verifikasi !== 'APPROVED' || $order->status_logistik !== 'NONE') {
            return response()->json(['success' => false, 'message' => 'Logistik tidak dapat dirilis.'], 400);
        }

        $destLat = (float) $order->cooperative->latitude;
        $destLng = (float) $order->cooperative->longitude;

        $distanceKm = $this->calculateHaversineDistance(
            (float)$order->origin_lat, (float)$order->origin_lng, 
            $destLat, $destLng
        );

        $jawaProvinceIds = [31, 32, 33, 34, 35, 36]; 
        $cooperativeProvinceId = (int) $order->cooperative->province_id;

        $isCrossIsland = !in_array($cooperativeProvinceId, $jawaProvinceIds);

        $travelHours = 0;
        $logistikNotes = [];

        if ($isCrossIsland) {
            $landDistance = $distanceKm * 0.7;
            $seaDistance = $distanceKm * 0.3;

            $truckDrivingHours = $landDistance / self::TRUCK_SPEED_KMH;
            $vesselSailingHours = $seaDistance / self::VESSEL_SPEED_KMH;
            $portHurdle = self::PORT_BUFFER_HOURS; 

            $travelHours = $truckDrivingHours + $vesselSailingHours + $portHurdle;

            $logistikNotes[] = "Rute Lintas Pulau terdeteksi.";
            $logistikNotes[] = "Estimasi Darat: " . round($landDistance, 1) . " Km via Truk.";
            $logistikNotes[] = "Estimasi Laut: " . round($seaDistance, 1) . " Km via Kapal Laut.";
            $logistikNotes[] = "Hambatan Pelabuhan (Antrean & Bongkar Muat): +" . self::PORT_BUFFER_HOURS . " Jam.";
        } else {
            $truckDrivingHours = $distanceKm / self::TRUCK_SPEED_KMH;
            $travelHours = $truckDrivingHours;
            $logistikNotes[] = "Rute Intra-Pulau (Darat). Jarak Tempuh: " . round($distanceKm, 1) . " Km.";
        }

        $drivingDaysCount = floor($travelHours / self::MAX_DRIVING_HOURS_PER_DAY);
        if ($drivingDaysCount > 0) {
            $totalRestHours = $drivingDaysCount * self::DRIVER_REST_DURATION_HOURS;
            $travelHours += $totalRestHours;
            $logistikNotes[] = "Regulasi K3 Supir: Perjalanan jauh membutuhkan " . $drivingDaysCount . "x istirahat malam (Total +" . $totalRestHours . " Jam).";
        }

        $shortBreaksCount = floor($travelHours / 4);
        if ($shortBreaksCount > 0) {
            $travelHours += ($shortBreaksCount * 1.5);
            $logistikNotes[] = "Kombinasi Jetlag & Istirahat Pendek (Makan/Ibadah): +" . ($shortBreaksCount * 1.5) . " Jam.";
        }

        $estimatedHours = (int) ceil($travelHours);

        $order->update([
            'status_logistik' => 'PROD_LINI_1_2', 
            'destination_lat' => $destLat,
            'destination_lng' => $destLng,
            'gis_distance_km' => round($distanceKm, 2),
            'estimated_travel_hours' => $estimatedHours,
            'dispatched_at' => now(),
            'notes_from_verifier' => implode(" | ", $logistikNotes)
        ]);

        return response()->json([
            'success' => true, 
            'message' => 'Armada logistik resmi dirilis dari pusat. Perhitungan komprehensif logistik aktif.',
            'gis_info' => [
                'jarak_riil' => round($distanceKm, 2) . ' Km',
                'estimasi_waktu_realistis' => $estimatedHours . ' Jam',
                'lintas_pulau' => $isCrossIsland ? 'Ya (Kombinasi Multimoda Laut/Darat)' : 'Tidak (Jalur Darat Kontinu)',
                'log_simulasi' => $logistikNotes
            ]
        ]);
    }

    /**
     * STAGE 4: DINAS PERTANIAN KLIK SAAT PUPUK TIBA DI KABUPATEN
     */
    public function updateToLiniTiga($id): JsonResponse
    {
        $order = ProcurementOrder::findOrFail($id);
        
        $order->update([
            'status_logistik' => 'GUDANG_LINI_3',
            'dinas_received_at' => now()
        ]);

        return response()->json(['success' => true, 'message' => 'Dinas mengonfirmasi pupuk telah tiba di Lini 3 Kabupaten & siap dirilis jatah tebusnya.']);
    }

    public function releaseToLiniEmpat($id): JsonResponse
    {
        $order = ProcurementOrder::findOrFail($id);
        
        $order->update([
            'status_logistik' => 'SIAP_TEBUS_LINI_4'
        ]);

        return response()->json(['success' => true, 'message' => 'Kuota resmi dilepas Dinas. Koperasi sekarang dapat menebus pupuk bersubsidi ini.']);
    }

    /**
     * STAGE 5: KOPERASI KLIK SAAT FISIK PUPUK SUDAH BONGKAR DI GUDANG KDMP
     */
    public function completeOrder($id): JsonResponse
    {
        $order = ProcurementOrder::findOrFail($id);

        $order->update([
            'status_logistik' => 'SELESAI',
            'completed_at' => now()
        ]);
        
        return response()->json(['success' => true, 'message' => 'Selesai! Stok pupuk resmi diterima fisik & ditambahkan ke sistem gudang Koperasi.']);
    }

    /**
     * UTILITY: Rumus Haversine GIS
     */
    private function calculateHaversineDistance($lat1, $lon1, $lat2, $lon2): float
    {
        $earthRadius = 6371; 

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        
        return $earthRadius * $c;
    }
}