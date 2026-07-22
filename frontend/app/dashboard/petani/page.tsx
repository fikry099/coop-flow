'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/app/lib/axios';
import FarmerHeader from '@/app/components/dashboard/petani/PetaniHeaderWeather';
import SummaryCards from '@/app/components/dashboard/petani/SummaryCards';
import QuickMenu from '@/app/components/dashboard/petani/QuickActions';
import CalendarSection from '@/app/components/dashboard/petani/CalendarSection';
import RecentActivities from '@/app/components/dashboard/petani/RecentActivities';
import LandsView from '@/app/components/dashboard/petani/LandsView';

interface DashboardData {
  profile: {
    name: string;
    role: string;
    avatar: string | null;
    village: string;
  };
  summary: {
    total_land_ha: number;
    fertilizer_received_kg: number;
    total_transactions: number;
    main_commodity: string;
  };
  recent_activities: Array<any>;
  calendars: {
    planting: Array<any>;
    fertilizer: Array<any>;
  };
}

export default function PetaniDashboardPage() {
  const searchParams = useSearchParams();
  const currentView = searchParams.get('view');

  const [data, setData] = useState<DashboardData | null>(null);
  const [landsData, setLandsData] = useState<Array<any>>([]); 
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data dashboard utama
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const response = await api.get('/farmer/dashboard-summary');
        setData(response.data.data);
      } catch (err: any) {
        console.error('Error dashboard:', err);
        setError(err?.response?.data?.message || 'Gagal memuat data dashboard.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  // Fetch data lahan khusus ketika user membuka view lands (?view=lands)
  useEffect(() => {
    if (currentView === 'lands') {
      const fetchLands = async () => {
        try {
          const res = await api.get('/farmer/my-lands');
          setLandsData(res.data.data || []);
        } catch (err) {
          console.error('Gagal memuat data lahan:', err);
        }
      };
      fetchLands();
    }
  }, [currentView]);

  if (loading) {
    return (
      <div className="w-full max-w-md mx-auto p-8 text-center text-slate-500 text-sm font-medium">
        Memuat data dashboard...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full max-w-md mx-auto p-8 text-center text-red-500 text-sm font-medium">
        {error || 'Data tidak ditemukan.'}
      </div>
    );
  }

  if (currentView === 'lands') {
    return (
      <div className="w-full max-w-lg mx-auto space-y-6 pb-12 px-2 font-sans bg-slate-50 min-h-screen overflow-x-hidden">
        <LandsView lands={landsData} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto space-y-6 pb-12 px-2 font-sans bg-slate-50 min-h-screen overflow-x-hidden">
      <FarmerHeader
        name={data.profile?.name}
        role={data.profile?.role}
        avatar={data.profile?.avatar}
      />

      <SummaryCards
        totalLandHa={data.summary?.total_land_ha}
        fertilizerReceivedKg={data.summary?.fertilizer_received_kg}
        totalTransactions={data.summary?.total_transactions}
        mainCommodity={data.summary?.main_commodity}
      />

      <QuickMenu />

      <CalendarSection calendars={data.calendars} />

      <RecentActivities activities={data.recent_activities} />
    </div>
  );
}