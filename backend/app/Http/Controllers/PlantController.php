<?php

namespace App\Http\Controllers;

use App\Models\Land;
use App\Models\Plant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PlantController extends Controller
{
    /**
     * POST /api/plants
     * Menyimpan banyak tanaman sekaligus ke dalam satu lahan (Form Dinamis FE)
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'land_id' => 'required|exists:lands,id',
            'plants' => 'required|array|min:1',
            'plants.*.name' => 'required|string|max:255',
            'plants.*.planting_date' => 'required|date',

            'plants.*.current_phase' => 'nullable|string|max:100',
            'plants.*.last_fertilizer_type' => 'nullable|string|max:100',
            'plants.*.last_fertilizer_amount' => 'nullable|numeric|min:0',
            'plants.*.last_phase' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        $land = Land::findOrFail($request->land_id);
        $insertedPlants = $land->plants()->createMany($request->plants);

        return response()->json([
            'success' => true,
            'message' => count($insertedPlants) . ' Varietas tanaman berhasil ditambahkan ke lahan.',
            'data' => $insertedPlants
        ], 201);
    }

    /**
     * PUT/PATCH /api/plants/{id}
     * Memperbarui data varietas tanaman tunggal (Aksi Edit Per Kartu/Row)
     */
    public function update(Request $request, $id)
    {
        $plant = Plant::find($id);

        if (!$plant) {
            return response()->json([
                'success' => false,
                'message' => 'Data tanaman tidak ditemukan.'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'planting_date' => 'required|date',
            'land_id' => 'sometimes|required|exists:lands,id',
            
            // Validasi field ML saat proses update/perubahan data tanaman
            'current_phase' => 'nullable|string|max:100',
            'last_fertilizer_type' => 'nullable|string|max:100',
            'last_fertilizer_amount' => 'nullable|numeric|min:0',
            'last_phase' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        // Ambil semua kolom yang valid untuk disimpan ke database
        $plant->update($request->only([
            'name', 
            'planting_date', 
            'land_id',
            'current_phase',
            'last_fertilizer_type',
            'last_fertilizer_amount',
            'last_phase'
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Data varietas tanaman berhasil diperbarui.',
            'data' => $plant
        ], 200);
    }

    /**
     * DELETE /api/plants/{id}
     * Menghapus varietas tanaman tertentu berdasarkan ID Tanaman (Aksi Hapus Per Kartu)
     */
    public function destroy($id)
    {
        $plant = Plant::find($id);

        if (!$plant) {
            return response()->json([
                'success' => false,
                'message' => 'Data tanaman tidak ditemukan.'
            ], 404);
        }

        $plant->delete();

        return response()->json([
            'success' => true,
            'message' => 'Varietas tanaman berhasil dihapus dari catatan lahan.'
        ], 200);
    }
}