<?php

namespace App\Models;

use App\Traits\Loggable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IssuanceItem extends Model
{
    use Loggable;
    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'issuance_id',
        'inventory_id',
        'item_name',
        'brand',
        'uom',
        'med_type',
        'qty_issued',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'med_type'   => 'integer',
        'qty_issued' => 'integer',
    ];

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    /**
     * An issuance item belongs to a parent issuance record.
     */
    public function issuance(): BelongsTo
    {
        return $this->belongsTo(Issuance::class);
    }
}
