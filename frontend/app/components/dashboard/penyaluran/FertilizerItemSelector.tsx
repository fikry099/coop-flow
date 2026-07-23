"use client";

import { useState, useEffect, useRef } from "react";
import { CustomFertilizerItem } from "./LandPredictionCard";
import FertilizerSwapModal from "./FertilizerSwapModal"; 
import { FaPlus, FaMinus, FaRightLeft, FaCheck, FaGaugeHigh } from "react-icons/fa6";

export interface SelectedBagItem {
  bagKey: string;
  index: number;
  fertilizerCode: string;
  weightKg: number;
  isChecked: boolean;
  details: CustomFertilizerItem;
}

interface FertilizerItemSelectorProps {
  recommendations: CustomFertilizerItem[];
  onSelectionChange: (summary: { 
    totalBags: number; 
    totalCost: number; 
    totalKg: number;
    selectedItems: SelectedBagItem[];
  }) => void;
}

interface BagState {
  key: string;      
  index: number;      
  isChecked: boolean;
  selectedType: string; 
  weightKg: number;    
  fertilizer_id?: number | null;
  customDetails?: CustomFertilizerItem; 
}

export default function FertilizerItemSelector({ recommendations, onSelectionChange }: FertilizerItemSelectorProps) {
  const [activeItemIndex, setActiveItemIndex] = useState<number>(0);
  const [bags, setBags] = useState<BagState[]>([]);
  const [targetTypeToSwap, setTargetTypeToSwap] = useState<string | null>(null);
  
  // State untuk kontrol Modal Tambah Pupuk Baru
  const [isAddingNewType, setIsAddingNewType] = useState<boolean>(false);

  const prevRecommendationsRef = useRef<CustomFertilizerItem[]>(recommendations);
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  
  // PATOKAN UTAMA AI (STATIS)
  const originalAiRecommendation = recommendations[0];

  // Helper formatting URL Gambar
  const getCleanImageUrl = (rawPath?: string | null) => {
    if (!rawPath) return "https://placehold.co/100x120/a7f3d0/065f46?text=PUPUK";
    if (rawPath.startsWith("http://") || rawPath.startsWith("https://")) {
      return rawPath;
    }
    const cleanPath = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
    return `${baseUrl}${cleanPath}`.replace(/([^:]\/)\/+/g, "$1");
  };

  const getFertilizerDetails = (bag: BagState): CustomFertilizerItem => {
    if (bag.customDetails) return bag.customDetails;
    const match = recommendations.find(item => item.fertilizer_code?.toLowerCase() === bag.selectedType.toLowerCase());
    return match || originalAiRecommendation;
  };

const getSummary = (currentBags: BagState[]) => {
    let totalCostChecked = 0;
    let totalBagsChecked = 0;
    let totalKgChecked = 0;
    const selectedItems: SelectedBagItem[] = [];

    // 1. Grouping dulu bags berdasarkan jenis pupuk
    const localGroupedMap = currentBags.reduce((acc, bag) => {
      const type = bag.selectedType;
      if (!acc[type]) {
        acc[type] = {
          bags: [],
          totalKg: 0,
          isChecked: bag.isChecked,
        };
      }
      acc[type].bags.push(bag);
      if (bag.isChecked) {
        acc[type].totalKg += bag.weightKg;
      }
      return acc;
    }, {} as Record<string, { bags: BagState[]; totalKg: number; isChecked: boolean }>);

    // 2. Buat hanya 1 record per jenis pupuk yang dikirim ke checkout
    Object.entries(localGroupedMap).forEach(([type, group], groupIndex) => {
      const firstBag = group.bags[0];
      const details = getFertilizerDetails(firstBag);
      const resolvedDetails = {
        ...details,
        fertilizer_id: firstBag.fertilizer_id || details.fertilizer_id || (details as any).id || null
      };

      const groupTotalKg = Number(group.totalKg.toFixed(2));

      selectedItems.push({
        bagKey: `group-${type}-${groupIndex}`,
        index: groupIndex + 1,
        fertilizerCode: type,
        weightKg: groupTotalKg,
        isChecked: group.isChecked,
        details: resolvedDetails
      });

      if (group.isChecked) {
        const actualGroupPrice = Math.round(details.price_per_kg * groupTotalKg);
        totalCostChecked += actualGroupPrice;
        totalBagsChecked += group.bags.length;
        totalKgChecked += groupTotalKg;
      }
    });

    return { 
      totalBags: totalBagsChecked, 
      totalCost: totalCostChecked, 
      totalKg: Number(totalKgChecked.toFixed(2)),
      selectedItems
    };
  };

  // Helper membuat bag berdasarkan target Kg
  const createBagsFromTargetKg = (targetItem: CustomFertilizerItem, targetKgValue?: number): BagState[] => {
    const totalTargetKg = targetKgValue ?? (targetItem.total_recommended_kg || targetItem.original_recommended_kg || 50);
    const packagingSize = targetItem.packaging_size_kg || 50;
    const cleanName = targetItem.fertilizer_code || "NPK";
    const fId = targetItem.fertilizer_id || (targetItem as any).id || null;

    const fullBagsCount = Math.floor(totalTargetKg / packagingSize);
    const remainderKg = Number((totalTargetKg % packagingSize).toFixed(2));

    const generatedBags: BagState[] = [];

    for (let i = 0; i < fullBagsCount; i++) {
      generatedBags.push({
        key: `bag-full-${i + 1}-${Date.now()}`,
        index: i + 1,
        isChecked: true,
        selectedType: cleanName,
        weightKg: packagingSize,
        fertilizer_id: fId ? Number(fId) : null,
        customDetails: targetItem,
      });
    }

    if (remainderKg > 0) {
      generatedBags.push({
        key: `bag-remainder-${Date.now()}`,
        index: generatedBags.length + 1,
        isChecked: true,
        selectedType: cleanName,
        weightKg: remainderKg,
        fertilizer_id: fId ? Number(fId) : null,
        customDetails: targetItem,
      });
    }

    if (generatedBags.length === 0 && totalTargetKg > 0) {
      generatedBags.push({
        key: `bag-single-${Date.now()}`,
        index: 1,
        isChecked: true,
        selectedType: cleanName,
        weightKg: totalTargetKg,
        fertilizer_id: fId ? Number(fId) : null,
        customDetails: targetItem,
      });
    }

    return generatedBags;
  };

  useEffect(() => {
    const isRecommendationsChanged = JSON.stringify(prevRecommendationsRef.current) !== JSON.stringify(recommendations);
    
    if (recommendations.length > 0 && (bags.length === 0 || isRecommendationsChanged)) {
      prevRecommendationsRef.current = recommendations;
      const defaultItem = recommendations[0];
      const initialBags = createBagsFromTargetKg(defaultItem);

      setBags(initialBags);
      setActiveItemIndex(0);
      onSelectionChange(getSummary(initialBags));
    }
  }, [recommendations]);

  // Grouping Data
  const groupedBagsMap = bags.reduce((acc, bag) => {
    const type = bag.selectedType;
    if (!acc[type]) {
      acc[type] = {
        type,
        fullBagsCount: 0,
        extraKg: 0,
        totalKg: 0,
        isChecked: bag.isChecked,
        fertilizer_id: bag.fertilizer_id,
        details: getFertilizerDetails(bag),
        originalBags: []
      };
    }
    acc[type].originalBags.push(bag);
    if (bag.isChecked) {
      const standardSize = acc[type].details.packaging_size_kg || 50;
      if (bag.weightKg === standardSize) {
        acc[type].fullBagsCount += 1;
      } else {
        acc[type].extraKg = Number((acc[type].extraKg + bag.weightKg).toFixed(2));
      }
      acc[type].totalKg = Number((acc[type].totalKg + bag.weightKg).toFixed(2));
    }
    return acc;
  }, {} as Record<string, { type: string; fullBagsCount: number; extraKg: number; totalKg: number; isChecked: boolean; fertilizer_id: any; details: CustomFertilizerItem; originalBags: BagState[] }>);

  const groupedBagsList = Object.values(groupedBagsMap);

  const handleToggleGroup = (type: string) => {
    const currentStatus = groupedBagsMap[type]?.isChecked;
    const updated = bags.map(bag => bag.selectedType === type ? { ...bag, isChecked: !currentStatus } : bag);
    setBags(updated);
    onSelectionChange(getSummary(updated));
  };

  // Ubah Karung Utuh (Atas)
  const handleModifyFullBagCount = (type: string, delta: number) => {
    const sampleBag = groupedBagsMap[type]?.originalBags[0];
    const defaultWeight = sampleBag?.customDetails?.packaging_size_kg || 50;

    if (delta > 0) {
      const newBag: BagState = {
        key: `bag-full-${Date.now()}-${bags.length + 1}`,
        index: bags.length + 1,
        isChecked: true,
        selectedType: type,
        weightKg: defaultWeight,
        fertilizer_id: sampleBag?.fertilizer_id || null,
        customDetails: sampleBag?.customDetails || originalAiRecommendation
      };
      const updated = [...bags, newBag];
      setBags(updated);
      onSelectionChange(getSummary(updated));
    } else {
      const fullBags = bags.filter(b => b.selectedType === type && b.weightKg === defaultWeight);
      if (fullBags.length <= 1) return;
      const lastFullBagKey = fullBags[fullBags.length - 1].key;
      const updated = bags.filter(b => b.key !== lastFullBagKey);
      setBags(updated);
      onSelectionChange(getSummary(updated));
    }
  };

  // Ubah Kg Eceran (Bawah)
  const handleModifyExtraKg = (type: string, deltaKg: number) => {
    const group = groupedBagsMap[type];
    if (!group) return;

    const extraBags = bags.filter(b => b.selectedType === type && b.weightKg !== (group.details.packaging_size_kg || 50));

    if (extraBags.length > 0) {
      const updated = bags.map(b => {
        if (b.key === extraBags[0].key) {
          const newWeight = Math.max(0, Number((b.weightKg + deltaKg).toFixed(2)));
          return { ...b, weightKg: newWeight };
        }
        return b;
      }).filter(b => b.weightKg > 0);

      setBags(updated);
      onSelectionChange(getSummary(updated));
    } else if (deltaKg > 0) {
      const customBag: BagState = {
        key: `bag-custom-${Date.now()}`,
        index: bags.length + 1,
        isChecked: true,
        selectedType: type,
        weightKg: deltaKg,
        fertilizer_id: group.fertilizer_id,
        customDetails: group.details
      };
      const updated = [...bags, customBag];
      setBags(updated);
      onSelectionChange(getSummary(updated));
    }
  };

  // Ganti Jenis Pupuk yang Ada (Swap)
  const handleSwapGroupType = (oldType: string, newFertilizerItem: CustomFertilizerItem) => {
    const oldGroup = groupedBagsMap[oldType];
    const currentTotalKg = oldGroup ? oldGroup.totalKg : (originalAiRecommendation?.total_recommended_kg || 50);

    const newBags = createBagsFromTargetKg(newFertilizerItem, currentTotalKg);
    
    const remainingBags = bags.filter(b => b.selectedType !== oldType);
    const updated = [...remainingBags, ...newBags];

    setBags(updated);
    setTargetTypeToSwap(null);
    onSelectionChange(getSummary(updated));
  };

  // Tambah Jenis Pupuk Baru (Add New)
  const handleAddNewFertilizerType = (newFertilizerItem: CustomFertilizerItem) => {
    // Default awal ketika menambah pupuk baru: 1 Karung utuh
    const defaultKg = newFertilizerItem.packaging_size_kg || 50;
    const newBags = createBagsFromTargetKg(newFertilizerItem, defaultKg);

    const updated = [...bags, ...newBags];
    setBags(updated);
    setIsAddingNewType(false);
    onSelectionChange(getSummary(updated));
  };

  const { totalCost: totalCostChecked, totalKg: totalKgChecked, totalBags: totalBagsChecked } = getSummary(bags);
  
  // TEKS REKOMENDASI PATOKAN ASLI DARI AI
  const aiRecommendedKg = originalAiRecommendation?.total_recommended_kg || originalAiRecommendation?.original_recommended_kg || 50;
  const aiPackagingSize = originalAiRecommendation?.packaging_size_kg || 50;
  const aiFullBags = Math.floor(aiRecommendedKg / aiPackagingSize);
  const aiExtraKg = Number((aiRecommendedKg % aiPackagingSize).toFixed(2));
  const aiFormattedDoseText = aiExtraKg > 0 
    ? `${aiFullBags} Karung + ${aiExtraKg} Kg` 
    : `${aiFullBags} Karung`;

  return (
    <div className="space-y-4 font-sans text-gray-800">
      
      {/* 1. HIGHLIGHT BANNER REKOMENDASI DOSIS AI */}
      <div className="w-full bg-emerald-100/70 border border-emerald-300 p-3.5 rounded-2xl flex items-center justify-between text-xs shadow-3xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
            <FaGaugeHigh className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-emerald-800 block">Rekomendasi Dosis Optimal Sistem:</span>
            <p className="text-emerald-950 font-bold text-sm">
              Kebutuhan Pupuk Di Lahan Ini: <span className="text-emerald-700 font-extrabold">{aiFormattedDoseText} ({aiRecommendedKg} Kg)</span> Dengan Jenis {originalAiRecommendation?.fertilizer_code || "NPK"}
            </p>
          </div>
        </div>
      </div>

      {/* 2. KOTAK KONTROL & DETAIL PUPUK DIPILIH */}
      {groupedBagsList.map((group) => {
        const currentDoseText = group.extraKg > 0 
          ? `${group.fullBagsCount} Karung + ${group.extraKg} Kg` 
          : `${group.fullBagsCount} Karung`;

        return (
          <div key={group.type} className="space-y-3">
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-3xs flex flex-wrap items-center justify-between gap-3">
              
              {/* UKURAN KEMASAN + HASIL KONVERSI PUPUK DIPILIH */}
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
                  PILIH KAPASITAS UKURAN KEMASAN KARUNG :
                </span>
                <button className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-2xs flex items-center gap-1.5">
                  Kemasan {group.details.packaging_size_kg || 50} Kg
                </button>

                {/* HASIL KONVERSI DINAMIS SETELAH DI-SWAP */}
                <div className="pt-1">
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 inline-block">
                    Kebutuhan Jenis Ini: <span className="font-extrabold text-emerald-700">{currentDoseText} ({group.totalKg} Kg)</span>
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block text-center">
                  ATUR JUMLAH KARUNG PUPUK LAHAN INI:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={group.fullBagsCount <= 1}
                    onClick={() => handleModifyFullBagCount(group.type, -1)}
                    className="w-8 h-8 rounded-lg border border-gray-300 bg-gray-50 flex items-center justify-center font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-30"
                  >
                    <FaMinus className="w-2.5 h-2.5" />
                  </button>
                  <div className="px-3 py-1 bg-white border border-gray-200 rounded-xl text-center min-w-[70px]">
                    <span className="block font-black text-sm text-gray-800">{group.fullBagsCount}</span>
                    <span className="block text-[9px] font-bold text-gray-400 -mt-1">Karung</span>
                  </div>
                  <button
                    onClick={() => handleModifyFullBagCount(group.type, 1)}
                    className="w-8 h-8 rounded-lg border border-gray-300 bg-gray-50 flex items-center justify-center font-bold text-gray-700 hover:bg-gray-100"
                  >
                    <FaPlus className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* KARTU DETAIL PUPUK + KONTROL KG ECERAN */}
            <div className={`p-4 bg-white rounded-2xl border border-gray-200 shadow-3xs transition-all space-y-3 ${
              !group.isChecked ? "opacity-50 bg-gray-50" : ""
            }`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div 
                    onClick={() => handleToggleGroup(group.type)}
                    className={`w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                      group.isChecked ? "bg-emerald-500 text-white" : "border-2 border-gray-300 bg-white"
                    }`}
                  >
                    {group.isChecked && <FaCheck className="w-3 h-3" />}
                  </div>

                  <div className="w-16 h-16 bg-emerald-50 rounded-xl flex items-center justify-center overflow-hidden">
                    <img 
                      src={getCleanImageUrl(group.details.image_url)} 
                      alt={group.details.nama} 
                      className="h-full w-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://placehold.co/100x120/a7f3d0/065f46?text=PUPUK";
                      }}
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-gray-900 text-sm">{group.details.nama}</span>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md text-[9px] font-extrabold">
                        Pilihan Anda
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-400 font-medium">Karung</span>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-black text-gray-900 text-sm">
                    Rp {Math.round(group.details.price_per_kg * group.totalKg).toLocaleString("id-ID")}
                  </p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">
                    {group.details.fertilizer_code} - FPK
                  </p>
                </div>
              </div>

              {/* BARIS BAWAH: SWAP & KONTROL KG ECERAN */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <button
                  onClick={() => setTargetTypeToSwap(group.type)}
                  className="text-emerald-600 hover:text-emerald-800 font-bold text-xs flex items-center gap-1.5"
                >
                  <FaRightLeft className="w-3 h-3" /> Ganti Jenis
                </button>

                {/* KONTROL KG ECERAN */}
                <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-200">
                  <button
                    disabled={group.extraKg <= 0}
                    onClick={() => handleModifyExtraKg(group.type, -1)}
                    className="w-6 h-6 rounded-md bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                  >
                    <FaMinus className="w-2 h-2" />
                  </button>
                  <span className="font-extrabold text-xs text-gray-800 px-2">
                    {group.extraKg} Kg
                  </span>
                  <button
                    onClick={() => handleModifyExtraKg(group.type, 1)}
                    className="w-6 h-6 rounded-md bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100"
                  >
                    <FaPlus className="w-2 h-2" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* --- TOMBOL TAMBAH PUPUK BARU --- */}
      <button
        type="button"
        onClick={() => setIsAddingNewType(true)}
        className="w-full py-3 px-4 border-2 border-dashed border-emerald-400 hover:border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-2xs active:scale-[0.99]"
      >
        <FaPlus className="w-3.5 h-3.5" />
        <span>Tambah Jenis Pupuk Lain</span>
      </button>

      {/* 3. TOTAL RINGKASAN BAWAH */}
      <div className="pt-2 border-t border-gray-200 flex justify-between items-end text-xs">
        <div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">TOTAL BERAT DIPILIH:</span>
          <span className="font-black text-gray-900 text-base">
            {totalBagsChecked} Karung{" "}
            <span className="text-gray-500 font-extrabold text-sm">({totalKgChecked} kg)</span>
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">SUBTOTAL BIAYA LAHAN:</span>
          <span className="font-black text-emerald-600 text-lg">
            Rp {totalCostChecked.toLocaleString("id-ID")}
          </span>
        </div>
      </div>

      {/* MODAL SWAP / GANTI JENIS PUPUK */}
      <FertilizerSwapModal
        isOpen={targetTypeToSwap !== null}
        onClose={() => setTargetTypeToSwap(null)} 
        bagIndex={1}
        selectedType={targetTypeToSwap || ""} 
        recommendations={recommendations}
        baseUrl={baseUrl}
        currentTotalKg={targetTypeToSwap ? groupedBagsMap[targetTypeToSwap]?.totalKg : undefined}
        onSelectType={(fertilizerItem) => {
          if (targetTypeToSwap) {
            handleSwapGroupType(targetTypeToSwap, fertilizerItem);
          }
        }}
      />

      {/* MODAL TAMBAH PUPUK BARU */}
      <FertilizerSwapModal
        isOpen={isAddingNewType}
        onClose={() => setIsAddingNewType(false)} 
        bagIndex={1}
        selectedType="" 
        recommendations={recommendations}
        baseUrl={baseUrl}
        onSelectType={(fertilizerItem) => {
          handleAddNewFertilizerType(fertilizerItem);
        }}
      />
    </div>
  );
}