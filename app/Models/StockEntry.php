<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockEntry extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'product_id',
        'supplier_id',
        'input_unit',
        'input_quantity',
        'conversion_rate',
        'quantity',
        'expiration_date',
        'entry_date',
        'batch_number',
        'unit_price',
        'is_paid',
        'notes',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'input_quantity' => 'decimal:2',
        'conversion_rate' => 'decimal:4',
        'quantity' => 'decimal:2',
        'expiration_date' => 'date',
        'entry_date' => 'date',
        'unit_price' => 'decimal:2',
        'is_paid' => 'boolean',
    ];

    /**
     * Get the product that owns the stock entry.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Get the supplier that owns the stock entry.
     */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    /**
     * Calculate total cost of this stock entry.
     */
    public function getTotalCost(): float
    {
        return (float) $this->quantity * (float) $this->unit_price;
    }

    /**
     * Check if the product is expired.
     */
    public function isExpired(): bool
    {
        return $this->expiration_date->isPast();
    }

    /**
     * Check if the product is expiring soon (within 7 days).
     */
    public function isExpiringSoon(): bool
    {
        return $this->expiration_date->isToday() || $this->expiration_date->isBetween(now(), now()->addDays(7));
    }

    /**
     * Get days until expiration.
     */
    public function getDaysUntilExpiration(): int
    {
        return now()->diffInDays($this->expiration_date, false);
    }
}
