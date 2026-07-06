<?php

namespace App\Http\Controllers;

use App\Models\Farmer;
use App\Models\User;
use App\Models\Land;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class FarmerController extends Controller
{
    public function index()
    {
        // DIUBAH: Menggunakan 'lands.plants' agar data tanaman ikut terbawa saat get list
        $farmers = Farmer::with(['user', 'farmer_group', 'lands.plants'])->latest()->get();

        return response()->json([
            'success' => true,
            'data' => $farmers
        ], 200);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            // Validasi Akun User
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'phone' => 'nullable|string|unique:users',
            'address' => 'nullable|string',
            
            // Validasi Kelompok Tani & Profil
            'farmer_group_id' => 'required|integer|exists:farmer_groups,id',
            'nik' => 'nullable|string|size:16|unique:farmers',
            'notes' => 'nullable|string',
            
            // Validasi Array Lahan
            'lands' => 'required|array|min:1',
            'lands.*.land_name' => 'required|string|max:255',
            'lands.*.area' => 'nullable|numeric|min:0',
            'lands.*.location_address' => 'nullable|string',
            'lands.*.polygon_coordinates' => 'nullable|array',
        ], [
            'lands.required' => 'Petani wajib memiliki minimal 1 data lahan.',
            'lands.*.land_name.required' => 'Nama lahan tidak boleh kosong.',
            'farmer_group_id.exists' => 'Kelompok tani yang dipilih tidak valid.'
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        DB::beginTransaction();

        try {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'phone' => $request->phone,
                'address' => $request->address,
            ]);

            $user->assignRole('petani');

            $totalLandArea = collect($request->lands)->sum(function ($land) {
                return $land['area'] ?? 0;
            });

            $farmer = Farmer::create([
                'user_id' => $user->id,
                'farmer_group_id' => $request->farmer_group_id, 
                'nik' => $request->nik,
                'total_land_area' => $totalLandArea, 
                'notes' => $request->notes,
            ]);

            foreach ($request->lands as $landData) {
                $farmer->lands()->create([
                    'land_name' => $landData['land_name'],
                    'area' => $landData['area'] ?? 0,
                    'location_address' => $landData['location_address'] ?? null,
                    'polygon_coordinates' => $landData['polygon_coordinates'] ?? null,
                ]);
            }

            DB::commit();
 
            return response()->json([
                'success' => true,
                'message' => 'Data master petani berhasil didaftarkan!',
                // DIUBAH: Menambahkan 'lands.plants' pada output load data baru
                'data' => $farmer->load(['user', 'farmer_group', 'lands.plants'])
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan data ke server.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        // DIUBAH: Menambahkan 'lands.plants' agar saat detail dibuka data tanaman muncul
        $farmer = Farmer::with(['user', 'farmer_group', 'lands.plants'])->find($id);

        if (!$farmer) {
            return response()->json(['message' => 'Petani tidak ditemukan'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $farmer
        ], 200);
    }

    public function update(Request $request, $id)
    {
        $farmer = Farmer::find($id);
        if (!$farmer) {
            return response()->json(['message' => 'Petani tidak ditemukan'], 404);
        }

        $user = $farmer->user;

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|unique:users,phone,' . $user->id,
            'address' => 'nullable|string',
            
            'farmer_group_id' => 'required|integer|exists:farmer_groups,id',
            'nik' => 'nullable|string|size:16|unique:farmers,nik,' . $farmer->id,
            'notes' => 'nullable|string',
            
            'lands' => 'required|array|min:1',
            'lands.*.id' => 'nullable|integer', 
            'lands.*.land_name' => 'required|string|max:255',
            'lands.*.area' => 'required|numeric|min:0',
            'lands.*.location_address' => 'nullable|string',
            'lands.*.polygon_coordinates' => 'nullable|array', 
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        DB::beginTransaction();

        try {
            $user->update([
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'address' => $request->address,
            ]);

            $keepLandIds = [];

            foreach ($request->lands as $landData) {
                $land = $farmer->lands()->updateOrCreate(
                    ['id' => $landData['id'] ?? null],
                    [
                        'land_name' => $landData['land_name'],
                        'area' => $landData['area'],
                        'location_address' => $landData['location_address'] ?? null,
                        'polygon_coordinates' => $landData['polygon_coordinates'] ?? null, 
                    ]
                );
                
                $keepLandIds[] = $land->id;
            }

            // $farmer->lands()->whereNotIn('id', $keepLandIds)->delete();

            $totalLandArea = collect($request->lands)->sum('area');

            $farmer->update([
                'farmer_group_id' => $request->farmer_group_id,
                'nik' => $request->nik,
                'total_land_area' => $totalLandArea,
                'notes' => $request->notes,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Data profil petani dan hasil mapping lahan berhasil diperbarui tanpa kehilangan data!',
                // DIUBAH: Menambahkan 'lands.plants' setelah update berhasil
                'data' => $farmer->load(['user', 'farmer_group', 'lands.plants'])
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui data hasil mapping.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        $farmer = Farmer::find($id);
        if (!$farmer) {
            return response()->json(['message' => 'Petani tidak ditemukan'], 404);
        }

        DB::beginTransaction();

        try {
            $user = User::find($farmer->user_id);
            $farmer->lands()->delete();
            $farmer->delete();
            if ($user) {
                $user->delete();
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Data master petani beserta akun user dan seluruh aset lahannya berhasil dihapus.'
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus data petani secara bersih.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}