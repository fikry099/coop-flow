<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Tambahkan kolom catatan penerimaan di tabel procurement_orders
        Schema::table('procurement_orders', function (Blueprint $table) {
            $table->text('receipt_notes')->nullable()->after('notes_from_verifier');
        });

        // 2. Tambahkan kolom jumlah fisik diterima di tabel procurement_order_items
        Schema::table('procurement_order_items', function (Blueprint $table) {
            $table->integer('actual_received_bags')->nullable()->after('final_bags_ordered');
        });
    }

    public function down(): void
    {
        Schema::table('procurement_orders', function (Blueprint $table) {
            $table->dropColumn('receipt_notes');
        });

        Schema::table('procurement_order_items', function (Blueprint $table) {
            $table->dropColumn('actual_received_bags');
        });
    }
};