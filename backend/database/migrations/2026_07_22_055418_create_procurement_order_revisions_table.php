<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('procurement_order_revisions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('procurement_order_id')
                ->constrained('procurement_orders')
                ->cascadeOnDelete();

            // Tahap validasi mana yang melakukan penyesuaian
            $table->enum('stage', ['DINAS', 'KEMENKO']);

            // Siapa yang menyesuaikan (petugas Dinas / Kemenko)
            $table->foreignId('revised_by_user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            // Alasan wajib kenapa disesuaikan
            $table->text('reason');

            // Snapshot lengkap item sebelum & sesudah disesuaikan (audit trail)
            $table->json('items_before');
            $table->json('items_after');

            // Ringkasan total sebelum & sesudah (biar gampang ditampilkan tanpa parse json items)
            $table->json('totals_before');
            $table->json('totals_after');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('procurement_order_revisions');
    }
};