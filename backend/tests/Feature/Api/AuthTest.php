<?php

namespace Tests\Feature\Api;

use App\Models\Cooperative;
use App\Models\Farmer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected $cooperative;

    protected function setUp(): void
    {
        parent::setUp();

        $roles = [
            'petani',
            'ketua-poktan',
            'dinas-pertanian',
            'petugas-koperasi',
            'admin-lapangan',
            'kemenko-pangan',
        ];

        foreach ($roles as $roleName) {
            Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'api']);
            Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
        }

        $this->cooperative = Cooperative::create([
            'name' => 'Koperasi Tani Makmur',
            'cooperative_code' => 'KOP-001',
        ]);
    }

    #[Test]
    public function it_can_register_a_farmer_successfully(): void
    {
        $payload = [
            'name' => 'Petani Budi',
            'email' => 'budi.petani@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'phone' => '081234567890',
            'role' => 'petani',
            'cooperative_id' => $this->cooperative->id,
            'nik' => '3302123456789001',
            'province_code' => '33',
            'city_code' => '3302',
            'district_code' => '3302010',
            'village_code' => '3302011001',
        ];

        $response = $this->postJson('/api/register', $payload);

        $response->assertStatus(201);

        $this->assertDatabaseHas('users', [
            'email' => 'budi.petani@example.com',
            'cooperative_id' => $this->cooperative->id,
            'status' => 'ACTIVE',
        ]);

        $this->assertDatabaseHas('farmers', [
            'nik' => '3302123456789001',
        ]);
    }

    #[Test]
    public function it_fails_registration_validation_when_required_fields_are_missing(): void
    {
        $response = $this->postJson('/api/register', []);

        // Assert HTTP Status 422
        $response->assertStatus(422);

        // Langsung cek key di root JSON array response milik AuthController
        $response->assertJsonStructure([
            'name',
            'email',
            'password',
        ]);
    }

    #[Test]
    public function it_registers_non_farmer_role_as_pending(): void
    {
        $payload = [
            'name' => 'Petugas Koperasi Agus',
            'email' => 'agus.koperasi@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'phone' => '089876543210',
            'role' => 'petugas-koperasi',
            'cooperative_id' => $this->cooperative->id,
        ];

        $response = $this->postJson('/api/register', $payload);

        $response->assertStatus(201);

        $this->assertDatabaseHas('users', [
            'email' => 'agus.koperasi@example.com',
            'status' => 'PENDING',
        ]);
    }

    #[Test]
    public function it_can_login_with_email(): void
    {
        $user = User::factory()->create([
            'email' => 'login.test@example.com',
            'password' => bcrypt('password123'),
            'status' => 'ACTIVE',
        ]);
        $user->assignRole('petani');

        $payload = [
            'email' => 'login.test@example.com',
            'password' => 'password123',
        ];

        $response = $this->postJson('/api/login', $payload);

        $response->assertOk()
                 ->assertJsonStructure([
                     'message',
                     'access_token',
                     'token_type',
                     'user'
                 ]);
    }

    #[Test]
    public function it_can_login_with_nik(): void
    {
        $user = User::factory()->create([
            'email' => 'farmer.nik@example.com',
            'password' => bcrypt('password123'),
            'status' => 'ACTIVE',
        ]);
        $user->assignRole('petani');

        Farmer::create([
            'user_id' => $user->id,
            'nik' => '3302999988887777',
        ]);

        $payload = [
            'login_identifier' => '3302999988887777',
            'password' => 'password123',
        ];

        $response = $this->postJson('/api/login', $payload);

        $response->assertOk();
    }

    #[Test]
    public function it_blocks_pending_or_rejected_petugas_koperasi_from_logging_in(): void
    {
        $pendingUser = User::factory()->create([
            'email' => 'pending.officer@example.com',
            'password' => bcrypt('password123'),
            'status' => 'PENDING',
        ]);
        $pendingUser->assignRole('petugas-koperasi');

        $responsePending = $this->postJson('/api/login', [
            'email' => 'pending.officer@example.com',
            'password' => 'password123',
        ]);

        $responsePending->assertStatus(403);

        $rejectedUser = User::factory()->create([
            'email' => 'rejected.officer@example.com',
            'password' => bcrypt('password123'),
            'status' => 'REJECTED',
            'rejection_reason' => 'Dokumen tidak valid',
        ]);
        $rejectedUser->assignRole('petugas-koperasi');

        $responseRejected = $this->postJson('/api/login', [
            'email' => 'rejected.officer@example.com',
            'password' => 'password123',
        ]);

        $responseRejected->assertStatus(403);
    }

    #[Test]
    public function it_fails_login_with_invalid_credentials(): void
    {
        User::factory()->create([
            'email' => 'valid.user@example.com',
            'password' => bcrypt('correctpassword'),
            'status' => 'ACTIVE',
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'valid.user@example.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(401);
    }

    #[Test]
    public function it_can_logout_authenticated_user(): void
    {
        $user = User::factory()->create([
            'status' => 'ACTIVE',
        ]);
        $token = $user->createToken('auth_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
                         ->postJson('/api/logout');

        $response->assertOk();

        $this->assertCount(0, $user->tokens);
    }
}