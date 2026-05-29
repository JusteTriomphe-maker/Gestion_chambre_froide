<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'amount',
        'type',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public const TYPE_PARTIAL = 'partial';
    public const TYPE_FULL = 'full';

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }
}

