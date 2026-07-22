<?php

namespace Tests\Feature\Api;

use App\Models\Cooperative;
use App\Models\Farmer;
use App\Models\Fertilizer;
use App\Models\Land;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class TransactionTest extends TestCase
{
    use RefreshDatabase;

    protected $cooperative;
    protected $petugasUser;
    protected $farmerUser;
    protected $farmerProfile;
    protected $fertilizer;
    protected $land;

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
            'name' => 'Koperasi Tani Jaya',
            'cooperative_code' => 'KOP-888',
            'province' => 'Jawa Tengah',
            'city_koor' => 'Banyumas',
            'province_id' => 33,
            'latitude' => -7.4243,
            'longitude' => 109.2301,
        ]);

        // 3. User Petugas Koperasi
        $this->petugasUser = User::factory()->create([
            'name' => 'Petugas Kasir',
            'email' => 'kasir@koperasi.com',
            'cooperative_id' => $this->cooperative->id,
            'status' => 'ACTIVE',
        ]);
        $this->petugasUser->assignRole('petugas-koperasi');

        // 4. User Petani & Profile Farmer
        $this->farmerUser = User::factory()->create([
            'name' => 'Pak Tani Joko',
            'email' => 'joko@gmail.com',
            'cooperative_id' => $this->cooperative->id,
            'status' => 'ACTIVE',
        ]);
        $this->farmerUser->assignRole('petani');

        // Buat Profil Farmer (karena lands.farmer_id terikat ke tabel farmers)
        $this->farmerProfile = Farmer::create([
            'user_id' => $this->farmerUser->id,
            'cooperative_id' => $this->cooperative->id,
            'nik' => '3302123456789001',
            'address' => 'Desa Sukamaju',
        ]);

        // 5. Master Data Pupuk
        $this->fertilizer = Fertilizer::create([
            'cooperative_id' => $this->cooperative->id,
            'name' => 'Pupuk Urea Subsidi',
            'type' => 'Subsidi',
            'current_stock_kg' => 5000,
            'price_per_kg' => 2200,
        ]);

        // 6. Data Lahan Petani
        $this->land = Land::create([
            'farmer_id' => $this->farmerProfile->id,
            'land_name' => 'Lahan Sawah I',
            'area' => 1.5,
            'unit' => 'Ha',
            'status' => 'Milik Sendiri',
            'center_latitude' => -7.4250,
            'center_longitude' => 109.2310,
        ]);
    }

    #[Test]
    public function user_can_get_list_of_transactions(): void
    {
        Transaction::create([
            'farmer_id' => $this->farmerUser->id,
            'payment_method' => 'CASH',
            'amount_paid' => 220000,
        ]);

        $response = $this->actingAs($this->petugasUser, 'sanctum')
                         ->getJson('/api/cooperative/transaction/transactionsfix');

        $response->assertStatus(200)
                 ->assertJson(['success' => true])
                 ->assertJsonStructure([
                     'success',
                     'message',
                     'data' => [
                         'data',
                         'current_page',
                     ]
                 ]);
    }

    #[Test]
    public function user_can_filter_transactions_by_farmer_id(): void
    {
        $farmer2 = User::factory()->create([
            'name' => 'Pak Tani Budi',
            'email' => 'budi@gmail.com',
            'status' => 'ACTIVE', // Ditambahkan agar lolos check constraint database
        ]);

        Transaction::create([
            'farmer_id' => $this->farmerUser->id,
            'payment_method' => 'CASH',
            'amount_paid' => 100000,
        ]);

        Transaction::create([
            'farmer_id' => $farmer2->id,
            'payment_method' => 'TRANSFER',
            'amount_paid' => 200000,
        ]);

        $response = $this->actingAs($this->petugasUser, 'sanctum')
                         ->getJson("/api/cooperative/transaction/transactionsfix?farmer_id={$this->farmerUser->id}");

        $response->assertStatus(200)
                 ->assertJson(['success' => true])
                 ->assertJsonCount(1, 'data.data')
                 ->assertJsonPath('data.data.0.farmer_id', $this->farmerUser->id);
    }

    #[Test]
    public function user_can_store_new_transaction_with_items_and_ml_logs(): void
    {
        $payload = [
            'farmer_id' => $this->farmerUser->id,
            'payment_method' => 'CASH',
            'amount_paid' => 220000,
            'items' => [
                [
                    'fertilizer_id' => $this->fertilizer->id,
                    'actual_purchased_kg' => 100,
                    'price_per_kg' => 2200,
                    'subtotal' => 220000,
                    'original_recommended_kg' => 120,
                    'land_id' => $this->land->id,
                    'analysis_meta_snapshot' => [
                        'luas_lahan_hektar' => 1.5,
                        'jenis_komoditas' => 'Padi',
                        'fase_tanam_saat_ini' => 'Vegetatif',
                        'suhu_rata_rata_celcius' => 28.5,
                        'kelembapan_persen' => 80,
                        'curah_hujan_mm' => 150.0,
                    ]
                ]
            ]
        ];

        $response = $this->actingAs($this->petugasUser, 'sanctum')
                         ->postJson('/api/cooperative/transaction/transactionsfix', $payload);

        $response->assertStatus(201)
                 ->assertJson(['success' => true]);

        $this->assertDatabaseHas('transactions', [
            'farmer_id' => $this->farmerUser->id,
            'payment_method' => 'CASH',
            'amount_paid' => 220000,
        ]);

        $this->assertDatabaseHas('transaction_items', [
            'fertilizer_id' => $this->fertilizer->id,
            'actual_purchased_kg' => 100,
            'subtotal' => 220000,
        ]);

        // Menggunakan nama tabel 'transaction_ml_logs'
        $this->assertDatabaseHas('transaction_ml_logs', [
            'land_id' => $this->land->id,
            'fertilizer_id' => $this->fertilizer->id,
            'jenis_komoditas' => 'Padi',
            'original_recommended_kg' => 120,
            'actual_purchased_kg' => 100,
        ]);
    }

    #[Test]
    public function store_fails_validation_when_required_fields_are_missing(): void
    {
        $payload = [
            'farmer_id' => $this->farmerUser->id,
            'payment_method' => 'CASH',
        ];

        $response = $this->actingAs($this->petugasUser, 'sanctum')
                         ->postJson('/api/cooperative/transaction/transactionsfix', $payload);

        $response->assertStatus(422)
                 ->assertJson(['success' => false])
                 ->assertJsonValidationErrors(['amount_paid', 'items']);
    }

    #[Test]
    public function user_can_view_single_transaction_detail(): void
    {
        $transaction = Transaction::create([
            'farmer_id' => $this->farmerUser->id,
            'payment_method' => 'TRANSFER',
            'amount_paid' => 150000,
        ]);

        $response = $this->actingAs($this->petugasUser, 'sanctum')
                         ->getJson("/api/cooperative/transaction/transactionsfix/{$transaction->id}");

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true,
                     'data' => [
                         'id' => $transaction->id,
                         'farmer_id' => $this->farmerUser->id,
                         'payment_method' => 'TRANSFER',
                     ]
                 ]);
    }

    #[Test]
    public function show_returns_404_when_transaction_not_found(): void
    {
        $response = $this->actingAs($this->petugasUser, 'sanctum')
                         ->getJson('/api/cooperative/transaction/transactionsfix/999999');

        $response->assertStatus(404)
                 ->assertJson(['success' => false]);
    }
}