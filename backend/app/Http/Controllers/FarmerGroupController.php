<?php

namespace App\Http\Controllers;

use App\Models\FarmerGroup;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class FarmerGroupController extends Controller
{
    /**
     * Menampilkan daftar semua kelompok tani.
     */
    public function index()
    {
        // Mengambil semua kelompok tani dan menghitung jumlah anggotanya (opsional tapi berguna)
        $groups = FarmerGroup::withCount('farmers')->latest()->get();

        return response()->json([
            'success' => true,
            'data' => $groups
        ], 200);
    }

    /**
     * Menyimpan kelompok tani baru ke database.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:farmer_groups,name',
            'description' => 'nullable|string',
        ], [
            'name.required' => 'Nama kelompok tani wajib diisi.',
            'name.unique' => 'Nama kelompok tani ini sudah terdaftar.',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $group = FarmerGroup::create([
            'name' => $request->name,
            'description' => $request->description,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Kelompok tani berhasil ditambahkan!',
            'data' => $group
        ], 201);
    }

    /**
     * Menampilkan detail satu kelompok tani beserta daftar anggotanya (petani).
     */
    public function show($id)
    {
        // Mengambil kelompok tani beserta relasi user di dalam data petani
        $group = FarmerGroup::with(['farmers.user', 'farmers.lands'])->find($id);

        if (!$group) {
            return response()->json(['message' => 'Kelompok tani tidak ditemukan.'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $group
        ], 200);
    }

    /**
     * Memperbarui data kelompok tani tertentu.
     */
    public function update(Request $request, $id)
    {
        $group = FarmerGroup::find($id);

        if (!$group) {
            return response()->json(['message' => 'Kelompok tani tidak ditemukan.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:farmer_groups,name,' . $group->id,
            'description' => 'nullable|string',
        ], [
            'name.required' => 'Nama kelompok tani wajib diisi.',
            'name.unique' => 'Nama kelompok tani ini sudah digunakan.',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $group->update([
            'name' => $request->name,
            'description' => $request->description,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Kelompok tani berhasil diperbarui!',
            'data' => $group
        ], 200);
    }

    /**
     * Menghapus kelompok tani.
     */
    public function destroy($id)
    {
        $group = FarmerGroup::find($id);

        if (!$group) {
            return response()->json(['message' => 'Kelompok tani tidak ditemukan.'], 404);
        }

        // Karena di migration kita pakai onDelete('set null'),
        // maka jika kelompok tani ini dihapus, field 'farmer_group_id' di petani akan otomatis menjadi null (aman).
        $group->delete();

        return response()->json([
            'success' => true,
            'message' => 'Kelompok tani berhasil dihapus.'
        ], 200);
    }
}