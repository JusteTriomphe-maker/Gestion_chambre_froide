<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'barcode',
        'category',
        'price_buying',
        'price_selling',
        'unit',
        'min_threshold',
        'current_stock',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'price_buying' => 'decimal:2',
        'price_selling' => 'decimal:2',
        'min_threshold' => 'decimal:2',
        'current_stock' => 'decimal:2',
    ];

    /**
     * Get the stock entries for this product.
     */
    public function stockEntries(): HasMany
    {
        return $this->hasMany(StockEntry::class);
    }

    /**
     * Get the stock exits for this product.
     */
    public function stockExits(): HasMany
    {
        return $this->hasMany(StockExit::class);
    }

    /**
     * Check if product is below minimum threshold.
     */
    public function isBelowThreshold(): bool
    {
        return $this->current_stock < $this->min_threshold;
    }

    /**
     * Calculate the total value of current stock.
     */
    public function getStockValue(): float
    {
        return (float) $this->current_stock * (float) $this->price_buying;
    }

    /**
     * Calculate the potential profit from current stock.
     */
    public function getPotentialProfit(): float
    {
        return ((float) $this->current_stock * (float) $this->price_selling) - $this->getStockValue();
    }
}
