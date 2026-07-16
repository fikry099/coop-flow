"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Building2 } from "lucide-react";
import RegisterForm from "./components/RegisterForm";

export default function RegisterPage() {
  const router = useRouter();

  return (
    <main className="flex min-h-screen bg-gray-50">
      {/* Kolom Kiri: Branding + Ilustrasi */}
      <div className="hidden md:flex md:w-[28%] sticky top-0 h-screen flex-col bg-[#eef6ef]">
        <div className="p-10">
          <h2 className="text-green-700 text-4xl font-bold leading-snug">
            Daftarkan Koperasi Anda <br /> di COOP-FLOW
          </h2>
        </div>
        <div className="flex-1 relative overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-bottom bg-no-repeat"
            style={{ backgroundImage: "url('/cooperative.jpeg')" }}
          />
        </div>
      </div>

      {/* Kolom Kanan: Form (Scrollable) */}
      <div className="w-full md:w-[72%] h-screen overflow-y-auto p-6 md:p-12 flex justify-center">
        <div className="w-full max-w-7xl">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 md:p-12">
            {/* Header Card: Back button, ikon, judul */}
            <div className="flex items-center gap-4 mb-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="w-11 h-11 flex items-center justify-center rounded-lg bg-green-100 text-green-600">
                <Building2 size={22} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-800">
                  Registrasi Koperasi
                </h1>
                <p className="text-sm text-gray-500">
                  Lengkapi data koperasi anda
                </p>
              </div>
            </div>

            <hr className="border-gray-200 mb-6" />

            <RegisterForm />
          </div>
        </div>
      </div>
    </main>
  );
}
