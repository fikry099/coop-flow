<?php

namespace App\Http\Controllers;

use App\Models\Fertilizer;
use App\Models\Procurement;
use App\Services\FastApiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;

class FertilizerController extends Controller implements HasMiddleware
{
    protected FastApiService $mlEngine;

    // Inject FastApiService melalui Constructor
    public function __construct(FastApiService $mlEngine)
    {
        $this->mlEngine = $mlEngine;
    }

    public static function middleware(): array
    {
        return [
            // Hanya role 'petugas-koperasi' yang bisa membuat, memperbarui, menghapus data pupuk, dan request AI
            new Middleware('role:petugas-koperasi', only: ['store', 'update', 'destroy', 'requestProcurementAI']),
        ];
    }

/**
     * Get Overview / Ringkasan Stok untuk 5 Card di UI
     */
    public function getOverview(Request $request): JsonResponse
    {
        $cooperativeId = $request->user()->cooperative_id;

        $query = Fertilizer::where('cooperative_id', $cooperativeId);

        $totalJenisPupuk = (int) $query->count();
        $totalStokKg     = (float) $query->sum('current_stock_kg');
        $nilaiPersediaan = (float) $query->sum(\DB::raw('current_stock_kg * price_per_kg'));
        $stokMenipis     = (int) $query->clone()->where('status', 'menipis')->count();
        $stokHabis       = (int) $query->clone()->where('status', 'habis')->count();

        return response()->json([
            'success' => true, 
            'message' => 'Ringkasan inventaris stok koperasi berhasil diambil.',
            'data'    => [
                'total_jenis_pupuk'   => $totalJenisPupuk,     
                'total_stok_kg'       => $totalStokKg,         
                'nilai_persediaan'    => $nilaiPersediaan,     
                'stok_menipis_jenis'  => $stokMenipis,         
                'stok_habis_jenis'    => $stokHabis,          
            ]
        ], 200);
    }

