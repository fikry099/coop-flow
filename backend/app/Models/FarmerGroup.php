<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FarmerGroup extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'description'];

    /**
     * Relasi ke model Farmer (Satu kelompok tani punya banyak petani)
     */
    public function farmers(): HasMany
    {
        return $this->hasMany(Farmer::class);
    }
}