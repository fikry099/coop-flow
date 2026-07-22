<?php

namespace Tests\Feature\Api;

use App\Models\Cooperative;
use App\Models\Fertilizer;
use App\Models\ProcurementOrder;
use App\Models\ProcurementOrderItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use PHPUnit\Framework\Attributes\Test;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ProcurementOrderTest extends TestCase
{
    use RefreshDatabase;

    protected $cooperative;
    protected $petugasUser;
    protected $dinasUser;
    protected $kemenkoUser;
    protected $fertilizer;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Inisialisasi Role
        $roles = ['petugas-koperasi', 'dinas-pertanian', 'kemenko'];
        foreach ($roles as $role) {
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'api']);
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        }

        // 2. Buat Data Koperasi
        $this->cooperative = Cooperative::create([
            'name' => 'Koperasi Tani Makmur',
            'cooperative_code' => 'KOP-001',
            'province' => 'Jawa Tengah',
            'city_koor' => 'Banyumas',
            'province_id' => 33,
            'latitude' => -7.4243,
            'longitude' => 109.2301,
        ]);

        // 3. Buat User Petugas Koperasi
        $this->petugasUser = User::factory()->create([
            'name' => 'Petugas Koperasi',
            'email' => 'petugas@koperasi.com',
            'cooperative_id' => $this->cooperative->id,
            'status' => 'ACTIVE',
        ]);
        $this->petugasUser->assignRole('petugas-koperasi');

        // 4. Buat User Dinas Pertanian
        $this->dinasUser = User::factory()->create([
            'name' => 'Dinas Pertanian',
            'email' => 'dinas@pertanian.go.id',
            'city_code' => 'Banyumas',
            'status' => 'ACTIVE',
        ]);
        $this->dinasUser->assignRole('dinas-pertanian');

        // 5. Buat User Kemenko
        $this->kemenkoUser = User::factory()->create([
            'name' => 'Kemenko Pangan',
            'email' => 'kemenko@pangan.go.id',
            'status' => 'ACTIVE',
        ]);
        $this->kemenkoUser->assignRole('kemenko');

        // 6. Buat Master Data Pupuk
        $this->fertilizer = Fertilizer::create([
            'cooperative_id' => $this->cooperative->id,
            'name' => 'Pupuk NPK Phonska',
            'type' => 'Subsidi',
            'current_stock_kg' => 1000,
            'price_per_kg' => 2300,
        ]);
    }

    #[Test]
    public function petugas_koperasi_can_create_a_procurement_order(): void
    {
        DB::table('ai_predictions')->insert([
            'cooperative_id' => $this->cooperative->id,
            'fertilizer_id' => $this->fertilizer->id,
            'status_saran' => 'DRAFT',
            'analysis_meta' => json_encode(['note' => 'test']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $payload = [
            'periode_pengadaan' => 'Januari 2026',
            'items' => [
                [
                    'fertilizer_id' => $this->fertilizer->id,
                    'fertilizer_name' => $this->fertilizer->name,
                    'ai_suggested_bags' => 20,
                    'ai_suggested_kg' => 1000,
                    'final_bags_ordered' => 10,
                    'packaging_size_kg' => 50,
                    'price_per_kg' => 2300,
                    'harga_per_karung' => 115000,
                ],
            ],
        ];

        // Sesuai route: POST /api/cooperative/procurement
        $response = $this->actingAs($this->petugasUser, 'sanctum')
                         ->postJson('/api/cooperative/procurement', $payload);

        $response->assertStatus(201)
                 ->assertJson(['success' => true]);

        $this->assertDatabaseHas('procurement_orders', [
            'cooperative_id' => $this->cooperative->id,
            'status_verifikasi' => 'PENDING_DINAS',
            'total_bags_ordered' => 10,
            'total_weight_kg' => 500,
        ]);

        $this->assertDatabaseHas('ai_predictions', [
            'cooperative_id' => $this->cooperative->id,
            'fertilizer_id' => $this->fertilizer->id,
            'status_saran' => 'PROCESSED',
        ]);
    }

    #[Test]
    public function it_fails_store_when_all_item_bags_are_zero(): void
    {
        $payload = [
            'periode_pengadaan' => 'Januari 2026',
            'items' => [
                [
                    'fertilizer_id' => $this->fertilizer->id,
                    'fertilizer_name' => $this->fertilizer->name,
                    'final_bags_ordered' => 0,
                    'packaging_size_kg' => 50,
                    'price_per_kg' => 2300,
                    'harga_per_karung' => 115000,
                ],
            ],
        ];

        // Sesuai route: POST /api/cooperative/procurement
        $response = $this->actingAs($this->petugasUser, 'sanctum')
                         ->postJson('/api/cooperative/procurement', $payload);

        $response->assertStatus(422)
                 ->assertJson(['success' => false]);
    }

    #[Test]
    public function index_filters_orders_based_on_user_role(): void
    {
        ProcurementOrder::create([
            'cooperative_id' => $this->cooperative->id,
            'po_number' => 'PO-TEST-001',
            'periode_pengadaan' => 'Januari 2026',
            'status_verifikasi' => 'PENDING_DINAS',
            'status_logistik' => 'NONE',
        ]);

        // Sesuai route: GET /api/cooperative/procurement
        $responsePetugas = $this->actingAs($this->petugasUser, 'sanctum')
                                ->getJson('/api/cooperative/procurement');

        $responsePetugas->assertStatus(200)
                        ->assertJsonCount(1, 'data');

        $responseKemenko = $this->actingAs($this->kemenkoUser, 'sanctum')
                                ->getJson('/api/cooperative/procurement');

        $responseKemenko->assertStatus(200)
                        ->assertJsonCount(0, 'data');
    }

    #[Test]
    public function dinas_pertanian_can_verify_procurement_order(): void
    {
        $po = ProcurementOrder::create([
            'cooperative_id' => $this->cooperative->id,
            'po_number' => 'PO-TEST-002',
            'periode_pengadaan' => 'Januari 2026',
            'status_verifikasi' => 'PENDING_DINAS',
            'status_logistik' => 'NONE',
        ]);

        $payload = [
            'action' => 'APPROVE',
            'notes' => 'Dokumen sesuai kuota kabupaten.',
        ];

        // Sesuai route: POST /api/dinas/procurement/{id}/verify
        $response = $this->actingAs($this->dinasUser, 'sanctum')
                         ->postJson("/api/dinas/procurement/{$po->id}/verify", $payload);

        $response->assertStatus(200)
                 ->assertJson(['success' => true]);

        $this->assertDatabaseHas('procurement_orders', [
            'id' => $po->id,
            'status_verifikasi' => 'PENDING_KEMENKO',
            'notes_from_verifier' => 'Dokumen sesuai kuota kabupaten.',
        ]);
    }

    #[Test]
    public function kemenko_can_approve_procurement_order(): void
    {
        $po = ProcurementOrder::create([
            'cooperative_id' => $this->cooperative->id,
            'po_number' => 'PO-TEST-003',
            'periode_pengadaan' => 'Januari 2026',
            'status_verifikasi' => 'PENDING_KEMENKO',
            'status_logistik' => 'NONE',
        ]);

        $payload = [
            'action' => 'APPROVE',
            'notes' => 'Kuota disetujui nasional.',
        ];

        // Sesuai route: POST /api/procurement/{id}/approve-quota
        $response = $this->actingAs($this->kemenkoUser, 'sanctum')
                         ->postJson("/api/procurement/{$po->id}/approve-quota", $payload);

        $response->assertStatus(200)
                 ->assertJson(['success' => true]);

        $this->assertDatabaseHas('procurement_orders', [
            'id' => $po->id,
            'status_verifikasi' => 'APPROVED',
        ]);
    }

    #[Test]
    public function kemenko_can_dispatch_shipment_and_calculate_gis_logistics(): void
    {
        $po = ProcurementOrder::create([
            'cooperative_id' => $this->cooperative->id,
            'po_number' => 'PO-TEST-004',
            'periode_pengadaan' => 'Januari 2026',
            'status_verifikasi' => 'APPROVED',
            'status_logistik' => 'NONE',
            'origin_lat' => -6.2088,
            'origin_lng' => 106.8456,
        ]);

        // Sesuai route: POST /api/procurement/{id}/dispatch-truck
        $response = $this->actingAs($this->kemenkoUser, 'sanctum')
                         ->postJson("/api/procurement/{$po->id}/dispatch-truck");

        $response->assertStatus(200)
                 ->assertJson(['success' => true])
                 ->assertJsonStructure(['gis_info' => ['jarak_riil', 'estimasi_waktu_realistis']]);

        $this->assertDatabaseHas('procurement_orders', [
            'id' => $po->id,
            'status_logistik' => 'PROD_LINI_1_2',
        ]);
    }

    #[Test]
    public function complete_order_increments_stock_and_creates_inventory_mutation(): void
    {
        $po = ProcurementOrder::create([
            'cooperative_id' => $this->cooperative->id,
            'po_number' => 'PO-TEST-005',
            'periode_pengadaan' => 'Januari 2026',
            'status_verifikasi' => 'APPROVED',
            'status_logistik' => 'SIAP_TEBUS_LINI_4',
        ]);

        ProcurementOrderItem::create([
            'procurement_order_id' => $po->id,
            'fertilizer_id' => $this->fertilizer->id,
            'fertilizer_name' => $this->fertilizer->name,
            'final_bags_ordered' => 10,
            'final_weight_kg' => 500,
            'packaging_size_kg' => 50,
            'price_per_kg' => 2300,
            'harga_per_karung' => 115000,
            'subtotal_price' => 1150000,
        ]);

        // Sesuai route: POST /api/cooperative/procurement/{id}/complete
        $response = $this->actingAs($this->petugasUser, 'sanctum')
                         ->postJson("/api/cooperative/procurement/{$po->id}/complete");

        $response->assertStatus(200)
                 ->assertJson(['success' => true]);

        $this->assertDatabaseHas('fertilizers', [
            'id' => $this->fertilizer->id,
            'current_stock_kg' => 1500,
        ]);

        $this->assertDatabaseHas('inventory_mutations', [
            'fertilizer_id' => $this->fertilizer->id,
            'type' => 'masuk',
            'quantity_kg' => 500,
        ]);

        $this->assertDatabaseHas('procurement_orders', [
            'id' => $po->id,
            'status_logistik' => 'SELESAI',
        ]);
    }
}