"use client";
import React, { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import api from "../../../lib/axios";

export default function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [villages, setVillages] = useState([]);

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] =
    useState(false);

  const [formData, setFormData] = useState({
    cooperative_name: "",
    nik_cooperative: "",
    legal_entity_type: "",
    legal_entity_number: "",
    established_date: "",
    npwp: "",
    address_cooperative: "",
    postal_code: "",
    province_id: "",
    city_id: "",
    district_id: "",
    village_id: "",
    email_cooperative: "",
    phone_cooperative: "",
    capacity_ton: "",
    password: "",
    password_confirmation: "",
  });

  useEffect(() => {
    api
      .get("/regional/provinces")
      .then((res) => setProvinces(res.data))
      .catch((err) => console.error("Error Fetching Provinces:", err));
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegionChange = async (type: string, code: string) => {
    if (type === "province") {
      setFormData((prev) => ({
        ...prev,
        province_id: code,
        city_id: "",
        district_id: "",
        village_id: "",
      }));
      setCities([]);
      setDistricts([]);
      setVillages([]);
      if (code) {
        const res = await api.get(`/regional/provinces/${code}/cities`);
        setCities(res.data);
      }
    } else if (type === "city") {
      setFormData((prev) => ({
        ...prev,
        city_id: code,
        district_id: "",
        village_id: "",
      }));
      setDistricts([]);
      setVillages([]);
      if (code) {
        const res = await api.get(`/regional/cities/${code}/districts`);
        setDistricts(res.data);
      }
    } else if (type === "district") {
      setFormData((prev) => ({ ...prev, district_id: code, village_id: "" }));
      setVillages([]);
      if (code) {
        const res = await api.get(`/regional/districts/${code}/villages`);
        setVillages(res.data);
      }
    } else if (type === "village") {
      setFormData((prev) => ({ ...prev, village_id: code }));
    }
  };

  // Generate kode koperasi otomatis, tidak perlu diisi manual oleh user
  const generateCooperativeCode = (name: string) => {
    const initials = name
      .trim()
      .split(/\s+/)
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 4);

    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(100 + Math.random() * 900);

    return `KOP-${initials}-${timestamp}${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.password_confirmation) {
      alert("Password tidak sama!");
      return;
    }
    setLoading(true);

    // Cari nama wilayah berdasarkan code yang dipilih
    const provinceName =
      provinces.find((p: any) => p.code === formData.province_id)?.name || "";
    const cityName =
      cities.find((c: any) => c.code === formData.city_id)?.name || "";
    const districtName =
      districts.find((d: any) => d.code === formData.district_id)?.name || "";
    const villageName =
      villages.find((v: any) => v.code === formData.village_id)?.name || "";

    const payload = {
      cooperative_name: formData.cooperative_name,
      cooperative_code: generateCooperativeCode(formData.cooperative_name),
      nik_cooperative: formData.nik_cooperative,
      npwp: formData.npwp,
      legal_entity_type: formData.legal_entity_type,
      legal_entity_number: formData.legal_entity_number,
      established_date: formData.established_date,
      address_cooperative: formData.address_cooperative,
      email_cooperative: formData.email_cooperative,
      phone_cooperative: formData.phone_cooperative,
      postal_code: formData.postal_code,
      province: provinceName,
      city_koor: cityName,
      district: districtName,
      village: villageName,
      capacity_ton: formData.capacity_ton,
      password: formData.password,
    };

    try {
      await api.post("/cooperative/register", payload);
      alert("Registrasi Berhasil!");
    } catch (err: any) {
      console.error("Full response data:", err.response?.data);
      alert(
        err.response?.data?.message || "Gagal registrasi, periksa input data.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      cooperative_name: "",
      nik_cooperative: "",
      legal_entity_type: "",
      legal_entity_number: "",
      established_date: "",
      npwp: "",
      address_cooperative: "",
      postal_code: "",
      province_id: "",
      city_id: "",
      district_id: "",
      village_id: "",
      email_cooperative: "",
      phone_cooperative: "",
      capacity_ton: "",
      password: "",
      password_confirmation: "",
    });
  };

  const inputClass =
    "border border-gray-300 p-3.5 rounded-lg w-full text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500";
  const labelClass = "block text-base font-semibold mb-2 text-gray-700";
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Nama Koperasi & NIK */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>
            Nama Koperasi <span className="text-red-500">*</span>
          </label>
          <input
            name="cooperative_name"
            placeholder="Contoh : Koperasi Tani Makmur"
            value={formData.cooperative_name}
            onChange={handleChange}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className={labelClass}>
            Nomor Induk Koperasi (NIK) <span className="text-red-500">*</span>
          </label>
          <input
            name="nik_cooperative"
            placeholder="Masukan NIK koperasi"
            value={formData.nik_cooperative}
            onChange={handleChange}
            className={inputClass}
            required
          />
        </div>
      </div>

      {/* Badan Hukum & Nomor Badan Hukum */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>
            Badan Hukum <span className="text-red-500">*</span>
          </label>
          <select
            name="legal_entity_type"
            value={formData.legal_entity_type}
            onChange={handleChange}
            className={`${inputClass} ${formData.legal_entity_type ? "text-black" : "text-gray-400"}`}
            required
          >
            <option value="">Pilih Badan Hukum</option>
            <option value="koperasi_simpan_pinjam">
              Koperasi Simpan Pinjam
            </option>
            <option value="koperasi_produksi">Koperasi Produksi</option>
            <option value="koperasi_konsumen">Koperasi Konsumen</option>
            <option value="koperasi_jasa">Koperasi Jasa</option>
            <option value="koperasi_serba_usaha">Koperasi Serba Usaha</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>
            Nomor Badan Hukum <span className="text-red-500">*</span>
          </label>
          <input
            name="legal_entity_number"
            placeholder="Contoh : AHU-876345S-835 Tahun 2026"
            value={formData.legal_entity_number}
            onChange={handleChange}
            className={inputClass}
            required
          />
        </div>
      </div>

      {/* Tanggal Berdiri & NPWP */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>
            Tanggal Berdiri <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="established_date"
            value={formData.established_date}
            onChange={handleChange}
            className={`${inputClass} ${formData.established_date ? "text-black" : "text-gray-400"}`}
            required
          />
        </div>
        <div>
          <label className={labelClass}>
            NPWP Koperasi <span className="text-red-500">*</span>
          </label>
          <input
            name="npwp"
            placeholder="Contoh : 6296-8346-93935"
            value={formData.npwp}
            onChange={handleChange}
            className={inputClass}
            required
          />
        </div>
      </div>

      {/* Alamat & Kode Pos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>
            Alamat Koperasi <span className="text-red-500">*</span>
          </label>
          <input
            name="address_cooperative"
            placeholder="Masukan Alamat koperasi lengkap"
            value={formData.address_cooperative}
            onChange={handleChange}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className={labelClass}>
            Kode Pos <span className="text-red-500">*</span>
          </label>
          <input
            name="postal_code"
            placeholder="Masukan Kode Pos"
            value={formData.postal_code}
            onChange={handleChange}
            className={inputClass}
            required
          />
        </div>
      </div>

      {/* Provinsi & Kabupaten/Kota */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>
            Provinsi <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.province_id}
            onChange={(e) => handleRegionChange("province", e.target.value)}
            className={`${inputClass} ${formData.province_id ? "text-black" : "text-gray-400"}`}
            required
          >
            <option value="">Pilih Provinsi</option>
            {provinces.map((p: any) => (
              <option key={p.code} value={p.code}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>
            Kabupaten/Kota <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.city_id}
            onChange={(e) => handleRegionChange("city", e.target.value)}
            className={`${inputClass} ${formData.city_id ? "text-black" : "text-gray-400"}`}
            required
          >
            <option value="">Pilih Kabupaten/Kota</option>
            {cities.map((c: any) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Kecamatan & Desa/Kelurahan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>
            Kecamatan <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.district_id}
            onChange={(e) => handleRegionChange("district", e.target.value)}
            className={`${inputClass} ${formData.district_id ? "text-black" : "text-gray-400"}`}
            required
          >
            <option value="">Pilih Kecamatan</option>
            {districts.map((d: any) => (
              <option key={d.code} value={d.code}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>
            Desa/Kelurahan <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.village_id}
            onChange={(e) => handleRegionChange("village", e.target.value)}
            className={`${inputClass} ${formData.village_id ? "text-black" : "text-gray-400"}`}
            required
          >
            <option value="">Pilih Desa/Kelurahan</option>
            {villages.map((v: any) => (
              <option key={v.code} value={v.code}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Email, No. Telepon, Kapasitas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>
            Email Koperasi <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email_cooperative"
            placeholder="admin@gmail.com"
            value={formData.email_cooperative}
            onChange={handleChange}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className={labelClass}>
            No. Telepon Koperasi <span className="text-red-500">*</span>
          </label>
          <input
            name="phone_cooperative"
            placeholder="08xxxxxxxxxx"
            value={formData.phone_cooperative}
            onChange={handleChange}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className={labelClass}>
            Kapasitas Penyimpanan Gudang <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="capacity_ton"
            placeholder="Contoh : 200"
            value={formData.capacity_ton}
            onChange={handleChange}
            className={inputClass}
            required
          />
        </div>
      </div>

      {/* Password & Konfirmasi Password */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>
            Masukan Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Masukan password"
              value={formData.password}
              onChange={handleChange}
              className={`${inputClass} pr-10`}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <div>
          <label className={labelClass}>
            Konfirmasi Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showPasswordConfirmation ? "text" : "password"}
              name="password_confirmation"
              placeholder="Konfirmasi password"
              value={formData.password_confirmation}
              onChange={handleChange}
              className={`${inputClass} pr-10`}
              required
            />
            <button
              type="button"
              onClick={() => setShowPasswordConfirmation((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showPasswordConfirmation ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tombol Batal & Kirim */}
      <div className="flex gap-4 pt-2">
        <button
          type="button"
          onClick={handleCancel}
          className="flex-1 bg-gray-200 text-gray-700 p-3 rounded-lg font-bold hover:bg-gray-300 transition"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-green-600 text-white p-3 rounded-lg font-bold hover:bg-green-700 transition disabled:opacity-60"
        >
          {loading ? "Memproses..." : "Kirim"}
        </button>
      </div>
    </form>
  );
}
