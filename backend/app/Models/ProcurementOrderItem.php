<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProcurementOrderItem extends Model
{
    protected $fillable = [
        'procurement_order_id',
        'fertilizer_id',
        'fertilizer_name',
        'ai_suggested_bags',
        'ai_suggested_kg',
        'final_bags_ordered',
        'actual_received_bags', // <-- TAMBAHKAN INI
        'final_weight_kg',
        'packaging_size_kg',
        'price_per_kg',
        'harga_per_karung',
        'subtotal_price'
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(ProcurementOrder::class, 'procurement_order_id');
    }

    public function fertilizer(): BelongsTo
    {
        return $this->belongsTo(Fertilizer::class);
    }
}