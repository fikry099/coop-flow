<?php

namespace Tests\Feature\Api;

use App\Models\Cooperative;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class FieldAdminTest extends TestCase
{
    use RefreshDatabase;

    protected $cooperativeA;
    protected $cooperativeB;
    protected $petugasCoopA;
    protected $petugasCoopB;
    protected $fieldAdminA;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Buat Role Spatie untuk API dan WEB
        $roles = ['petugas-koperasi', 'admin-lapangan'];
        foreach ($roles as $role) {
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'api']);
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        }

        // 2. Buat Dua Koperasi Berbeda untuk Uji Proteksi Multi-Tenant
        $this->cooperativeA = Cooperative::create([
            'name' => 'Koperasi Tani Makmur A',
            'cooperative_code' => 'KOP-001',
            'province' => 'Jawa Tengah',
            'city_koor' => 'Banyumas',
            'province_id' => 33,
            'latitude' => -7.4243,
            'longitude' => 109.2301,
        ]);

        $this->cooperativeB = Cooperative::create([
            'name' => 'Koperasi Tani Makmur B',
            'cooperative_code' => 'KOP-002',
            'province' => 'Jawa Barat',
            'city_koor' => 'Bandung',
            'province_id' => 32,
            'latitude' => -6.9175,
            'longitude' => 107.6191,
        ]);

        // 3. User Petugas Koperasi A
        $this->petugasCoopA = User::factory()->create([
            'name' => 'Petugas Koperasi A',
            'email' => 'petugas.a@koperasi.com',
            'cooperative_id' => $this->cooperativeA->id,
            'status' => 'ACTIVE',
        ]);
        $this->petugasCoopA->assignRole('petugas-koperasi');

        // 4. User Petugas Koperasi B
        $this->petugasCoopB = User::factory()->create([
            'name' => 'Petugas Koperasi B',
            'email' => 'petugas.b@koperasi.com',
            'cooperative_id' => $this->cooperativeB->id,
            'status' => 'ACTIVE',
        ]);
        $this->petugasCoopB->assignRole('petugas-koperasi');

        // 5. Admin Lapangan Milik Koperasi A
        $this->fieldAdminA = User::factory()->create([
            'name' => 'Budi Admin Lapangan A',
            'email' => 'budi.lapangan@koperasi.com',
            'phone' => '081234567890',
            'cooperative_id' => $this->cooperativeA->id,
            'status' => 'ACTIVE',
        ]);
        $this->fieldAdminA->assignRole('admin-lapangan');
    }

    #[Test]
    public function user_can_get_list_of_field_admins_in_their_cooperative(): void
    {
        // Admin Lapangan B milik Koperasi B
        $fieldAdminB = User::factory()->create([
            'name' => 'Siti Admin Lapangan B',
            'email' => 'siti.lapangan@koperasi.com',
            'cooperative_id' => $this->cooperativeB->id,
            'status' => 'ACTIVE',
        ]);
        $fieldAdminB->assignRole('admin-lapangan');

        // Petugas Koperasi A memanggil API index
        $response = $this->actingAs($this->petugasCoopA, 'sanctum')
                         ->getJson('/api/cooperative/field-admins');

        $response->assertStatus(200)
                 ->assertJson(['success' => true])
                 ->assertJsonCount(1, 'data')
                 ->assertJsonPath('data.0.id', $this->fieldAdminA->id);
    }

    #[Test]
    public function user_can_create_a_new_field_admin(): void
    {
        $payload = [
            'name' => 'Agus Lapangan Baru',
            'email' => 'agus.baru@koperasi.com',
            'password' => 'password123',
            'phone' => '089876543210',
            'address' => 'Jl. Merdeka No. 45, Banyumas',
        ];

        $response = $this->actingAs($this->petugasCoopA, 'sanctum')
                         ->postJson('/api/cooperative/field-admins', $payload);

        $response->assertStatus(201)
                 ->assertJson(['success' => true])
                 ->assertJsonPath('data.name', 'Agus Lapangan Baru')
                 ->assertJsonPath('data.cooperative_id', $this->cooperativeA->id);

        $this->assertDatabaseHas('users', [
            'email' => 'agus.baru@koperasi.com',
            'cooperative_id' => $this->cooperativeA->id,
            'status' => 'ACTIVE',
        ]);

        $newUser = User::where('email', 'agus.baru@koperasi.com')->first();
        $this->assertTrue($newUser->hasRole('admin-lapangan'));
    }

    #[Test]
    public function validation_fails_when_creating_field_admin_with_duplicate_email(): void
    {
        $payload = [
            'name' => 'Duplikat Email',
            'email' => $this->fieldAdminA->email, // Email yang sudah terpakai
            'password' => 'password123',
        ];

        $response = $this->actingAs($this->petugasCoopA, 'sanctum')
                         ->postJson('/api/cooperative/field-admins', $payload);

        $response->assertStatus(422)
                 ->assertJson(['success' => false])
                 ->assertJsonValidationErrors(['email']);
    }

    #[Test]
    public function user_can_view_field_admin_details(): void
    {
        $response = $this->actingAs($this->petugasCoopA, 'sanctum')
                         ->getJson("/api/cooperative/field-admins/{$this->fieldAdminA->id}");

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true,
                     'data' => [
                         'id' => $this->fieldAdminA->id,
                         'name' => $this->fieldAdminA->name,
                         'email' => $this->fieldAdminA->email,
                     ]
                 ]);
    }

    #[Test]
    public function user_cannot_view_field_admin_from_another_cooperative(): void
    {
        // Petugas Koperasi B mencoba mengintip Admin Lapangan Koperasi A
        $response = $this->actingAs($this->petugasCoopB, 'sanctum')
                         ->getJson("/api/cooperative/field-admins/{$this->fieldAdminA->id}");

        $response->assertStatus(404)
                 ->assertJson(['success' => false]);
    }

    #[Test]
    public function user_can_update_field_admin(): void
    {
        $payload = [
            'name' => 'Budi Admin Lapangan Edit',
            'email' => 'budi.edited@koperasi.com',
            'phone' => '081234567899',
            'address' => 'Alamat Baru',
            'status' => 'ACTIVE',
        ];

        $response = $this->actingAs($this->petugasCoopA, 'sanctum')
                         ->putJson("/api/cooperative/field-admins/{$this->fieldAdminA->id}", $payload);

        $response->assertStatus(200)
                 ->assertJson(['success' => true])
                 ->assertJsonPath('data.name', 'Budi Admin Lapangan Edit');

        $this->assertDatabaseHas('users', [
            'id' => $this->fieldAdminA->id,
            'name' => 'Budi Admin Lapangan Edit',
            'email' => 'budi.edited@koperasi.com',
        ]);
    }

    #[Test]
    public function user_can_toggle_field_admin_status(): void
    {
        // Status awal ACTIVE -> harus berubah jadi PENDING
        $response = $this->actingAs($this->petugasCoopA, 'sanctum')
                         ->putJson("/api/cooperative/field-admins/{$this->fieldAdminA->id}/toggle-status");

        $response->assertStatus(200)
                 ->assertJson(['success' => true])
                 ->assertJsonPath('data.status', 'PENDING');

        $this->assertDatabaseHas('users', [
            'id' => $this->fieldAdminA->id,
            'status' => 'PENDING',
        ]);

        // Toggle kembali: PENDING -> ACTIVE
        $response2 = $this->actingAs($this->petugasCoopA, 'sanctum')
                          ->putJson("/api/cooperative/field-admins/{$this->fieldAdminA->id}/toggle-status");

        $response2->assertStatus(200)
                  ->assertJsonPath('data.status', 'ACTIVE');
    }

    #[Test]
    public function user_can_delete_field_admin(): void
    {
        $response = $this->actingAs($this->petugasCoopA, 'sanctum')
                         ->deleteJson("/api/cooperative/field-admins/{$this->fieldAdminA->id}");

        $response->assertStatus(200)
                 ->assertJson(['success' => true]);

        $this->assertDatabaseMissing('users', [
            'id' => $this->fieldAdminA->id,
        ]);
    }

    #[Test]
    public function user_without_cooperative_id_is_forbidden_from_managing_field_admins(): void
    {
        $userTanpaKoperasi = User::factory()->create([
            'cooperative_id' => null,
            'status' => 'ACTIVE',
        ]);

        $response = $this->actingAs($userTanpaKoperasi, 'sanctum')
                         ->getJson('/api/cooperative/field-admins');

        $response->assertStatus(403)
                 ->assertJson(['success' => false]);
    }
}