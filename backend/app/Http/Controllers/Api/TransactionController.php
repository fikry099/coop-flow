<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\Fertilizer;
use App\Models\Farmer;
use App\Models\InventoryMutation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class TransactionController extends Controller
{
    /**
     * Tampilkan daftar transaksi (dengan filter opsional & pagination).
     */
    public function index(Request $request)
    {
        try {
            $query = Transaction::with(['farmer', 'items.fertilizer', 'mlLogs']);

            if ($request->has('farmer_id')) {
                $query->where('farmer_id', $request->farmer_id);
            }

            $transactions = $query->latest()->paginate($request->get('per_page', 10));

            return response()->json([
                'success' => true,
                'message' => 'Daftar transaksi berhasil diambil.',
                'data' => $transactions
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data transaksi.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Tampilkan detail satu transaksi berdasarkan ID.
     */
    public function show($id)
    {
        try {
            $transaction = Transaction::with(['farmer', 'items.fertilizer', 'mlLogs'])
                ->find($id);

            if (!$transaction) {
                return response()->json([
                    'success' => false,
                    'message' => 'Transaksi tidak ditemukan.'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Detail transaksi berhasil diambil.',
                'data' => $transaction
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil detail transaksi.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Simpan transaksi baru (POST).
     * Sekaligus: kurangi current_stock_kg pupuk & catat mutasi "keluar".
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'farmer_id' => 'required|exists:users,id',
            'payment_method' => 'required|string',
            'grand_total' => 'required|numeric|min:0',
            'amount_paid' => 'required|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.fertilizer_id' => 'required|exists:fertilizers,id',
            'items.*.actual_purchased_kg' => 'required|numeric|min:0',
            'items.*.price_per_kg' => 'required|numeric|min:0',
            'items.*.subtotal' => 'required|numeric|min:0',
            'items.*.original_recommended_kg' => 'required|numeric|min:0',

            'items.*.land_id' => 'required|exists:lands,id',
            'items.*.analysis_meta_snapshot.luas_lahan_hektar' => 'required|numeric|min:0',
            'items.*.analysis_meta_snapshot.jenis_komoditas' => 'required|string',
            'items.*.analysis_meta_snapshot.fase_tanam_saat_ini' => 'required|string',
            'items.*.analysis_meta_snapshot.suhu_rata_rata_celcius' => 'required|numeric',
            'items.*.analysis_meta_snapshot.kelembapan_persen' => 'required|integer|between:0,100',
            'items.*.analysis_meta_snapshot.curah_hujan_mm' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $transactionResult = DB::transaction(function () use ($request) {

                // A. Generate Kode Transaksi & Invoice Unik
                $transactionCode = 'GAF-' . date('ymd') . '-' . rand(1000, 9999);
                $invoiceNumber = 'INV-' . date('ymd') . '-' . rand(1000, 9999);

                // B. Simpan Transaksi Utama (Finansial)
                $transaction = Transaction::create([
                    'transaction_code' => $transactionCode,
                    'invoice_number' => $invoiceNumber,
                    'farmer_id' => $request->farmer_id,
                    'payment_method' => $request->payment_method,
                    'grand_total' => $request->grand_total,
                    'amount_paid' => $request->amount_paid,
                    'status' => 'success',
                ]);

                // C. Cari profil Farmer dari user_id, untuk relasi opsional di InventoryMutation.
                //    Sama untuk semua item, jadi cukup di-lookup sekali di luar loop.
                $farmerProfileId = Farmer::where('user_id', $request->farmer_id)->value('id');

                // D. Iterasi item pembelian
                foreach ($request->items as $item) {

                    // Lock row pupuk ini supaya aman dari race condition kalau ada
                    // 2 transaksi barengan untuk fertilizer_id yang sama.
                    $fertilizer = Fertilizer::where('id', $item['fertilizer_id'])
                        ->lockForUpdate()
                        ->first();

                    if (!$fertilizer) {
                        throw new \Exception("Pupuk dengan ID {$item['fertilizer_id']} tidak ditemukan.");
                    }

                    if ($fertilizer->current_stock_kg < $item['actual_purchased_kg']) {
                        throw new \Exception(
                            "Stok {$fertilizer->name} tidak mencukupi. " .
                            "Sisa stok: {$fertilizer->current_stock_kg} kg, " .
                            "diminta: {$item['actual_purchased_kg']} kg."
                        );
                    }

                    // Simpan Detail Pembelian
                    $transaction->items()->create([
                        'fertilizer_id' => $item['fertilizer_id'],
                        'actual_purchased_kg' => $item['actual_purchased_kg'],
                        'price_per_kg' => $item['price_per_kg'],
                        'subtotal' => $item['subtotal'],
                    ]);

                    // Kurangi stok pupuk
                    $fertilizer->decrement('current_stock_kg', $item['actual_purchased_kg']);

                    // Catat mutasi stok keluar
                    InventoryMutation::create([
                        'fertilizer_id' => $item['fertilizer_id'],
                        'farmer_id'     => $farmerProfileId, // farmers.id, bukan users.id
                        'type'          => 'keluar',
                        'quantity_kg'   => round($item['actual_purchased_kg']),
                        'description'   => "Penyaluran transaksi {$transactionCode}",
                    ]);

                    // Simpan Log Snapshot ke Tabel ML
                    $meta = $item['analysis_meta_snapshot'];

                    $transaction->mlLogs()->create([
                        'land_id' => $item['land_id'],
                        'fertilizer_id' => $item['fertilizer_id'],
                        'luas_lahan_hektar' => $meta['luas_lahan_hektar'],
                        'jenis_komoditas' => $meta['jenis_komoditas'],
                        'fase_tanam_saat_ini' => $meta['fase_tanam_saat_ini'],
                        'suhu_rata_rata_celcius' => $meta['suhu_rata_rata_celcius'],
                        'kelembapan_persen' => $meta['kelembapan_persen'],
                        'curah_hujan_mm' => $meta['curah_hujan_mm'],
                        'original_recommended_kg' => $item['original_recommended_kg'],
                        'actual_purchased_kg' => $item['actual_purchased_kg'],
                    ]);
                }

                return $transaction->load(['items.fertilizer', 'mlLogs']);
            });

            return response()->json([
                'success' => true,
                'message' => 'Transaksi berhasil diproses, stok telah diperbarui, dan dicatatkan ke log ML!',
                'data' => $transactionResult
            ], 201);

        } catch (\Exception $e) {
            $isStockError = str_contains($e->getMessage(), 'Stok') || str_contains($e->getMessage(), 'tidak ditemukan');

            return response()->json([
                'success' => false,
                'message' => $isStockError ? $e->getMessage() : 'Terjadi kesalahan sistem, transaksi dibatalkan.',
                'error' => $e->getMessage()
            ], $isStockError ? 422 : 500);
        }
    }
}