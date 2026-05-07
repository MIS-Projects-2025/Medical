<?php

namespace App\Models;

use App\Traits\Loggable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Issuance extends Model
{
    use Loggable;
    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'emp_id',
        'emp_name',
        'issued_by_emp_id',
        'issued_by_name',
        'issue_date',
        'notes',
        'status',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'issue_date' => 'date',
        'status'     => 'integer',
    ];

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    /**
     * An issuance record has many line items.
     */
    public function items(): HasMany
    {
        return $this->hasMany(IssuanceItem::class);
    }
}
