'use client';

import React from 'react';
import { FaEdit, FaPlus, FaTrash, FaFolderPlus } from 'react-icons/fa';

interface Land {
  land_name: string;
  area: number;
  location_address?: string;
}

interface FarmerFormProps {
  isAdding: boolean;
  formData: {
    name: string;
    email: string;
    phone: string;
    address: string;
    farmer_group_id: string; // DIUBAH DARI farmer_group
    nik: string;
    notes: string;
    lands: Land[];
  };
  setFormData: any;
  farmerGroups: Array<{ id: number; name: string; description?: string }>; // PROPS BARU
  onAddFarmerGroupClick: () => void; // PROPS BARU
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export default function FarmerForm({
  isAdding,
  formData,
  setFormData,
  farmerGroups,
  onAddFarmerGroupClick,
  onSubmit,
  onCancel,
  onDelete
}: FarmerFormProps) {

  const handleAddLand = () => {
    setFormData({
      ...formData,
      lands: [...formData.lands, { land_name: '', area: 0, location_address: '' }]
    });
  };

  const handleRemoveLand = (index: number) => {
    const updatedLands = formData.lands.filter((_, i) => i !== index);
    setFormData({ ...formData, lands: updatedLands });
  };

  const handleLandChange = (index: number, field: keyof Land, value: any) => {
    const updatedLands = formData.lands.map((land, i) => {
      if (i === index) {
        return { ...land, [field]: value };
      }
      return land;
    });
    setFormData({ ...formData, lands: updatedLands });
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm space-y-6">
      <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2 border-b border-zinc-100 pb-3">
        <FaEdit className="text-blue-600" />
        <span>{isAdding ? 'Registrasi Petani Anggota Baru' : 'Ubah Informasi Profil Petani'}</span>
      </h2>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Nama Lengkap */}
        <div>
          <label className="block text-xs font-bold text-zinc-600 uppercase mb-1.5 tracking-wide">Nama Lengkap (Sesuai KTP)</label>
          <input 
            type="text" 
            required
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full border border-zinc-200 rounded-xl p-2.5 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none transition" 
            placeholder="Masukkan nama lengkap petani"
          />
        </div>

        {/* Email & NIK */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-zinc-600 uppercase mb-1.5 tracking-wide">Email Akun Login</label>
            <input 
              type="email" 
              required
              value={formData.email} 
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full border border-zinc-200 rounded-xl p-2.5 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none transition" 
              placeholder="email@petani.com"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-600 uppercase mb-1.5 tracking-wide">Nomor Induk Kependudukan (NIK)</label>
            <input 
              type="text" 
              required
              value={formData.nik} 
              onChange={(e) => setFormData({...formData, nik: e.target.value})}
              className="w-full border border-zinc-200 rounded-xl p-2.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none transition" 
              placeholder="16 digit angka NIK resmi"
            />
          </div>
        </div>

        {/* Telepon & Kelompok Tani */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-zinc-600 uppercase mb-1.5 tracking-wide">Nomor Telepon/WA</label>
            <input 
              type="text" 
              required
              value={formData.phone} 
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full border border-zinc-200 rounded-xl p-2.5 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none transition" 
              placeholder="Contoh: 0812345xxx"
            />
          </div>
          
          {/* BAGIAN BARU: Kelompok Tani dengan integrasi Button Tambah Dinamis */}
          <div>
            <label className="block text-xs font-bold text-zinc-600 uppercase mb-1.5 tracking-wide">Kelompok Tani</label>
            <div className="flex gap-2">
              <select 
                value={formData.farmer_group_id} 
                onChange={(e) => setFormData({...formData, farmer_group_id: e.target.value})}
                className="flex-1 border border-zinc-200 rounded-xl p-2.5 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white transition"
                required
              >
                <option value="" disabled>-- Pilih Kelompok Tani --</option>
                {farmerGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
              
              <button
                type="button"
                onClick={onAddFarmerGroupClick}
                title="Buat Kelompok Tani Baru"
                className="p-3 bg-zinc-100 hover:bg-blue-50 border border-zinc-200 text-zinc-600 hover:text-blue-600 rounded-xl shadow-sm transition flex items-center justify-center"
              >
                <FaFolderPlus className="text-base" />
              </button>
            </div>
          </div>
        </div>

        {/* --- SECTION MANAJEMEN MULTI LAHAN --- */}
        <div className="border-t border-b border-zinc-100 py-4 my-2 space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wide">
              Rincian Lahan Kepemilikan Petani
            </label>
            <button
              type="button"
              onClick={handleAddLand}
              className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-lg transition"
            >
              <FaPlus className="text-[10px]" />
              <span>Tambah Lahan</span>
            </button>
          </div>

          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
            {formData.lands.map((land, index) => (
              <div key={index} className="flex gap-2 items-start bg-zinc-50 p-3 rounded-xl border border-zinc-200/60 relative">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Nama Lahan (ex: Blok Sawah A)"
                      value={land.land_name}
                      onChange={(e) => handleLandChange(index, 'land_name', e.target.value)}
                      className="w-full bg-white border border-zinc-200 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      required
                      step="0.01"
                      placeholder="Luas (Hektar)"
                      value={land.area || ''}
                      onChange={(e) => handleLandChange(index, 'area', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-zinc-200 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Lokasi/Keterangan Alamat"
                      value={land.location_address || ''}
                      onChange={(e) => handleLandChange(index, 'location_address', e.target.value)}
                      className="w-full bg-white border border-zinc-200 rounded-lg p-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {formData.lands.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveLand(index)}
                    className="p-2.5 bg-white border border-red-100 text-red-500 hover:bg-red-50 rounded-lg transition self-center shadow-xs"
                  >
                    <FaTrash className="text-xs" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Alamat Domisili */}
        <div>
          <label className="block text-xs font-bold text-zinc-600 uppercase mb-1.5 tracking-wide">Alamat Domisili Fisik</label>
          <textarea 
            rows={2}
            required
            value={formData.address} 
            onChange={(e) => setFormData({...formData, address: e.target.value})}
            className="w-full border border-zinc-200 rounded-xl p-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none transition" 
            placeholder="Tuliskan detail dusun, RT/RW, dan desa"
          />
        </div>

        {/* Catatan Tambahan */}
        <div>
          <label className="block text-xs font-bold text-zinc-600 uppercase mb-1.5 tracking-wide">Catatan Tambahan</label>
          <textarea 
            rows={2}
            value={formData.notes} 
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            className="w-full border border-zinc-200 rounded-xl p-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none transition" 
            placeholder="Keterangan komoditas tanaman dsb..."
          />
        </div>

        {/* Tombol Aksi */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 border border-zinc-200 text-zinc-600 font-bold rounded-xl hover:bg-zinc-50 transition text-sm"
          >
            Batal
          </button>
          
          {!isAdding && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="px-4 py-2.5 bg-red-50 text-red-600 border border-red-100 font-bold rounded-xl hover:bg-red-100 transition text-sm"
            >
              Hapus
            </button>
          )}

          <button
            type="submit"
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition text-sm"
          >
            {isAdding ? 'Simpan ke Server' : 'Simpan Pembaruan'}
          </button>
        </div>
      </form>
    </div>
  );
}