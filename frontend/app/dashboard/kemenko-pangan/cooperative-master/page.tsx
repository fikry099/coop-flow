"use client";

import React, { useState, useEffect } from "react";
import api from "@/app/lib/axios";

// Import Komponen Presentasional Global
import MetricCards from "@/app/components/dashboard/kemenko/MetricCards";
import FilterBar from "@/app/components/dashboard/kemenko/FilterBar";
import CooperativeTable from "@/app/components/dashboard/kemenko/CooperativeTable";
import NotificationModal from "@/app/components/dashboard/kemenko/NotificationModal";

// Definisikan struktur data agar pas dengan properti tabel visual yang baru
interface CooperativeViewData {
  id: number;
  name: string;
  legal_entity_type: string;
  province: string;
  city_koor: string;
  status: string;
  created_at?: string;
}

interface ModalState {
  isOpen: boolean;
  type: "success" | "error" | "confirm";
  title: string;
  description?: string;
  onConfirm: () => void;
}

export default function CooperativeMasterPage() {
  const [cooperatives, setCooperatives] = useState<CooperativeViewData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // State untuk modal notifikasi/konfirmasi custom
  const [modal, setModal] = useState<ModalState | null>(null);
  const closeModal = () => setModal(null);

  const fetchCooperatives = async () => {
    setLoading(true);
    try {
      const [responsePending, responseActive] = await Promise.all([
        api.get("/kemenko/registrations/pending"),
        api.get("/kemenko/registrations/active"),
      ]);

      let combinedData: CooperativeViewData[] = [];

      if (responsePending.data.success) {
        const pendingItems = responsePending.data.data.map((user: any) => ({
          id: user.id,
          name: user.cooperative?.name || user.name || "-",
          legal_entity_type:
            user.cooperative?.legal_entity_type || "Koperasi Produsen",
          province: user.cooperative?.province || "-",
          city_koor: user.cooperative?.city_koor || "-",
          status: "PENDING",
          created_at: user.created_at,
        }));
        combinedData = [...combinedData, ...pendingItems];
      }

      if (responseActive.data.success) {
        const activeItems = responseActive.data.data.map((user: any) => ({
          id: user.id,
          name: user.cooperative?.name || user.name || "-",
          legal_entity_type:
            user.cooperative?.legal_entity_type || "Koperasi Produsen",
          province: user.cooperative?.province || "-",
          city_koor: user.cooperative?.city_koor || "-",
          status: "ACTIVE",
          created_at: user.created_at,
        }));
        combinedData = [...combinedData, ...activeItems];
      }

      setCooperatives(combinedData);
    } catch (error) {
      console.error("Gagal mengambil data master koperasi:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCooperatives();
  }, []);

  const totalCoops = cooperatives.length;
  const activeCoops = cooperatives.filter((c) => c.status === "ACTIVE").length;
  const inactiveCoops = cooperatives.filter(
    (c) => c.status === "PENDING",
  ).length;
  const newThisMonth = cooperatives.filter((c) => {
    if (!c.created_at) return false;
    const date = new Date(c.created_at);
    const now = new Date();
    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  }).length;

  // Step 1: tampilkan modal konfirmasi dulu, bukan langsung eksekusi
  const handleActivateCooperative = (userId: number) => {
    setModal({
      isOpen: true,
      type: "confirm",
      title: "Aktifkan Koperasi?",
      description:
        "Apakah Anda yakin ingin menyetujui dan mengaktifkan koperasi ini?",
      onConfirm: () => confirmActivateCooperative(userId),
    });
  };

  // Step 2: baru dijalankan setelah user klik tombol konfirmasi di modal
  const confirmActivateCooperative = async (userId: number) => {
    closeModal();
    setActionLoading(userId);
    try {
      const response = await api.post(
        `/kemenko/registrations/${userId}/approve`,
      );
      if (response.data.success) {
        setModal({
          isOpen: true,
          type: "success",
          title: "Berhasil disimpan",
          description: "Koperasi berhasil diaktifkan.",
          onConfirm: closeModal,
        });
        fetchCooperatives();
      }
    } catch (error: any) {
      setModal({
        isOpen: true,
        type: "error",
        title: "Gagal mengaktifkan",
        description:
          error.response?.data?.message || "Gagal mengaktifkan koperasi.",
        onConfirm: closeModal,
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    fetchCooperatives();
  };

  const filteredData = cooperatives.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.legal_entity_type.toLowerCase().includes(search.toLowerCase()) ||
      item.province.toLowerCase().includes(search.toLowerCase()) ||
      item.city_koor.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && item.status === "ACTIVE") ||
      (statusFilter === "inactive" && item.status === "PENDING");

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F7B4A] tracking-tight">
            Cooperative Master
          </h1>
          <p className="text-sm text-zinc-500">
            Kelola dan pantau seluruh data master koperasi terdaftar di sistem
            pusat nasional.
          </p>
        </div>
      </div>

      <MetricCards
        total={totalCoops}
        active={activeCoops}
        inactive={inactiveCoops}
        newThisMonth={newThisMonth}
      />

      <FilterBar
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onReset={handleResetFilters}
      />

      <CooperativeTable
        data={filteredData}
        loading={loading}
        actionLoading={actionLoading}
        onActivate={handleActivateCooperative}
      />

      {/* Modal notifikasi/konfirmasi custom, ganti confirm()/alert() bawaan browser */}
      {modal && (
        <NotificationModal
          isOpen={modal.isOpen}
          type={modal.type}
          title={modal.title}
          description={modal.description}
          onConfirm={modal.onConfirm}
          onCancel={closeModal}
        />
      )}
    </div>
  );
}
