
'use client';

import React from 'react';
import GreetingBanner from './GreetingBanner';
import MenuGrid from './MenuGrid';
import TaskAndActivities from './TaskAndActivities';
import TipsAlert from './TipsAlert';

interface OverviewContentProps {
  adminName: string;
}

export default function OverviewContent({ adminName }: OverviewContentProps) {
  return (
    <div className="space-y-6">
      {/* 1. Bagian Sapaan Atas */}
      <GreetingBanner adminName={adminName} />

      {/* 2. Bagian Menu Utama (8 Grid) */}
      <MenuGrid />

      {/* 3. Bagian Konten Grid Tiga Kolom Bawah */}
      <TaskAndActivities />

      {/* 4. Bagian Tips Informasi Penutup */}
      <TipsAlert />
    </div>
  );
}
