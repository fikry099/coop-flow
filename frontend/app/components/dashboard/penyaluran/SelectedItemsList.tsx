"use client";

import { FiUserCheck, FiMapPin, FiBriefcase } from "react-icons/fi";
import { SelectedFertilizerItem } from "./TransactionPanel"; 

interface SelectedItemsListProps {
  farmerName: string;
  farmerAddress: string;
  villageName: string;
  activeBags: SelectedFertilizerItem[];
  getImageUrl: (url: string | null) => string | null;
}

export default function SelectedItemsList({
  farmerName,
  farmerAddress,
  villageName,
  activeBags,
  getImageUrl,
}: SelectedItemsListProps) {
  return (
    <div className="space-y-6">
      {/* CARD INFO PETANI */}
      <div className="bg-emerald-50/40 border border-emerald-100/60 rounded-xl p-4 space-y-2.5 text-xs">
        <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
          <FiUserCheck className="text-sm" /> Rincian Penerima Subsidi
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-700">
          <div className="flex items-center gap-2">
            <FiUserCheck className="text-gray-400 shrink-0" />
            <span className="font-bold text-gray-800">{farmerName}</span>
          </div>
          <div className="flex items-center gap-2">
            <FiMapPin className="text-gray-400 shrink-0" />
            <span className="truncate max-w-[180px]">Desa {villageName}</span>
          </div>
          <div className="flex items-center gap-2 md:col-span-2">
            <FiBriefcase className="text-gray-400 shrink-0" />
            <span className="text-gray-500 truncate">{farmerAddress}</span>
          </div>
        </div>
      </div>

      {/* Ringkasan Pembelian */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Rincian Fisik Karung</h4>
        
        <div className="border border-gray-100 rounded-xl divide-y divide-gray-100 overflow-hidden bg-white max-h-[300px] overflow-y-auto">
          {activeBags.map((bag, idx) => {
            const validImageUrl = getImageUrl(bag.image_url);
            const defaultPackSize = bag.packaging_size_kg || 50;

            // KALKULASI DINAMIS JUMLAH KARUNG & ECERAN
            const fullBags = Math.floor(bag.weightKg / defaultPackSize);
            const remainderKg = Number((bag.weightKg % defaultPackSize).toFixed(2));
            const isEceran = fullBags === 0 && remainderKg > 0;

            // Keterangan teks jumlah karung (e.g. "2 Karung", "2 Karung + 10 Kg", "10 Kg")
            let bagQuantityDisplay = "";
            if (fullBags > 0 && remainderKg > 0) {
              bagQuantityDisplay = `${fullBags} Karung + ${remainderKg} Kg`;
            } else if (fullBags > 0) {
              bagQuantityDisplay = `${fullBags} Karung`;
            } else {
              bagQuantityDisplay = `${bag.weightKg} Kg`;
            }
            
            // Generate Key unik
            const uniqueReactKey = `bag-${bag.land_id}-${bag.fertilizer_id}-${idx}`;

            return (
              <div key={uniqueReactKey} className="p-4 flex items-center justify-between text-xs hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-400 w-4">{idx + 1}</span>
                  
                  <div className="w-16 h-16 bg-gray-50 rounded-xl  flex items-center justify-center overflow-hidden shrink-0 relative">
                    {validImageUrl ? (
                      <img 
                        src={validImageUrl} 
                        alt={bag.nama} 
                        className="w-full h-full object-contain animate-in fade-in duration-200" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://placehold.co/100x120/a7f3d0/065f46?text=PUPUK";
                        }}
                      />
                    ) : (
                      <div className="bg-emerald-50 text-emerald-800 text-[9px] font-bold p-1 text-center line-clamp-2">
                        {bag.fertilizer_code}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <p className="font-bold text-gray-800">{bag.nama}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-zinc-500 font-bold">{bag.weightKg} Kg</span>
                      
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide border ${
                        isEceran 
                          ? "bg-rose-50 text-rose-700 border-rose-100 animate-pulse" 
                          : "bg-blue-50 text-blue-700 border-blue-100"
                      }`}>
                        {isEceran ? "Eceran (Dikurangi)" : "Karung Utuh"}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  {/* TAMPILAN DINAMIS HASIL KALKULASI */}
                  <p className="font-bold text-zinc-700">
                    {bagQuantityDisplay}
                  </p>
                  <p className="font-extrabold text-[#115e59] mt-0.5">Rp {bag.subtotal.toLocaleString("id-ID")}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}