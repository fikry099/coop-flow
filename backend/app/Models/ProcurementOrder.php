<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProcurementOrder extends Model
{
    protected $fillable = [
        'cooperative_id',
        'po_number',
        'periode_pengadaan',
        'total_items',
        'total_bags_ordered',
        'total_weight_kg',
        'total_estimated_cost',
        'status_verifikasi',
        'status_logistik',
        'origin_lat',
        'origin_lng',
        'destination_lat',
        'destination_lng',
        'gis_distance_km',
        'estimated_travel_hours',
        'dispatched_at',
        'dinas_received_at',
        'completed_at',
        'rejection_reason',
        'notes_from_verifier',
        'receipt_notes' // <-- TAMBAHKAN INI
    ];

    protected $casts = [
        'dispatched_at' => 'datetime',
        'dinas_received_at' => 'datetime',
        'completed_at' => 'datetime',
        'gis_distance_km' => 'float',
        'total_weight_kg' => 'float',
        'total_estimated_cost' => 'float',
    ];

    public function cooperative(): BelongsTo
    {
        return $this->belongsTo(Cooperative::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(ProcurementOrderItem::class);
    }

    public function revisions()
    {
        return $this->hasMany(ProcurementOrderRevision::class);
    }
}