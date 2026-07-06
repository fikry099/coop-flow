'use client';

import React, { useState } from 'react';
import { FaPlus, FaBoxOpen } from 'react-icons/fa';
import { Farmer, Plant, Land } from '@/app/dashboard/admin-lapangan/data-tanaman/page'; 
import AddPlantForm from './AddPlantForm';
import PlantCard from './PlantCard';

interface FarmerPlantDetailProps {
  selectedFarmer: Farmer | null;
  isAdding: boolean;
  setIsAdding: (value: boolean) => void;
  onSavePlant: (newData: { land_id: number; plants: { name: string; planting_date: string }[] }) => void;
  onDeletePlant: (plantId: string | number) => void;
  onDeleteAllPlantsInLand?: (landId: number, plantIds: (string | number)[]) => void; // Tambahan fungsi hapus massal
  onUpdatePlant?: (plantId: string | number, updatedData: { name: string; planting_date: string; land_id: number }) => void;
}

export default function FarmerPlantDetail({
  selectedFarmer,
  isAdding,
  setIsAdding,
  onSavePlant,
  onDeletePlant,
  onDeleteAllPlantsInLand,
  onUpdatePlant,
}: FarmerPlantDetailProps) {
  
  const [editingPlant, setEditingPlant] = useState<(Plant & { land_id: number }) | null>(null);

  if (!selectedFarmer) {
    return (
      <div className="bg-white border border-dashed border-zinc-200 rounded-3xl p-12 text-center h-full flex flex-col items-center justify-center min-h-[400px] shadow-sm">
        <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl mb-4 shadow-inner">
          <FaBoxOpen className="text-3xl" />
        </div>
        <h3 className="text-base font-extrabold text-zinc-800 tracking-tight">Belum Ada Petani Terpilih</h3>
        <p className="text-sm text-zinc-400 font-medium max-w-sm mt-1 leading-relaxed">
          Silakan cari dan pilih nama petani di panel sebelah kiri terlebih dahulu untuk melihat atau memperbarui jenis tanaman yang mereka garap.
        </p>
      </div>
    );
  }

  // Memicu form edit dari tanaman tertentu yang diklik di dalam kartu lahan
  const handleEditClick = (plant: Plant, landId: number) => {
    setEditingPlant({
      id: plant.id,
      name: plant.name,
      planting_date: plant.planting_date,
      created_at: plant.created_at,
      land_id: landId
    });
    setIsAdding(true); 
  };

  const handleCancelForm = () => {
    setIsAdding(false);
    setEditingPlant(null);
  };

  const landList = selectedFarmer.lands || [];

  return (
    <div className="space-y-4">
      {/* Header Info Petani */}
      <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
            Petani Terpilih
          </span>
          <h2 className="text-lg font-extrabold text-zinc-800 mt-1">
            {selectedFarmer.user?.name || 'Tanpa Nama'}
          </h2>
          <p className="text-xs text-zinc-400 font-medium">
            {selectedFarmer.farmer_group?.name || 'Tanpa Kelompok'}
          </p>
        </div>
        {!isAdding && (
          <button
            onClick={() => {
              setEditingPlant(null);
              setIsAdding(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
          >
            <FaPlus />
            <span>Tambah Tanaman</span>
          </button>
        )}
      </div>

      {/* Form Tambah / Edit Tanaman */}
      {isAdding && (
        <AddPlantForm
          lands={landList}
          onCancel={handleCancelForm}
          onSave={onSavePlant} 
          editingPlant={editingPlant}
          onUpdate={onUpdatePlant}
        />
      )}

      {/* Grid List Kartu Mengikuti Data Lahan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {landList.map((landItem) => (
          <PlantCard 
            key={landItem.id} 
            land={landItem} 
            onDeleteSinglePlant={onDeletePlant} 
            onDeleteAllPlantsInLand={onDeleteAllPlantsInLand || (() => {})} 
            onEditPlant={handleEditClick} 
          />
        ))}

        {/* Empty State jika Lahan Kosong */}
        {landList.length === 0 && !isAdding && (
          <div className="sm:col-span-2 text-center py-12 bg-white rounded-2xl border border-zinc-100">
            <p className="text-sm text-zinc-400 font-medium">
              Petani ini belum memiliki data lahan terdaftar di sistem.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}