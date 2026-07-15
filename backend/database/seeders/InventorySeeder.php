<?php

namespace Database\Seeders;

use App\Models\Cooperative;
use App\Models\Fertilizer;
use App\Models\InventoryMutation;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class InventorySeeder extends Seeder
{
    public function run(): void
    {
        $cooperativeActive = Cooperative::create([
            'name'                   => 'Koperasi Desa Merah Putih Ranjeng',
            'cooperative_code'       => 'KDMP-3604-001',
            'is_activated'           => true,          
            'is_profile_completed'   => true,          
            'address'                => 'Kecamatan Ciruas, Kabupaten Serang, Banten',
            'latitude'               => -6.11234500,   
            'longitude'              => 106.23456700,
            'warehouse_capacity_ton' => 150
        ]);

        Cooperative::create([
            'name'                   => 'Koperasi Desa Merah Putih Wonosari',
            'cooperative_code'       => 'KDMP-3439-002',
            'is_activated'           => false,         
            'is_profile_completed'   => false,
        ]);

        Cooperative::create([
            'name'                   => 'Koperasi Desa Merah Putih Subang',
            'cooperative_code'       => 'KDMP-3213-003',
            'is_activated'           => false,
            'is_profile_completed'   => false,
        ]);

        $dataPupuk = [
            [
                'fertilizer_code'    => 'FPK-UREA',
                'cooperative_id'     => $cooperativeActive->id,
                'name'               => 'Urea',
                'current_stock_kg'   => 45250,
                'minimum_stock_kg'   => 20000,
                'price_per_kg'       => 2500, 
                'status'             => 'tersedia',
            ],
            [
                'fertilizer_code'    => 'FPK-NPK',
                'cooperative_id'     => $cooperativeActive->id,
                'name'               => 'NPK',
                'current_stock_kg'   => 38400,
                'minimum_stock_kg'   => 15000,
                'price_per_kg'       => 3000,
                'status'             => 'tersedia',
            ],
            [
                'fertilizer_code'    => 'FPK-ORGANIK',
                'cooperative_id'     => $cooperativeActive->id,
                'name'               => 'Pupuk Organik',
                'current_stock_kg'   => 12800,
                'minimum_stock_kg'   => 10000,
                'price_per_kg'       => 1500,
                'status'             => 'tersedia',
            ],
            [
                'fertilizer_code'    => 'FPK-SP36',
                'cooperative_id'     => $cooperativeActive->id, 
                'name'               => 'SP-36',
                'current_stock_kg'   => 8500,
                'minimum_stock_kg'   => 5000,
                'price_per_kg'       => 2800,
                'status'             => 'tersedia',
            ],
            [
                'fertilizer_code'    => 'FPK-KCL',
                'cooperative_id'     => $cooperativeActive->id,
                'name'               => 'KCl',
                'current_stock_kg'   => 7000,
                'minimum_stock_kg'   => 5000,
                'price_per_kg'       => 4000,
                'status'             => 'tersedia',
            ],
            [
                'fertilizer_code'    => 'FPK-DOLOMIT',
                'cooperative_id'     => $cooperativeActive->id,
                'name'               => 'Dolomit',
                'current_stock_kg'   => 5500,
                'minimum_stock_kg'   => 5000,
                'price_per_kg'       => 1000,
                'status'             => 'tersedia',
            ],
            [
                'fertilizer_code'    => 'FPK-ZA',
                'cooperative_id'     => $cooperativeActive->id,
                'name'               => 'ZA',
                'current_stock_kg'   => 7000, 
                'minimum_stock_kg'   => 10000,
                'price_per_kg'       => 2200,
                'status'             => 'menipis', 
            ],
        ];

        foreach ($dataPupuk as $item) {
            $fertilizer = Fertilizer::create($item);

            // 4. Berikan data histori awal (mutasi masuk)
            InventoryMutation::create([
                'fertilizer_id' => $fertilizer->id,
                'type'          => 'masuk',
                'quantity_kg'   => $item['current_stock_kg'],
                'description'   => 'Pasokan awal kuota subsidi dari gudang lini III PT Pupuk Indonesia',
                'created_at'    => now()->subDays(rand(1, 5))
            ]);
        }
    }
}