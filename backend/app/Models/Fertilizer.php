<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Fertilizer extends Model
{
    protected $fillable = [
        'fertilizer_code', 
        'cooperative_id', 
        'name', 
        'image',
        'packaging_size_kg', 
        'current_stock_kg', 
        'minimum_stock_kg', 
        'price_per_kg', 
        'status'
    ];

    protected static function booted()
    {
        static::creating(function ($fertilizer) {
            // 1. Ambil ID berikutnya
            $nextId = (static::max('id') ?? 0) + 1;

            // 2. Bersihkan nama pupuk (UPPERCASE dan tanpa spasi)
            $cleanName = Str::upper(str_replace(' ', '', $fertilizer->name));

            // 3. Ambil tanggal hari ini (DDMMYY)
            $date = date('dmy');

            // 4. Gabungkan menjadi kode: NAMA-ID-TANGGAL
            $fertilizer->fertilizer_code = "{$cleanName}-{$nextId}-{$date}";
        });
    }


    public function cooperative(): BelongsTo
    {
        return $this->belongsTo(Cooperative::class);
    }

    public function mutations(): HasMany
    {
        return $this->hasMany(InventoryMutation::class);
    }
}