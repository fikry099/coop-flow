'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import api from '../../lib/axios'; 

// Import Komponen Hasil Pemecahan File
import Sidebar from '@/app/components/dashboard/Sidebar';
import Navbar from '@/app/components/dashboard/Navbar';
import OverviewContent from '@/app/components/dashboard/OverviewContent';

// Konfigurasi Toast kecil kanan atas agar konsisten
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  }
});

export default function AdminLapanganDashboard() {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [adminName, setAdminName] = useState('Admin Lapangan');

  useEffect(() => {
    const profile = localStorage.getItem('user_profile');
    if (profile) {
      const parsed = JSON.parse(profile);
      if (parsed.name) setAdminName(parsed.name);
    }
  }, []);

  const handleLogout = () => {
    Swal.fire({
      title: 'Apakah anda yakin?',
      text: "Sesi login operasional Anda akan berakhir.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#10b981', // Emerald 500
      cancelButtonColor: '#ef4444', // Red 500
      confirmButtonText: 'Ya, Keluar!',
      cancelButtonText: 'Batal',
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'rounded-xl px-4 py-2 font-medium',
        cancelButton: 'rounded-xl px-4 py-2 font-medium'
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // 1. Kirim request logout ke backend Laravel
          await api.post('/logout');
        } catch (error) {
          console.error('Backend logout error / token expired:', error);
        } finally {
          // 2. Apapun hasilnya, bersihkan seluruh data auth di client-side
          localStorage.clear();
          document.cookie = "access_token=; path=/; max-age=0;";

          // 3. Tampilkan Toast Sukses kecil di kanan atas
          Toast.fire({
            icon: 'success',
            title: 'Berhasil Keluar! Sesi Anda berakhir.'
          });

          // 4. Lemparkan kembali ke halaman auth login
          router.push('/auth/login');
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex text-zinc-800 antialiased font-sans">
      {/* 1. Sidebar */}
      <Sidebar isOpen={isSidebarOpen} handleLogout={handleLogout} />
      
      {/* Main Panel Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 bg-zinc-50">
        {/* 2. Top Navbar - Kirim juga handleLogout ke sini */}
        <Navbar 
          isOpen={isSidebarOpen} 
          setIsOpen={setIsSidebarOpen} 
          adminName={adminName} 
          handleLogout={handleLogout} 
        />
        
        {/* 3. Main Operational Content */}
        <OverviewContent />
      </div>
    </div>
  );
}