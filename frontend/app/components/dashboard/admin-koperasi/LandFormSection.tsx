"use client";

import React from "react";
import RegionSelectSection from "./RegionSelectSection";

// 🟢 Tipe data disesuaikan persis dengan validasi PlantController.php
export interface PlantItem {
  name: string;
  planting_date: string;
  current_phase: string;
  last_fertilizer_type: string;
  last_fertilizer_amount: string;
  last_phase: string;
}

export interface LandItem {
  land_name: string;
  area: string;
  unit: string;
  status: string;
  soil_type: string;
  water_source: string;
  irrigation_type: string;
  current_use: string;
  ownership_document: File | null;
  location_address: string;
  province_id: string;
  city_id: string;
  district_id: string;
  village_id: string;
  plants: PlantItem[];
}

interface LandFormSectionProps {
  lands: LandItem[];
  onLandChange: (index: number, field: string, value: any) => void;
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
}

export default function LandFormSection({
  lands,
  onLandChange,
  onAddRow,
  onRemoveRow,
}: LandFormSectionProps) {
  const handlePlantChange = (
    landIndex: number,
    plantIndex: number,
    field: keyof PlantItem,
    value: string,
  ) => {
    const updatedPlants = [...lands[landIndex].plants];
    updatedPlants[plantIndex] = {
      ...updatedPlants[plantIndex],
      [field]: value,
    };
    onLandChange(landIndex, "plants", updatedPlants);
  };

  const addPlantRow = (landIndex: number) => {
    const updatedPlants: PlantItem[] = [
      ...lands[landIndex].plants,
      {
        name: "",
        planting_date: "",
        current_phase: "Vegetatif",
        last_fertilizer_type: "",
        last_fertilizer_amount: "",
        last_phase: "",
      },
    ];
    onLandChange(landIndex, "plants", updatedPlants);
  };

  const removePlantRow = (landIndex: number, plantIndex: number) => {
    if (lands[landIndex].plants.length === 1) return;
    const updatedPlants = lands[landIndex].plants.filter(
      (_, i) => i !== plantIndex,
    );
    onLandChange(landIndex, "plants", updatedPlants);
  };

  return (
    <div className="border-t border-gray-200 pt-6">
      {/* Header Utama Section */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-base font-bold text-[#0F7B4A] uppercase tracking-wide">
            2. Aset Lahan Pertanian & Vegetasi
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Isi detail aset lahan dan jenis tanaman yang dikelola.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddRow}
          className="text-xs sm:text-sm bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 px-3.5 py-2 rounded-lg font-semibold transition-colors flex items-center gap-1 shadow-sm"
        >
          <span>+</span> Tambah Baris Lahan
        </button>
      </div>

      <div className="space-y-6">
        {lands.map((land, index) => (
          <div
            key={index}
            className="p-5 bg-gray-50/80 rounded-2xl border border-gray-200 shadow-sm space-y-5 relative"
          >
            {/* Header Lahan Row */}
            <div className="flex justify-between items-center border-b border-gray-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-600 text-white text-xs font-bold px-2.5 py-1 rounded-md">
                  Lahan #{index + 1}
                </span>
                <span className="text-sm font-semibold text-gray-800">
                  {land.land_name || "Lahan Tanpa Nama"}
                </span>
              </div>
              {lands.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemoveRow(index)}
                  className="text-xs sm:text-sm text-red-600 hover:text-red-700 font-semibold px-2 py-1 rounded hover:bg-red-50 transition-colors"
                >
                  Hapus Lahan ✕
                </button>
              )}
            </div>

            {/* Parameter Utama Lahan */}
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">
                Informasi Dasar Lahan
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Nama Blok Lahan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={land.land_name}
                    onChange={(e) =>
                      onLandChange(index, "land_name", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all placeholder:text-gray-400"
                    placeholder="Misal: Sawah Kulon"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Luas Lahan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={land.area}
                    onChange={(e) =>
                      onLandChange(index, "area", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all placeholder:text-gray-400"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Satuan Ukuran <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={land.unit}
                    onChange={(e) =>
                      onLandChange(index, "unit", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all"
                  >
                    <option value="Hektar(Ha)">Hektar (Ha)</option>
                    <option value="Meter Persegi(m2)">
                      Meter Persegi (m2)
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Status Kepemilikan <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={land.status}
                    onChange={(e) =>
                      onLandChange(index, "status", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all"
                  >
                    <option value="Milik Sendiri">Milik Sendiri</option>
                    <option value="Sewa">Sewa</option>
                    <option value="Bagi Hasil">Bagi Hasil</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Fisik Tanah & Irigasi */}
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">
                Kondisi Fisik & Irigasi
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Jenis Tanah
                  </label>
                  <input
                    type="text"
                    value={land.soil_type}
                    onChange={(e) =>
                      onLandChange(index, "soil_type", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all placeholder:text-gray-400"
                    placeholder="Misal: Aluvial / Lempung"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Penggunaan Saat Ini
                  </label>
                  <input
                    type="text"
                    value={land.current_use}
                    onChange={(e) =>
                      onLandChange(index, "current_use", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all placeholder:text-gray-400"
                    placeholder="Misal: Tumpang Sari"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Sumber Air
                  </label>
                  <input
                    type="text"
                    value={land.water_source}
                    onChange={(e) =>
                      onLandChange(index, "water_source", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all placeholder:text-gray-400"
                    placeholder="Misal: Sungai / Sumur Bor"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Tipe Irigasi
                  </label>
                  <input
                    type="text"
                    value={land.irrigation_type}
                    onChange={(e) =>
                      onLandChange(index, "irrigation_type", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all placeholder:text-gray-400"
                    placeholder="Misal: Irigasi Teknis"
                  />
                </div>
              </div>
            </div>

            {/* Dokumen & Alamat Lahan */}
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">
                Dokumen & Alamat Detail
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Unggah Surat/Dokumen Kepemilikan
                  </label>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) =>
                      onLandChange(
                        index,
                        "ownership_document",
                        e.target.files?.[0] || null,
                      )
                    }
                    className="w-full text-xs text-gray-600 bg-white border border-gray-300 py-2 px-3 rounded-lg file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Alamat Detail Lokasi Lahan
                  </label>
                  <input
                    type="text"
                    value={land.location_address}
                    onChange={(e) =>
                      onLandChange(index, "location_address", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all placeholder:text-gray-400"
                    placeholder="Nama Blok, Patokan, dsb."
                  />
                </div>
              </div>
            </div>

            {/* Wilayah Lahan Khusus */}
            <div className="pt-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <span className="block text-xs font-bold text-gray-800 mb-2">
                Wilayah Administratif Lahan #{index + 1}{" "}
                <span className="text-gray-500 font-normal">
                  (Dapat diubah bila berbeda dari domisili)
                </span>
              </span>
              <RegionSelectSection
                provinceId={land.province_id}
                cityId={land.city_id}
                districtId={land.district_id}
                villageId={land.village_id}
                onChange={(field, val) => onLandChange(index, field, val)}
              />
            </div>

            {/* SUB-FORM: KOMODITAS TANAMAN PADA LAHAN INI */}
            <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2.5">
                <div>
                  <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
                    Daftar Komoditas Tanaman di Blok Ini{" "}
                    <span className="text-red-500">*</span>
                  </span>
                  <p className="text-[11px] text-gray-500">
                    Masukkan data riwayat & status tanaman di lahan ini.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => addPlantRow(index)}
                  className="text-xs bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200 px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1"
                >
                  <span>+</span> Tambah Jenis Tanaman
                </button>
              </div>

              {land.plants.map((plant, pIndex) => (
                <div
                  key={pIndex}
                  className="p-4 bg-gray-50/90 rounded-xl border border-gray-200 space-y-3 relative"
                >
                  <div className="flex justify-between items-center border-b border-gray-200/60 pb-2">
                    <span className="text-xs font-bold text-gray-700 bg-gray-200/80 px-2.5 py-0.5 rounded">
                      Tanaman #{pIndex + 1}
                    </span>
                    {land.plants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePlantRow(index, pIndex)}
                        className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-0.5 px-2 py-0.5 rounded hover:bg-red-50 transition-colors"
                      >
                        Hapus Tanaman ✕
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* 1. Nama Tanaman */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Nama Komoditas <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={plant.name}
                        onChange={(e) =>
                          handlePlantChange(
                            index,
                            pIndex,
                            "name",
                            e.target.value,
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all placeholder:text-gray-400"
                        placeholder="Misal: Padi / Jagung"
                      />
                    </div>

                    {/* 2. Tanggal Tanam */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Tanggal Tanam <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={plant.planting_date}
                        onChange={(e) =>
                          handlePlantChange(
                            index,
                            pIndex,
                            "planting_date",
                            e.target.value,
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all"
                      />
                    </div>

                    {/* 3. Fase Saat Ini */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Fase Saat Ini
                      </label>
                      <select
                        value={plant.current_phase}
                        onChange={(e) =>
                          handlePlantChange(
                            index,
                            pIndex,
                            "current_phase",
                            e.target.value,
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all"
                      >
                        <option value="Pengolahan Lahan">
                          Pengolahan Lahan
                        </option>
                        <option value="Vegetatif">Vegetatif</option>
                        <option value="Generatif">Generatif</option>
                        <option value="Panen">Panen</option>
                        <option value="Pasca Panen">Pasca Panen</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* 4. Jenis Pupuk Terakhir */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Jenis Pupuk Terakhir
                      </label>
                      <input
                        type="text"
                        value={plant.last_fertilizer_type}
                        onChange={(e) =>
                          handlePlantChange(
                            index,
                            pIndex,
                            "last_fertilizer_type",
                            e.target.value,
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all placeholder:text-gray-400"
                        placeholder="Misal: NPK / Urea"
                      />
                    </div>

                    {/* 5. Jumlah Pupuk Terakhir */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Jumlah Pupuk Terakhir (Kg/L)
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={plant.last_fertilizer_amount}
                        onChange={(e) =>
                          handlePlantChange(
                            index,
                            pIndex,
                            "last_fertilizer_amount",
                            e.target.value,
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all placeholder:text-gray-400"
                        placeholder="0"
                      />
                    </div>

                    {/* 6. Fase Sebelumnya */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Fase Sebelumnya
                      </label>
                      <input
                        type="text"
                        value={plant.last_phase}
                        onChange={(e) =>
                          handlePlantChange(
                            index,
                            pIndex,
                            "last_phase",
                            e.target.value,
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all placeholder:text-gray-400"
                        placeholder="Misal: Vegetatif"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
