<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockExit extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'product_id',
        'client_id',
        'user_id',
        'quantity',
        'exit_date',
        'reason',
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
        'quantity' => 'decimal:2',
        'exit_date' => 'date',
        'unit_price' => 'decimal:2',
        'is_paid' => 'boolean',
    ];

    /**
     * Reason constants
     */
    public const REASON_VENTE = 'vente';
    public const REASON_PERT = 'perte';
    public const REASON_PEREMPTION = 'peremption';
    public const REASON_AUTRE = 'autre';

    /**
     * Get the product that owns the stock exit.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Get the client that owns the stock exit.
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    /**
     * Get the user (caissier) that created the stock exit.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Calculate total revenue from this stock exit.
     */
    public function getTotalRevenue(): float
    {
        return (float) $this->quantity * (float) $this->unit_price;
    }

    /**
     * Calculate profit for this stock exit.
     */
    public function getProfit(): float
    {
        $costPrice = (float) $this->product->price_buying;
        return ((float) $this->quantity * (float) $this->unit_price) - ((float) $this->quantity * $costPrice);
    }

    /**
     * Check if this is a sale (vente).
     */
    public function isSale(): bool
    {
        return $this->reason === self::REASON_VENTE;
    }

    /**
     * Check if this is a loss (perte).
     */
    public function isLoss(): bool
    {
        return $this->reason === self::REASON_PERT;
    }

    /**
     * Check if this is due to expiration (peremption).
     */
    public function isExpired(): bool
    {
        return $this->reason === self::REASON_PEREMPTION;
    }
}
