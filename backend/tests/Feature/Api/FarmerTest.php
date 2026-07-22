<?php

namespace Tests\Feature\Api;

use App\Models\Farmer;
use App\Models\FarmerGroup;
use App\Models\Land;
use App\Models\Plant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravolt\Indonesia\Models\City;
use Laravolt\Indonesia\Models\District;
use Laravolt\Indonesia\Models\Province;
use Laravolt\Indonesia\Models\Village;
use PHPUnit\Framework\Attributes\Test;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class FarmerTest extends TestCase
{
    use RefreshDatabase;

    protected $user;
    protected $province;
    protected $city;
    protected $district;
    protected $village;
    protected $farmerGroup;

    protected function setUp(): void
    {
        parent::setUp();

        // 0. Buat Role 'petani' untuk Guard API & Web
        $rolePetani = Role::firstOrCreate(['name' => 'petani', 'guard_name' => 'api']);
        Role::firstOrCreate(['name' => 'petani', 'guard_name' => 'web']);

        // 1. Buat User untuk Autentikasi Sanctum dan beri role petani
        $this->user = User::factory()->create();
        $this->user->assignRole($rolePetani);

        // 2. Mock Data Wilayah Menggunakan Laravolt Indonesia
        $this->province = Province::create([
            'code' => '33',
            'name' => 'JAWA TENGAH',
        ]);

        $this->city = City::create([
            'code' => '3302',
            'province_code' => '33',
            'name' => 'KABUPATEN BANYUMAS',
        ]);

        $this->district = District::create([
            'code' => '330201',
            'city_code' => '3302',
            'name' => 'PURWOKERTO SELATAN',
        ]);

        $this->village = Village::create([
            'code' => '3302011001', // Kode desa 10 digit
            'district_code' => '330201',
            'name' => 'KARANGKLESEM',
        ]);

        // 3. Mock Kelompok Tani
        $this->farmerGroup = FarmerGroup::create(['name' => 'Tani Maju']);
    }

    #[Test]
    public function it_can_list_all_farmers(): void
    {
        Farmer::create([
            'user_id' => $this->user->id,
            'farmer_group_id' => $this->farmerGroup->id,
            'nik' => '3302123456789001',
            'province_id' => $this->province->id,
            'city_id' => $this->city->id,
            'district_id' => $this->district->id,
            'village_id' => $this->village->id,
            'total_land_area' => 1000,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
                         ->getJson('/api/farmers');

        $response->assertOk();
        $this->assertNotEmpty($response->json());
    }

    #[Test]
    public function it_can_create_a_new_farmer(): void
    {
        $payload = [
            'name' => 'Budi Petani',
            'email' => 'budi.new.farmer@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'farmer_group_id' => $this->farmerGroup->id,
            'nik' => '3302123456789002',
            'province_id' => $this->province->id,
            'city_id' => $this->city->id,
            'district_id' => $this->district->id,
            'village_id' => $this->village->id,
            'total_land_area' => 1500,
            'notes' => 'Catatan tes',
            'lands' => [
                [
                    'land_name' => 'Sawah Utama',
                    'area' => 1500,
                    'unit' => 'Hektar(Ha)',
                    'status' => 'Milik Sendiri',
                    'soil_type' => 'Lempung',
                    'water_source' => 'Irigasi',
                    'province_id' => $this->province->id,
                    'city_id' => $this->city->id,
                    'district_id' => $this->district->id,
                    'village_id' => $this->village->id,
                ]
            ]
        ];

        $response = $this->actingAs($this->user, 'sanctum')
                         ->postJson('/api/farmers', $payload);

        if ($response->status() !== 201) {
            $response->dump();
        }

        $response->assertStatus(201);
        $this->assertDatabaseHas('farmers', ['nik' => '3302123456789002']);
    }

    #[Test]
    public function it_can_get_my_lands(): void
    {
        $farmer = Farmer::create([
            'user_id' => $this->user->id,
            'farmer_group_id' => $this->farmerGroup->id,
            'nik' => '3302123456789003',
            'province_id' => $this->province->id,
            'city_id' => $this->city->id,
            'district_id' => $this->district->id,
            'village_id' => $this->village->id,
            'total_land_area' => 1000,
        ]);

        Land::create([
            'farmer_id' => $farmer->id,
            'land_name' => 'Lahan Milik Petani',
            'province_id' => $this->province->id,
            'city_id' => $this->city->id,
            'district_id' => $this->district->id,
            'village_id' => $this->village->id,
            'area' => 1000,
            'unit' => 'm2',
            'soil_type' => 'Lempung',
            'water_source' => 'Irigasi',
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
                         ->getJson('/api/farmer/my-lands');

        $response->assertOk()
                 ->assertJson([
                     'success' => true,
                     'message' => 'Berhasil memuat data lahan petani.',
                 ])
                 ->assertJsonCount(1, 'data');
    }

    #[Test]
    public function it_can_get_dashboard_summary(): void
    {
        $farmer = Farmer::create([
            'user_id' => $this->user->id,
            'farmer_group_id' => $this->farmerGroup->id,
            'nik' => '3302123456789004',
            'province_id' => $this->province->id,
            'city_id' => $this->city->id,
            'district_id' => $this->district->id,
            'village_id' => $this->village->id,
            'total_land_area' => 2000,
        ]);

        Land::create([
            'farmer_id' => $farmer->id,
            'land_name' => 'Lahan Ringkasan',
            'province_id' => $this->province->id,
            'city_id' => $this->city->id,
            'district_id' => $this->district->id,
            'village_id' => $this->village->id,
            'area' => 2.5,
            'unit' => 'ha',
            'soil_type' => 'Lempung',
            'water_source' => 'Irigasi',
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
                         ->getJson('/api/farmer/dashboard-summary');

        $response->assertOk()
                 ->assertJson([
                     'success' => true,
                     'message' => 'Berhasil memuat data dashboard petani.',
                 ])
                 ->assertJsonStructure([
                     'success',
                     'message',
                     'data' => [
                         'profile' => ['name', 'role', 'avatar', 'village'],
                         'summary' => [
                             'total_land_ha',
                             'fertilizer_received_kg',
                             'total_transactions',
                             'main_commodity',
                         ],
                         'recent_activities',
                         'calendars' => ['planting', 'fertilizer'],
                     ]
                 ]);
    }

    #[Test]
    public function it_can_get_fertilizer_recommendation(): void
    {
        Http::preventStrayRequests();

        Http::fake([
            '*' => Http::response([
                'recommended_dosage_kg' => 125.50
            ], 200)
        ]);

        $farmer = Farmer::create([
            'user_id' => $this->user->id,
            'farmer_group_id' => $this->farmerGroup->id,
            'nik' => '3302123456789005',
            'province_id' => $this->province->id,
            'city_id' => $this->city->id,
            'district_id' => $this->district->id,
            'village_id' => $this->village->id,
            'total_land_area' => 2000,
        ]);

        $land = Land::create([
            'farmer_id' => $farmer->id,
            'land_name' => 'Lahan Sawah 1',
            'province_id' => $this->province->id,
            'city_id' => $this->city->id,
            'district_id' => $this->district->id,
            'village_id' => $this->village->id,
            'area' => 10000,
            'unit' => 'm2',
            'soil_type' => 'Lempung',
            'water_source' => 'Irigasi',
            'irrigation_type' => 'Teknis',
            'average_temperature' => 28.5,
            'average_humidity' => 80,
            'average_monthly_precipitation' => 150,
        ]);

        Plant::create([
            'land_id' => $land->id,
            'name' => 'Padi',
            'current_phase' => 'Vegetatif',
            'planting_date' => now()->subDays(20),
            'last_fertilizer_type' => 'NPK',
            'last_fertilizer_amount' => 50,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
                         ->postJson("/api/farmers/lands/{$land->id}/fertilizer-recommendation");

        $response->assertOk()
                 ->assertJson([
                     'success' => true,
                     'message' => 'Rekomendasi pupuk berhasil dihitung!',
                 ])
                 ->assertJsonStructure([
                     'data' => [
                         'recommendations' => [
                             '*' => [
                                 'id',
                                 'fertilizer_code',
                                 'nama',
                                 'fungsi',
                                 'price_per_kg',
                                 'harga_per_karung',
                                 'jumlah_karung',
                                 'is_ml',
                                 'original_recommended_kg',
                                 'analysis_meta'
                             ]
                         ]
                     ]
                 ]);
    }
}