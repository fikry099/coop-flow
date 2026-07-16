import { z } from "zod";

export const registerSchema = z
  .object({
    cooperative_name: z.string().min(3, "Nama koperasi minimal 3 karakter"),
    cooperative_code: z.string().min(3, "Kode koperasi wajib diisi"),
    nik_cooperative: z.string().length(16, "NIK harus 16 digit"),
    legal_entity_type: z.string().min(1, "Pilih badan hukum"),
    legal_entity_number: z.string().min(1, "Nomor badan hukum wajib diisi"),
    established_date: z.string().min(1, "Tanggal berdiri wajib diisi"),
    npwp: z.string().min(15, "NPWP tidak valid"), // Field baru
    address_cooperative: z.string().min(10, "Alamat terlalu singkat"),
    postal_code: z.string().length(5, "Kode pos harus 5 digit"),
    province: z.string().min(1, "Pilih provinsi"),
    city_koor: z.string().min(1, "Pilih kota/kabupaten"),
    district: z.string().min(1, "Pilih kecamatan"),
    village: z.string().min(1, "Pilih desa"),
    email_cooperative: z.string().email("Format email tidak valid"),
    phone_cooperative: z.string().min(10, "Nomor telepon tidak valid"),
    capacity_ton: z.preprocess(
      (val) => Number(val),
      z.number().min(0, "Kapasitas tidak valid"),
    ),
    password: z.string().min(8, "Password minimal 8 karakter"),
    password_confirmation: z.string().min(8, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Password tidak sama",
    path: ["password_confirmation"],
  });

// Mengekspor tipe data agar bisa digunakan di form
export type RegisterFormData = z.infer<typeof registerSchema>;
