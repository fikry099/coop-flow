<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Plant extends Model
{
    use HasFactory;

    protected $fillable = [
        'land_id',
        'name',
        'planting_date',
    ];

    // Relasi balik ke Lahan (Land)
    public function land()
    {
        return $this->belongsTo(Land::class);
    }
}