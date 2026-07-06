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
     * PUT/PATCH /api/plants/{plant}
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
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        $plant->update($request->only(['name', 'planting_date', 'land_id']));

        return response()->json([
            'success' => true,
            'message' => 'Data varietas tanaman berhasil diperbarui.',
            'data' => $plant
        ], 200);
    }

    /**
     * DELETE /api/plants/{plant}
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