<?php

namespace Tests\Feature\Api;

use App\Models\Cooperative;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\Test;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CooperativeRegistrationTest extends TestCase
{
    use RefreshDatabase;

    protected $adminKemenko;
    protected $petugasRole;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Inisialisasi Role
        $roles = ['petugas-koperasi', 'kemenko-pangan'];
        foreach ($roles as $role) {
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'api']);
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        }

        // 2. Mocking Storage Disk Public
        Storage::fake('public');

        // 3. User Admin Kemenko (Akses Internal/Approval)
        $this->adminKemenko = User::factory()->create([
            'name'   => 'Admin Kemenko Pangan',
            'email'  => 'admin@kemenko.go.id',
            'status' => 'ACTIVE',
        ]);
        $this->adminKemenko->assignRole('kemenko-pangan');
    }

    /* =========================================================================
     * 1. REGISTER TESTS
     * ========================================================================= */

    #[Test]
    public function public_user_can_register_cooperative_successfully(): void
    {
        $file = UploadedFile::fake()->create('dokumen_legal.pdf', 500, 'application/pdf');

        $payload = [
            'cooperative_name'        => 'Koperasi Tani Makmur',
            'cooperative_code'        => 'KOP-1001',
            'nib_cooperative'         => '1234567890123',
            'npwp'                    => '01.234.567.8-901.000',
            'legal_approval_document' => $file,
            'legal_approval_number'   => 'SK-AHU-00123-2024',
            'established_date'        => '2020-01-15',
            'address_cooperative'     => 'Jl. Tani Merdeka No. 12',
            'email_cooperative'       => 'tanimakmur@gmail.com',
            'phone_cooperative'       => '081234567890',
            'province'                => '33',
            'city_koor'               => '3302',
            'district'                => '330201',
            'village'                 => '330201001',
            'postal_code'             => '53111',
            'capacity_ton'            => 150, // Disesuaikan dari 150.5 menjadi integer 150
            'password'                => 'password123',
        ];

        $response = $this->postJson('/api/cooperative/register', $payload);

        $response->assertStatus(201)
                 ->assertJson([
                     'success' => true,
                     'message' => 'Pendaftaran Koperasi sukses diajukan!',
                 ]);

        // Cek Database Cooperatives
        $this->assertDatabaseHas('cooperatives', [
            'name'              => 'Koperasi Tani Makmur',
            'cooperative_code'  => 'KOP-1001',
            'nib_cooperative'   => '1234567890123',
            'email_cooperative' => 'tanimakmur@gmail.com',
            'is_activated'      => false,
        ]);

        // Cek Database Users
        $this->assertDatabaseHas('users', [
            'email'  => 'tanimakmur@gmail.com',
            'status' => 'PENDING',
        ]);

        // Cek File Ter-upload
        $cooperative = Cooperative::where('cooperative_code', 'KOP-1001')->first();
        if ($cooperative && $cooperative->legal_approval_document) {
            Storage::disk('public')->assertExists($cooperative->legal_approval_document);
        }

        // Cek Role Assigned
        $user = User::where('email', 'tanimakmur@gmail.com')->first();
        if ($user) {
            $this->assertTrue($user->hasRole('petugas-koperasi'));
        }
    }

    #[Test]
    public function register_fails_validation_when_required_fields_are_missing(): void
    {
        $response = $this->postJson('/api/cooperative/register', []);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors([
                     'cooperative_name',
                     'cooperative_code',
                     'nib_cooperative',
                     'npwp',
                     'legal_approval_document',
                     'legal_approval_number',
                     'established_date',
                     'address_cooperative',
                     'email_cooperative',
                     'phone_cooperative',
                     'province',
                     'city_koor',
                     'district',
                     'village',
                     'postal_code',
                     'capacity_ton',
                     'password',
                 ]);
    }

    #[Test]
    public function register_fails_when_nib_length_is_not_13_digits(): void
    {
        $file = UploadedFile::fake()->create('doc.pdf', 100);

        $payload = [
            'cooperative_name'        => 'Koperasi Sukses',
            'cooperative_code'        => 'KOP-1002',
            'nib_cooperative'         => '12345', // Kurang dari 13 digit
            'npwp'                    => '01.234.567.8-901.000',
            'legal_approval_document' => $file,
            'legal_approval_number'   => 'SK-123',
            'established_date'        => '2020-01-15',
            'address_cooperative'     => 'Jl. Pemuda',
            'email_cooperative'       => 'sukses@gmail.com',
            'phone_cooperative'       => '081234567890',
            'province'                => '33',
            'city_koor'               => '3302',
            'district'                => '330201',
            'village'                 => '330201001',
            'postal_code'             => '53111',
            'capacity_ton'            => 100,
            'password'                => 'password123',
        ];

        $response = $this->postJson('/api/cooperative/register', $payload);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['nib_cooperative']);
    }

    /* =========================================================================
     * 2. GET PENDING REGISTRATIONS TESTS
     * ========================================================================= */

    #[Test]
    public function user_can_get_pending_registrations_list(): void
    {
        $cooperative = Cooperative::create([
            'name'                    => 'Koperasi Pending',
            'cooperative_code'        => 'KOP-PENDING',
            'nib_cooperative'         => '1234567890111',
            'legal_approval_document' => 'cooperatives/legal-documents/test.pdf',
        ]);

        $user = User::factory()->create([
            'name'           => 'User Pending',
            'email'          => 'pending@koperasi.com',
            'status'         => 'PENDING',
            'cooperative_id' => $cooperative->id,
        ]);
        $user->assignRole('petugas-koperasi');

        $response = $this->actingAs($this->adminKemenko, 'sanctum')
                         ->getJson('/api/kemenko/registrations/pending');

        $response->assertStatus(200)
                 ->assertJson(['success' => true])
                 ->assertJsonPath('data.0.id', $user->id)
                 ->assertJsonPath('data.0.status', 'PENDING');
    }

    /* =========================================================================
     * 3. APPROVE REGISTRATION TESTS
     * ========================================================================= */

    #[Test]
    public function admin_can_approve_cooperative_registration(): void
    {
        $cooperative = Cooperative::create([
            'name'             => 'Koperasi Siap Aktif',
            'cooperative_code' => 'KOP-0001',
            'nib_cooperative'  => '1234567890112',
            'is_activated'     => false,
        ]);

        $user = User::factory()->create([
            'status'         => 'PENDING',
            'cooperative_id' => $cooperative->id,
        ]);

        $response = $this->actingAs($this->adminKemenko, 'sanctum')
                         ->postJson("/api/kemenko/registrations/{$user->id}/approve");

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true,
                     'message' => 'Akun dan data induk Koperasi sukses diaktifkan!',
                 ]);

        $this->assertDatabaseHas('users', [
            'id'     => $user->id,
            'status' => 'ACTIVE',
        ]);

        $this->assertDatabaseHas('cooperatives', [
            'id'           => $cooperative->id,
            'is_activated' => true,
        ]);
    }

    #[Test]
    public function approve_returns_404_if_user_not_found(): void
    {
        $response = $this->actingAs($this->adminKemenko, 'sanctum')
                         ->postJson('/api/kemenko/registrations/999999/approve');

        $response->assertStatus(404)
                 ->assertJson(['message' => 'Data pengajuan tidak ditemukan.']);
    }

    /* =========================================================================
     * 4. REJECT REGISTRATION TESTS
     * ========================================================================= */

    #[Test]
    public function admin_can_reject_cooperative_registration(): void
    {
        $user = User::factory()->create([
            'status' => 'PENDING',
        ]);

        $payload = [
            'rejection_reason' => 'Dokumen pendukung legalitas tidak terbaca jelas.',
        ];

        $response = $this->actingAs($this->adminKemenko, 'sanctum')
                         ->postJson("/api/kemenko/registrations/{$user->id}/reject", $payload);

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true,
                     'message' => 'Pengajuan pendaftaran Koperasi resmi ditolak.',
                 ]);

        $this->assertDatabaseHas('users', [
            'id'               => $user->id,
            'status'           => 'REJECTED',
            'rejection_reason' => 'Dokumen pendukung legalitas tidak terbaca jelas.',
        ]);
    }

    #[Test]
    public function reject_fails_validation_without_rejection_reason(): void
    {
        $user = User::factory()->create(['status' => 'PENDING']);

        $response = $this->actingAs($this->adminKemenko, 'sanctum')
                         ->postJson("/api/kemenko/registrations/{$user->id}/reject", []);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['rejection_reason']);
    }

    /* =========================================================================
     * 5. GET ACTIVE REGISTRATIONS TESTS
     * ========================================================================= */

    #[Test]
    public function user_can_get_active_registrations_list(): void
    {
        $cooperative = Cooperative::create([
            'name'                    => 'Koperasi Aktif Sejahtera',
            'cooperative_code'        => 'KOP-0002',
            'nib_cooperative'         => '1234567890113',
            'is_activated'            => true,
            'legal_approval_document' => 'cooperatives/legal-documents/active.pdf',
        ]);

        $user = User::factory()->create([
            'name'           => 'User Aktif',
            'email'          => 'aktif@koperasi.com',
            'status'         => 'ACTIVE',
            'cooperative_id' => $cooperative->id,
        ]);
        $user->assignRole('petugas-koperasi');

        $response = $this->actingAs($this->adminKemenko, 'sanctum')
                         ->getJson('/api/kemenko/registrations/active');

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true,
                     'message' => 'Berhasil mengambil data koperasi aktif',
                 ])
                 ->assertJsonPath('data.0.id', $user->id)
                 ->assertJsonPath('data.0.status', 'ACTIVE');
    }

    /* =========================================================================
     * 6. SHOW REGISTRATION DETAIL TESTS
     * ========================================================================= */

    #[Test]
    public function user_can_get_cooperative_registration_detail(): void
    {
        $cooperative = Cooperative::create([
            'name'                    => 'Koperasi Detail Test',
            'cooperative_code'        => 'KOP-0003',
            'nib_cooperative'         => '1234567890114',
            'legal_approval_document' => 'cooperatives/legal-documents/detail.pdf',
        ]);

        $user = User::factory()->create([
            'name'           => 'User Detail',
            'email'          => 'detail@koperasi.com',
            'status'         => 'ACTIVE',
            'cooperative_id' => $cooperative->id,
        ]);

        $response = $this->actingAs($this->adminKemenko, 'sanctum')
                         ->getJson("/api/kemenko/registrations/{$user->id}");

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true,
                     'message' => 'Berhasil mengambil detail pendaftaran',
                     'data'    => [
                         'id'    => $user->id,
                         'email' => 'detail@koperasi.com',
                     ]
                 ]);
    }

    #[Test]
    public function show_returns_404_when_cooperative_user_not_found(): void
    {
        $response = $this->actingAs($this->adminKemenko, 'sanctum')
                         ->getJson('/api/kemenko/registrations/999999');

        $response->assertStatus(404)
                 ->assertJson([
                     'success' => false,
                     'message' => 'Data Koperasi tidak ditemukan.',
                 ]);
    }
}