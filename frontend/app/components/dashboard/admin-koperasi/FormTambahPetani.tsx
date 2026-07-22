"use client";

import React, { useState, useEffect } from "react";
import api from "../../../lib/axios";
import Swal from "sweetalert2";
import RegionSelectSection from "./RegionSelectSection";
import LandFormSection from "./LandFormSection";
import FarmerGroupModal from "./FarmerGroupModal";

interface FarmerGroup {
  id: number;
  name: string;
}

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

interface FormTambahPetaniProps {
  onSuccess: () => void;
  onCancel: () => void;
  availGroups?: any[];
}

// 🟢 Kelas util dipusatkan di sini agar konsisten & mudah disesuaikan lagi ke depannya
const labelCls = "block text-sm font-semibold text-gray-700 mb-1.5";
const inputCls =
  "w-full px-4 py-2.5 border border-gray-200 rounded-lg text-base leading-6 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-[#0F7B4A] transition-colors";
const textareaCls = inputCls + " resize-none";
const sectionTitleCls =
  "text-sm font-bold text-[#0F7B4A] uppercase tracking-wider mb-4";

export default function FormTambahPetani({
  onSuccess,
  onCancel,
}: FormTambahPetaniProps) {
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<FarmerGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    farmer_group_id: "",
    nik: "",
    province_id: "",
    city_id: "",
    district_id: "",
    village_id: "",
    notes: "",
  });

  const [lands, setLands] = useState<LandItem[]>([
    {
      land_name: "",
      area: "",
      unit: "Hektar(Ha)",
      status: "Milik Sendiri",
      soil_type: "",
      water_source: "",
      irrigation_type: "",
      current_use: "",
      ownership_document: null,
      location_address: "",
      province_id: "",
      city_id: "",
      district_id: "",
      village_id: "",
      plants: [
        {
          name: "",
          planting_date: new Date().toISOString().split("T")[0], // Default tanggal hari ini
          current_phase: "Vegetatif",
          last_fertilizer_type: "",
          last_fertilizer_amount: "",
          last_phase: "",
        },
      ],
    },
  ]);

  useEffect(() => {
    fetchFarmerGroups();
  }, []);

  const fetchFarmerGroups = async () => {
    setLoadingGroups(true);
    try {
      const response = await api.get("/farmer-groups");
      if (response.data?.success) {
        setGroups(response.data.data);
      } else if (Array.isArray(response.data)) {
        setGroups(response.data);
      }
    } catch (err) {
      console.error("Gagal mengambil data kelompok tani:", err);
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegionChange = (field: string, value: string) => {
    const regionField = field as keyof LandItem;

    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "province_id") {
        next.city_id = "";
        next.district_id = "";
        next.village_id = "";
      } else if (field === "city_id") {
        next.district_id = "";
        next.village_id = "";
      } else if (field === "district_id") {
        next.village_id = "";
      }
      return next;
    });

    setLands((prevLands) =>
      prevLands.map((land) => {
        const nextLand: LandItem = { ...land, [regionField]: value };
        if (field === "province_id") {
          nextLand.city_id = "";
          nextLand.district_id = "";
          nextLand.village_id = "";
        } else if (field === "city_id") {
          nextLand.district_id = "";
          nextLand.village_id = "";
        } else if (field === "district_id") {
          nextLand.village_id = "";
        }
        return nextLand;
      }),
    );
  };

  const handleLandChange = (
    index: number,
    field: keyof LandItem | string,
    value: any,
  ) => {
    const landField = field as keyof LandItem;

    setLands((prevLands) => {
      const updated = [...prevLands];
      const currentLand: LandItem = { ...updated[index], [landField]: value };

      if (field === "province_id") {
        currentLand.city_id = "";
        currentLand.district_id = "";
        currentLand.village_id = "";
      } else if (field === "city_id") {
        currentLand.district_id = "";
        currentLand.village_id = "";
      } else if (field === "district_id") {
        currentLand.village_id = "";
      }

      updated[index] = currentLand;
      return updated;
    });
  };

  const addLandRow = () => {
    setLands((prev) => [
      ...prev,
      {
        land_name: "",
        area: "",
        unit: "Hektar(Ha)",
        status: "Milik Sendiri",
        soil_type: "",
        water_source: "",
        irrigation_type: "",
        current_use: "",
        ownership_document: null,
        location_address: "",
        province_id: formData.province_id,
        city_id: formData.city_id,
        district_id: formData.district_id,
        village_id: formData.village_id,
        plants: [
          {
            name: "",
            planting_date: new Date().toISOString().split("T")[0],
            current_phase: "Vegetatif",
            last_fertilizer_type: "",
            last_fertilizer_amount: "",
            last_phase: "",
          },
        ],
      },
    ]);
  };

  const removeLandRow = (index: number) => {
    if (lands.length === 1) return;
    setLands((prev) => prev.filter((_, i) => i !== index));
  };

  // 🟢 HANDLESUBMIT SESUAI ATURAN VALIDASI LARAVEL
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();

      // 1. Masukkan data profil petani
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          data.append(key, value);
        }
      });

      // 2. Format Lahan sebagai Array Form (Bukan JSON String) agar lolos validasi Laravel
      lands.forEach((land, index) => {
        data.append(`lands[${index}][land_name]`, land.land_name || "");
        data.append(`lands[${index}][area]`, land.area || "0");
        data.append(`lands[${index}][unit]`, land.unit || "Hektar(Ha)");
        data.append(`lands[${index}][status]`, land.status || "Milik Sendiri");

        if (land.province_id)
          data.append(`lands[${index}][province_id]`, land.province_id);
        if (land.city_id) data.append(`lands[${index}][city_id]`, land.city_id);
        if (land.district_id)
          data.append(`lands[${index}][district_id]`, land.district_id);
        if (land.village_id)
          data.append(`lands[${index}][village_id]`, land.village_id);
        if (land.current_use)
          data.append(`lands[${index}][current_use]`, land.current_use);
        if (land.soil_type)
          data.append(`lands[${index}][soil_type]`, land.soil_type);
        if (land.water_source)
          data.append(`lands[${index}][water_source]`, land.water_source);
        if (land.irrigation_type)
          data.append(`lands[${index}][irrigation_type]`, land.irrigation_type);
        if (land.location_address)
          data.append(
            `lands[${index}][location_address]`,
            land.location_address,
          );

        // Upload berkas fisik sesuai struktur $allLandFiles[$index]['ownership_document']
        if (land.ownership_document instanceof File) {
          data.append(
            `lands[${index}][ownership_document]`,
            land.ownership_document,
          );
        }
      });

      // STEP A: Simpan Petani & Lahan (POST /farmers)
      const response = await api.post("/farmers", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // STEP B: Ambil data lahan terdaftar dari response backend
      const responseData = response.data?.data || response.data;
      const createdLands = responseData?.lands || [];

      // STEP C: Kirim Tanaman Terpisah (POST /plants) Sesuai Skema PlantController.php
      const plantPromises: Promise<any>[] = [];

      lands.forEach((landState, index) => {
        const targetLandId = createdLands[index]?.id;

        if (targetLandId && landState.plants && landState.plants.length > 0) {
          // Filter tanaman yang memiliki nama
          const validPlants = landState.plants
            .filter((p) => p.name.trim() !== "")
            .map((p) => ({
              name: p.name,
              planting_date:
                p.planting_date || new Date().toISOString().split("T")[0],
              current_phase: p.current_phase || "Vegetatif",
              last_fertilizer_type: p.last_fertilizer_type || null,
              last_fertilizer_amount: p.last_fertilizer_amount
                ? Number(p.last_fertilizer_amount)
                : null,
              last_phase: p.last_phase || null,
            }));

          // Sesuai aturan PlantController::store yang mewajibkan payload { land_id, plants: [...] }
          if (validPlants.length > 0) {
            plantPromises.push(
              api.post("/plants", {
                land_id: targetLandId,
                plants: validPlants,
              }),
            );
          }
        }
      });

      if (plantPromises.length > 0) {
        await Promise.all(plantPromises);
      }

      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Data petani, lahan, dan komoditas tanaman berhasil disimpan!",
      });

      onSuccess();
    } catch (err: any) {
      console.error("Error submitting farmer:", err);

      // Tangkap dan tampilkan error rinci dari Laravel
      let errorMsg = "Terjadi kesalahan saat menyimpan data.";
      if (err.response?.data) {
        if (
          typeof err.response.data === "object" &&
          !err.response.data.message
        ) {
          errorMsg = Object.values(err.response.data).flat().join("\n");
        } else if (err.response.data.errors) {
          errorMsg = Object.values(err.response.data.errors).flat().join("\n");
        } else if (err.response.data.message) {
          errorMsg = err.response.data.message;
        }
      }

      Swal.fire({ icon: "error", title: "Gagal Menyimpan", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 mb-6 relative">
      <div className="border-b border-gray-100 pb-4 mb-6 flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span className="w-2 h-5 bg-[#0F7B4A] rounded-full inline-block"></span>
          Form Tambah Master Data Petani Baru
        </h2>
        <button
          onClick={onCancel}
          className="text-sm text-gray-400 hover:text-gray-600 font-medium"
        >
          Tutup Form ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <h3 className={sectionTitleCls}>1. Informasi Akun & Personal</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className={labelCls}>Nama Lengkap *</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className={inputCls}
                placeholder="Nama petani"
              />
            </div>
            <div>
              <label className={labelCls}>Email *</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className={inputCls}
                placeholder="petani@email.com"
              />
            </div>
            <div>
              <label className={labelCls}>Password Baru *</label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className={inputCls}
                placeholder="Minimal 8 karakter"
              />
            </div>
            <div>
              <label className={labelCls}>NIK (16 Digit) *</label>
              <input
                type="text"
                name="nik"
                maxLength={16}
                required
                value={formData.nik}
                onChange={handleInputChange}
                className={inputCls}
                placeholder="16 digit NIK"
              />
            </div>
            <div>
              <label className={labelCls}>No. Telepon / WA</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={inputCls}
                placeholder="08xxxx"
              />
            </div>
            <div>
              <label className={labelCls}>Kelompok Tani *</label>
              <div className="flex gap-2">
                <select
                  name="farmer_group_id"
                  required
                  value={formData.farmer_group_id}
                  onChange={handleInputChange}
                  className={inputCls + " bg-white"}
                >
                  <option value="">
                    {loadingGroups ? "Memuat..." : "-- Pilih Kelompok Tani --"}
                  </option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowGroupModal(true)}
                  className="px-4 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-sm font-bold hover:bg-emerald-100 transition-colors shrink-0"
                >
                  + Baru
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <RegionSelectSection
              provinceId={formData.province_id}
              cityId={formData.city_id}
              districtId={formData.district_id}
              villageId={formData.village_id}
              onChange={handleRegionChange}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
            <div>
              <label className={labelCls}>Alamat Lengkap (RT/RW)</label>
              <textarea
                name="address"
                rows={3}
                value={formData.address}
                onChange={handleInputChange}
                className={textareaCls}
                placeholder="Nama jalan, RT/RW..."
              ></textarea>
            </div>

            <div>
              <label className={labelCls}>Catatan Tambahan Petani</label>
              <textarea
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleInputChange}
                className={textareaCls}
                placeholder="Catatan khusus mengenai petani..."
              ></textarea>
            </div>
          </div>
        </div>

        <LandFormSection
          lands={lands}
          onLandChange={handleLandChange}
          onAddRow={addLandRow}
          onRemoveRow={removeLandRow}
        />

        <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg text-sm font-semibold transition-colors"
          >
            Batalkan
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-[#0F7B4A] hover:bg-emerald-800 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Menyimpan ke Server..." : "Simpan Petani"}
          </button>
        </div>
      </form>

      {showGroupModal && (
        <FarmerGroupModal
          onClose={() => setShowGroupModal(false)}
          onGroupCreated={(newGroup) => {
            setGroups((prev) => [newGroup, ...prev]);
            setFormData((prev) => ({
              ...prev,
              farmer_group_id: String(newGroup.id),
            }));
          }}
        />
      )}
    </div>
  );
}