    /**
     * Display a listing of the resource (READ ALL).
     */
    public function index(Request $request): JsonResponse
    {
        $cooperativeId = $request->user()->cooperative_id;

        $fertilizers = Fertilizer::where('cooperative_id', $cooperativeId)->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar data pupuk koperasi berhasil diambil.',
            'data'    => $fertilizers
        ], 200);
    }

    /**
     * Store a newly created resource in storage (CREATE).
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name'              => 'required|string|max:255',
            'packaging_size_kg' => 'nullable|integer|min:1',
            'current_stock_kg'  => 'nullable|integer|min:0',
            'minimum_stock_kg'  => 'nullable|integer|min:0',
            'price_per_kg'      => 'required|integer|min:0',
            'image'             => 'nullable|image|mimes:jpeg,png,jpg|max:5120', 
        ]);

        $data = $request->only([
            'name', 'packaging_size_kg', 'current_stock_kg', 'minimum_stock_kg', 'price_per_kg'
        ]);

        $data['cooperative_id'] = $request->user()->cooperative_id;

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('fertilizers', 'public');
            $data['image'] = Storage::url($path);
        }

        $current = $request->input('current_stock_kg', 0);
        $min = $request->input('minimum_stock_kg', 1000);
        
        if ($current <= 0) {
            $data['status'] = 'habis';
        } elseif ($current <= $min) {
            $data['status'] = 'menipis';
        } else {
            $data['status'] = 'tersedia';
        }

        $fertilizer = Fertilizer::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Data pupuk baru berhasil ditambahkan ke koperasi.',
            'data'    => $fertilizer
        ], 201);
    }

    /**
     * Display the specified resource (READ SINGLE).
     */
    public function show(Request $request, Fertilizer $fertilizer): JsonResponse
    {
        if ($fertilizer->cooperative_id !== $request->user()->cooperative_id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke data pupuk ini.'
            ], 403);
        }

        return response()->json([
            'success' => true,
            'message' => 'Detail data pupuk berhasil ditemukan.',
            'data'    => $fertilizer->load('mutations')
        ], 200);
    }

    /**
     * Update the specified resource in storage (UPDATE).
     */
    public function update(Request $request, Fertilizer $fertilizer): JsonResponse
    {
        if ($fertilizer->cooperative_id !== $request->user()->cooperative_id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses untuk mengubah data pupuk ini.'
            ], 403);
        }

        $request->validate([
            'name'              => 'required|string|max:255',
            'packaging_size_kg' => 'nullable|integer|min:1',
            'current_stock_kg'  => 'nullable|integer|min:0',
            'minimum_stock_kg'  => 'nullable|integer|min:0',
            'price_per_kg'      => 'required|integer|min:0',
            'image'             => 'nullable|image|mimes:jpeg,png,jpg|max:5120',
        ]);

        $data = $request->only([
            'name', 'packaging_size_kg', 'current_stock_kg', 'minimum_stock_kg', 'price_per_kg'
        ]);

        if ($request->hasFile('image')) {
            if ($fertilizer->image) {
                $oldPath = str_replace('/storage/', '', $fertilizer->image);
                $storageDisk = Storage::disk('public');
                if ($storageDisk->exists($oldPath)) {
                    $storageDisk->delete($oldPath);
                }
            }
            $path = $request->file('image')->store('fertilizers', 'public');
            $data['image'] = Storage::url($path);
        }

        $current = $request->input('current_stock_kg', $fertilizer->current_stock_kg);
        $min = $request->input('minimum_stock_kg', $fertilizer->minimum_stock_kg);

        if ($current <= 0) {
            $data['status'] = 'habis';
        } elseif ($current <= $min) {
            $data['status'] = 'menipis';
        } else {
            $data['status'] = 'tersedia';
        }

        $fertilizer->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Data pupuk berhasil diperbarui.',
            'data'    => $fertilizer
        ], 200);
    }

    /**
     * Remove the specified resource from storage (DELETE).
     */
    public function destroy(Request $request, Fertilizer $fertilizer): JsonResponse
    {
        if ($fertilizer->cooperative_id !== $request->user()->cooperative_id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses untuk menghapus data pupuk ini.'
            ], 403);
        }

        if ($fertilizer->image) {
            $path = str_replace('/storage/', '', $fertilizer->image);
            $storageDisk = Storage::disk('public');
            if ($storageDisk->exists($path)) {
                $storageDisk->delete($path);
            }
        }

        $fertilizer->delete();

        return response()->json([
            'success' => true,
            'message' => 'Data pupuk berhasil dihapus dari sistem koperasi.'
        ], 200);
    }

    /**
     * Request Procurement AI (Dari InventoryController sebelumnya)
     */
    public function requestProcurementAI(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'fertilizer_id' => 'required|exists:fertilizers,id',
            'stok_tersedia_saat_ini_kg' => 'required|numeric',
            'total_prediksi_kebutuhan_petani_sebulan_ke_depan_kg' => 'required|numeric',
            'provinsi_koperasi' => 'required|string',
            'asumsi_lead_time_hari' => 'required|integer'
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $fertilizer = Fertilizer::findOrFail($request->fertilizer_id);

        // Validasi keamanan: Pastikan pupuk yang di-request AI milik koperasi user yang sedang login
        if ($fertilizer->cooperative_id !== $request->user()->cooperative_id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke data pupuk ini.'
            ], 403);
        }

        $payloadML = [
            'jenis_pupuk' => $fertilizer->name,
            'bulan' => Carbon::now()->month,
            'hari_libur_nasional' => 2,
            'stok_tersedia_saat_ini_kg' => (float)$request->stok_tersedia_saat_ini_kg,
            'total_prediksi_kebutuhan_petani_sebulan_ke_depan_kg' => (float)$request->total_prediksi_kebutuhan_petani_sebulan_ke_depan_kg,
            'provinsi_koperasi' => $request->provinsi_koperasi,
            'asumsi_lead_time_hari' => (int)$request->asumsi_lead_time_hari
        ];

        $responseAI = $this->mlEngine->predictProcurement($payloadML);

        if (!$responseAI || !isset($responseAI['suggested_procurement_kg'])) {
            return response()->json(['success' => false, 'message' => 'Gagal mendapatkan prediksi dari ML Engine'], 502);
        }

        $suggestedKg = $responseAI['suggested_procurement_kg'];
        $kemasanKg = $fertilizer->packaging_size_kg ?? 50;
        $jumlahKarung = ceil($suggestedKg / $kemasanKg); 

        $procurement = Procurement::create([
            'procurement_no' => 'PRC-' . time(),
            'cooperative_id' => $request->user()->cooperative_id ?? 1,
            'fertilizer_id'  => $fertilizer->id,
            'quantity_bags'  => $jumlahKarung,
            'quantity_kg'    => $suggestedKg,
            'status'         => 'menunggu_validasi',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Rekomendasi kuantitas pengadaan AI berhasil dihitung!',
            'data'    => $procurement
        ], 201);
    }
}