<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('fertilizers', function (Blueprint $table) {
            $table->id();
            $table->string('fertilizer_code')->unique();
            
            $table->foreignId('cooperative_id')->constrained('cooperatives')->onDelete('cascade');
            
            $table->string('name'); 
            $table->string('image')->nullable(); 
            
            $table->unsignedInteger('packaging_size_kg')->default(50); 
            $table->integer('current_stock_kg')->default(0);
            $table->integer('minimum_stock_kg')->default(1000);
            $table->integer('price_per_kg')->default(0); 
            
            $table->enum('status', ['tersedia', 'menipis', 'habis'])->default('tersedia');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fertilizers');
    }
};