<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProcurementOrderRevision extends Model
{
    use HasFactory;

    protected $fillable = [
        'procurement_order_id',
        'stage',
        'revised_by_user_id',
        'reason',
        'items_before',
        'items_after',
        'totals_before',
        'totals_after',
    ];

    protected $casts = [
        'items_before' => 'array',
        'items_after' => 'array',
        'totals_before' => 'array',
        'totals_after' => 'array',
    ];

    public function procurementOrder()
    {
        return $this->belongsTo(ProcurementOrder::class);
    }

    public function revisedBy()
    {
        return $this->belongsTo(User::class, 'revised_by_user_id');
    }
}