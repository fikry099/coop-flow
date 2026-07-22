<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private array $newValues = [
        'DRAFT',
        'PENDING_DINAS',
        'REJECTED_DINAS',
        'PENDING_KEMENKO',
        'PENDING_KEMENKO_ADJUSTED',
        'REJECTED_KEMENKO',
        'APPROVED',
        'APPROVED_ADJUSTED',
    ];

    private array $oldValues = [
        'DRAFT',
        'PENDING_DINAS',
        'REJECTED_DINAS',
        'PENDING_KEMENKO',
        'REJECTED_KEMENKO',
        'APPROVED',
    ];

    public function up(): void
    {
        // Laravel mengimplementasikan enum() di Postgres sebagai kolom varchar + CHECK constraint
        // (bukan tipe native ENUM seperti MySQL), jadi cara mengubahnya: drop constraint lama,
        // tambah constraint baru dengan daftar value yang sudah diperluas.
        $this->dropExistingCheckConstraint();

        $list = "'" . implode("','", $this->newValues) . "'";

        DB::statement("
            ALTER TABLE procurement_orders
            ADD CONSTRAINT procurement_orders_status_verifikasi_check
            CHECK (status_verifikasi IN ({$list}))
        ");
    }

    public function down(): void
    {
        // Pastikan tidak ada baris yang masih memakai value baru sebelum enum diciutkan lagi,
        // supaya CHECK constraint versi lama tidak menolak data yang ada.
        DB::table('procurement_orders')
            ->where('status_verifikasi', 'PENDING_KEMENKO_ADJUSTED')
            ->update(['status_verifikasi' => 'PENDING_KEMENKO']);

        DB::table('procurement_orders')
            ->where('status_verifikasi', 'APPROVED_ADJUSTED')
            ->update(['status_verifikasi' => 'APPROVED']);

        $this->dropExistingCheckConstraint();

        $list = "'" . implode("','", $this->oldValues) . "'";

        DB::statement("
            ALTER TABLE procurement_orders
            ADD CONSTRAINT procurement_orders_status_verifikasi_check
            CHECK (status_verifikasi IN ({$list}))
        ");
    }

    /**
     * Cari nama CHECK constraint yang otomatis dibuat Laravel untuk kolom status_verifikasi,
     * lalu hapus. Dicari dinamis lewat pg_constraint karena namanya bisa bervariasi
     * tergantung versi Laravel/urutan migrasi, jadi tidak aman kalau di-hardcode.
     */
    private function dropExistingCheckConstraint(): void
    {
        $constraints = DB::select("
            SELECT con.conname
            FROM pg_constraint con
            JOIN pg_class rel ON rel.oid = con.conrelid
            JOIN pg_attribute att
                ON att.attrelid = rel.oid
               AND att.attnum = ANY(con.conkey)
            WHERE rel.relname = 'procurement_orders'
              AND att.attname = 'status_verifikasi'
              AND con.contype = 'c'
        ");

        foreach ($constraints as $constraint) {
            DB::statement('ALTER TABLE procurement_orders DROP CONSTRAINT "' . $constraint->conname . '"');
        }
    }
};