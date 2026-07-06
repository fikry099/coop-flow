<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Land extends Model
{
    use HasFactory;

    protected $fillable = [
        'farmer_id',
        'land_name',
        'area',
        'location_address',
        'polygon_coordinates', 
    ];

    protected $casts = [
        'polygon_coordinates' => 'array',
    ];

    public function farmer()
    {
        return $this->belongsTo(Farmer::class);
    }

    public function plants()
    {
        return $this->hasMany(Plant::class);
    }
}