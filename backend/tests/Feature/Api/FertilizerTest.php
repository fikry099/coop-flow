<?php

namespace Tests\Feature\Api;

use App\Models\Cooperative;
use App\Models\Fertilizer;
use App\Models\User;
use App\Services\FastApiService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Mockery;
use PHPUnit\Framework\Attributes\Test;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class FertilizerTest extends TestCase
{
    use RefreshDatabase;

    protected $cooperative;
    protected $petugasUser;
    protected $petaniUser;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Inisialisasi Role
        $roles = ['petugas-koperasi', 'petani'];
        foreach ($roles as $role) {
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'api']);
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        }

        // 2. Buat Data Koperasi
        $this->cooperative = Cooperative::create([
            'name' => 'Koperasi Tani Makmur',
            'cooperative_code' => 'KOP-101',
            'province' => 'DI Yogyakarta',
            'city_koor' => 'Sleman',
            'province_id' => 34,
            'latitude' => -7.7956,
            'longitude' => 110.3695,
        ]);

        // 3. User Petugas Koperasi
        $this->petugasUser = User::factory()->create([
            'name' => 'Budi Petugas',
            'email' => 'petugas@koperasi.com',
            'cooperative_id' => $this->cooperative->id,
            'status' => 'ACTIVE',
        ]);
        $this->petugasUser->assignRole('petugas-koperasi');

        // 4. User Petani
        $this->petaniUser = User::factory()->create([
            'name' => 'Siti Petani',
            'email' => 'siti@gmail.com',
            'cooperative_id' => $this->cooperative->id,
            'status' => 'ACTIVE',
        ]);
        $this->petaniUser->assignRole('petani');

        Storage::fake('public');
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    #[Test]
    public function user_can_get_inventory_overview(): void
    {
        Fertilizer::create([
            'cooperative_id' => $this->cooperative->id,
            'name' => 'Urea',
            'current_stock_kg' => 2000,
            'minimum_stock_kg' => 1000,
            'price_per_kg' => 2500,
            'status' => 'tersedia',
        ]);

        Fertilizer::create([
            'cooperative_id' => $this->cooperative->id,
            'name' => 'NPK Phonska',
            'current_stock_kg' => 500,
            'minimum_stock_kg' => 1000,
            'price_per_kg' => 3000,
            'status' => 'menipis',
        ]);

        $response = $this->actingAs($this->petugasUser, 'sanctum')
                         ->getJson('/api/cooperative/inventory/overview');

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true,
                     'data' => [
                         'total_jenis_pupuk' => 2,
                         'total_stok_kg' => 2500,
                         'stok_menipis_jenis' => 1,
                     ]
                 ]);
    }

    #[Test]
    public function user_can_get_list_of_fertilizers(): void
    {
        Fertilizer::create([
            'cooperative_id' => $this->cooperative->id,
            'name' => 'Urea',
            'current_stock_kg' => 1000,
            'price_per_kg' => 2500,
            'status' => 'tersedia',
        ]);

        $response = $this->actingAs($this->petugasUser, 'sanctum')
                         ->getJson('/api/cooperative/fertilizers');

        $response->assertStatus(200)
                 ->assertJson(['success' => true])
                 ->assertJsonCount(1, 'data');
    }

    #[Test]
    public function petugas_can_store_new_fertilizer(): void
    {
        // Menggunakan create() tanpa butuh PHP GD Extension
        $file = UploadedFile::fake()->create('urea.jpg', 100, 'image/jpeg');

        $payload = [
            'name' => 'Pupuk Organik Super',
            'packaging_size_kg' => 50,
            'current_stock_kg' => 1200,
            'minimum_stock_kg' => 500,
            'price_per_kg' => 2000,
            'image' => $file,
        ];

        $response = $this->actingAs($this->petugasUser, 'sanctum')
                         ->postJson('/api/cooperative/fertilizers', $payload);

        $response->assertStatus(201)
                 ->assertJson(['success' => true]);

        $this->assertDatabaseHas('fertilizers', [
            'name' => 'Pupuk Organik Super',
            'cooperative_id' => $this->cooperative->id,
            'status' => 'tersedia',
        ]);
    }

    #[Test]
    public function store_fails_validation_when_required_fields_missing(): void
    {
        $payload = [
            'packaging_size_kg' => 50,
        ];

        $response = $this->actingAs($this->petugasUser, 'sanctum')
                         ->postJson('/api/cooperative/fertilizers', $payload);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['name', 'price_per_kg']);
    }

    #[Test]
    public function non_petugas_cannot_store_fertilizer(): void
    {
        $payload = [
            'name' => 'Pupuk Organik Super',
            'price_per_kg' => 2000,
        ];

        $response = $this->actingAs($this->petaniUser, 'sanctum')
                         ->postJson('/api/cooperative/fertilizers', $payload);

        $response->assertStatus(403);
    }

    #[Test]
    public function user_can_view_fertilizer_detail(): void
    {
        $fertilizer = Fertilizer::create([
            'cooperative_id' => $this->cooperative->id,
            'name' => 'Urea Subsidi',
            'current_stock_kg' => 3000,
            'price_per_kg' => 2200,
            'status' => 'tersedia',
        ]);

        $response = $this->actingAs($this->petugasUser, 'sanctum')
                         ->getJson("/api/cooperative/fertilizers/{$fertilizer->id}");

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true,
                     'data' => [
                         'id' => $fertilizer->id,
                         'name' => 'Urea Subsidi',
                     ]
                 ]);
    }

    #[Test]
    public function user_cannot_view_fertilizer_from_other_cooperative(): void
    {
        $otherCoop = Cooperative::create([
            'name' => 'Koperasi Lain',
            'cooperative_code' => 'KOP-999',
            'province' => 'Jawa Tengah',
            'city_koor' => 'Semarang',
        ]);

        $fertilizer = Fertilizer::create([
            'cooperative_id' => $otherCoop->id,
            'name' => 'Urea Koperasi Lain',
            'current_stock_kg' => 1000,
            'price_per_kg' => 2200,
        ]);

        $response = $this->actingAs($this->petugasUser, 'sanctum')
                         ->getJson("/api/cooperative/fertilizers/{$fertilizer->id}");

        $response->assertStatus(403)
                 ->assertJson(['success' => false]);
    }

    #[Test]
    public function petugas_can_update_fertilizer(): void
    {
        $fertilizer = Fertilizer::create([
            'cooperative_id' => $this->cooperative->id,
            'name' => 'Urea Lama',
            'current_stock_kg' => 200,
            'minimum_stock_kg' => 500,
            'price_per_kg' => 2200,
            'status' => 'menipis',
        ]);

        $payload = [
            'name' => 'Urea Baru Diperbarui',
            'current_stock_kg' => 1000,
            'minimum_stock_kg' => 500,
            'price_per_kg' => 2500,
        ];

        $response = $this->actingAs($this->petugasUser, 'sanctum')
                         ->putJson("/api/cooperative/fertilizers/{$fertilizer->id}", $payload);

        $response->assertStatus(200)
                 ->assertJson(['success' => true]);

        $this->assertDatabaseHas('fertilizers', [
            'id' => $fertilizer->id,
            'name' => 'Urea Baru Diperbarui',
            'status' => 'tersedia',
        ]);
    }

    #[Test]
    public function petugas_can_delete_fertilizer(): void
    {
        $fertilizer = Fertilizer::create([
            'cooperative_id' => $this->cooperative->id,
            'name' => 'Pupuk Dihapus',
            'current_stock_kg' => 100,
            'price_per_kg' => 2000,
        ]);

        $response = $this->actingAs($this->petugasUser, 'sanctum')
                         ->deleteJson("/api/cooperative/fertilizers/{$fertilizer->id}");

        $response->assertStatus(200)
                 ->assertJson(['success' => true]);

        $this->assertDatabaseMissing('fertilizers', [
            'id' => $fertilizer->id,
        ]);
    }

    #[Test]
    public function petugas_can_request_all_procurement_ai_predictions(): void
    {
        $fertilizer = Fertilizer::create([
            'cooperative_id' => $this->cooperative->id,
            'name' => 'Urea',
            'current_stock_kg' => 300,
            'minimum_stock_kg' => 1000,
            'packaging_size_kg' => 50,
            'price_per_kg' => 2500,
            'status' => 'menipis',
        ]);

        $mockFastApi = Mockery::mock(FastApiService::class);
        $mockFastApi->shouldReceive('predictProcurement')
                    ->andReturn([
                        'suggested_procurement_kg' => 1500.0,
                    ]);

        $this->app->instance(FastApiService::class, $mockFastApi);

        $response = $this->actingAs($this->petugasUser, 'sanctum')
                         ->postJson('/api/cooperative/inventory/fertilizers/predict-all');

        $response->assertStatus(200)
                 ->assertJson(['success' => true])
                 ->assertJsonStructure([
                     'success',
                     'message',
                     'data' => [
                         'overview' => [
                             'total_pengadaan_kg',
                             'total_pengadaan_bags',
                             'jenis_pupuk_count',
                         ],
                         'items'
                     ]
                 ]);

        $this->assertDatabaseHas('ai_predictions', [
            'cooperative_id' => $this->cooperative->id,
            'fertilizer_id' => $fertilizer->id,
            'status_saran' => 'DRAFT',
        ]);
    }
}