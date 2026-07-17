<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cooperative;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class CooperativeRegistrationController extends Controller
{
    /**
     * 1. API REGISTRASI MANDIRI (Akses: Publik / Calon Koperasi)
     */
    public function register(Request $request)
{
    // 1. Validasi Input (Disederhanakan: Hanya wajibkan data utama)
    $validator = Validator::make($request->all(), [
        'cooperative_name'    => 'required|string|max:255',
        'cooperative_code'    => 'required|string|max:50|unique:cooperatives,cooperative_code',
        'nik_cooperative'     => 'required|string|unique:cooperatives,nik_cooperative',
        'npwp'                => 'required|string|max:25',
        'legal_entity_type'   => 'required|string',
        'legal_entity_number' => 'required|string',
        'established_date'    => 'required|date',
        'address_cooperative' => 'required|string',
        'email_cooperative'   => 'required|email',
        'phone_cooperative'   => 'required|string',
        'province'            => 'required|string',
        'city_koor'           => 'required|string',
        'district'            => 'required|string',
        'village'             => 'required|string',
        'postal_code'         => 'required|string',
        'capacity_ton'        => 'required|numeric', // Kapasitas gudang dari inputan user
        'password'            => 'required|string|min:8',
    ]);

    if ($validator->fails()) {
        return response()->json($validator->errors(), 422);
    }

    DB::beginTransaction();

    try {
        // 2. Simpan Identitas Koperasi & Data Gudang
        $cooperative = Cooperative::create([
            'name'                 => $request->cooperative_name,
            'cooperative_code'     => $request->cooperative_code,
            'nik_cooperative'      => $request->nik_cooperative,
            'npwp'                 => $request->npwp,
            'legal_entity_type'    => $request->legal_entity_type,
            'legal_entity_number'  => $request->legal_entity_number,
            'established_date'     => $request->established_date,
            'address'              => $request->address_cooperative,
            'email_cooperative'    => $request->email_cooperative,
            'phone_cooperative'    => $request->phone_cooperative,
            'postal_code'          => $request->postal_code,
            'province'             => $request->province,
            'city_koor'            => $request->city_koor,
            'district'             => $request->district,
            'village'              => $request->village,
            
            // Tambahkan field gudang yang baru di model Cooperative:
            'warehouse_capacity_ton' => $request->capacity_ton,
            'warehouse_surface_area' => 0, // Nilai default jika belum ada input
            
            'is_activated'         => false,
            'is_profile_completed' => true,
        ]);

        // 4. Auto-fill Akun Pengurus Utama
        $user = User::create([
            'name'           => $request->cooperative_name . ' Admin',
            'email'          => $request->email_cooperative, // Email otomatis sama
            'password'       => Hash::make($request->password),
            'phone'          => $request->phone_cooperative, // Phone otomatis sama
            'cooperative_id' => $cooperative->id,
            'status'         => 'PENDING'
        ]);

        $user->assignRole('petugas-koperasi');
        
        DB::commit();

        return response()->json([
            'success' => true,
            'message' => 'Pendaftaran Koperasi sukses diajukan!'
        ], 201);

    } catch (\Exception $e) {
        DB::rollBack();
        return response()->json([
            'success' => false,
            'message' => 'Gagal memproses pendaftaran.',
            'error'   => $e->getMessage()
        ], 500);
    }
    }

    /**
     * 2. API DAFTAR ANTRIAN PENDING (Akses: Kemenko Pangan)
     */
    public function getPendingRegistrations()
    {
        // Mengambil data user pending beserta relasi koperasi dan gudangnya
        $pendingKoperasi = User::role('petugas-koperasi')
        ->where('status', 'PENDING')
        ->with('cooperative')
        ->get();

        return response()->json([
        'success' => true,
        'data' => $pendingKoperasi
    ], 200);
    }

    /**
     * 3. API SETUJUI / AKTIFKAN KOPERASI (Akses: Kemenko Pangan)
     */
    public function approve($userId)
    {
        $user = User::with('cooperative')->find($userId);

        if (!$user) {
            return response()->json(['message' => 'Data pengajuan tidak ditemukan.'], 404);
        }

        DB::transaction(function () use ($user) {
            // Aktifkan User Admin
            $user->update(['status' => 'ACTIVE']);
            
            // Aktifkan Induk Koperasi terkait
            if ($user->cooperative) {
                $user->cooperative->update(['is_activated' => true]);
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Akun dan data induk Koperasi sukses diaktifkan!'
        ], 200);
    }

    /**
     * 4. API TOLAK PENDAFTARAN (Akses: Kemenko Pangan)
     */
    public function reject(Request $request, $userId)
    {
        $request->validate([
            'rejection_reason' => 'required|string'
        ]);

        $user = User::find($userId);

        if (!$user) {
            return response()->json(['message' => 'Data pengajuan tidak ditemukan.'], 404);
        }

        $user->update([
            'status'           => 'REJECTED',
            'rejection_reason' => $request->rejection_reason
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pengajuan pendaftaran Koperasi resmi ditolak.'
        ], 200);
    }

    // Tambahkan method ini di dalam CooperativeRegistrationController

public function getActiveRegistrations()
{
    try {
        // Ambil data user admin koperasi yang statusnya sudah ACTIVE
        // Sertakan relasi 'cooperative' agar data provinsi/kota terbaca di frontend
        $activeRegistrations = User::where('status', 'ACTIVE')
            ->with('cooperative') 
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Berhasil mengambil data koperasi aktif',
            'data' => $activeRegistrations
        ], 200);

    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Gagal mengambil data: ' . $e->getMessage()
        ], 500);
    }
}
}