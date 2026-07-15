<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('land_id')->constrained('lands')->onDelete('cascade');
            $table->string('name'); 
            $table->date('planting_date'); 
            
            $table->string('current_phase')->default('Vegetatif'); 

            $table->string('last_fertilizer_type')->nullable(); 

            $table->decimal('last_fertilizer_amount', 8, 2)->default(0.00);
            
            $table->string('last_phase')->nullable()->default('Tidak Ada');
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plants');
    }
};