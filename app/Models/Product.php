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
        'price_per_carton',
        'unit',
        'stock_mode',
        'kg_per_carton',
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
        'price_per_carton' => 'decimal:2',
        'kg_per_carton' => 'decimal:2',
        'min_threshold' => 'decimal:2',
        'current_stock' => 'decimal:2',
    ];

    public function supportsKg(): bool
    {
        return in_array($this->stock_mode, ['kg_only', 'kg_and_carton'], true);
    }

    public function supportsCarton(): bool
    {
        return in_array($this->stock_mode, ['carton_only', 'kg_and_carton'], true);
    }

    public function canConvertCartonToKg(): bool
    {
        return $this->kg_per_carton !== null && (float) $this->kg_per_carton > 0;
    }

    /**
     * Prix de vente selon l'unité saisie (kg ou carton), sans lien imposé entre les deux.
     */
    public function priceForUnit(string $unit): float
    {
        $unit = strtolower(trim($unit));

        if ($unit === 'carton') {
            return (float) ($this->price_per_carton ?? 0);
        }

        return (float) $this->price_selling;
    }

    /**
     * Stock affiché : cartons entiers + reste en kg.
     *
     * @return array{kg: float, cartons: int|null, remainder_kg: float|null}
     */
    public function stockBreakdown(): array
    {
        $kg = (float) $this->current_stock;

        if (!$this->canConvertCartonToKg()) {
            return ['kg' => $kg, 'cartons' => null, 'remainder_kg' => null];
        }

        $rate = (float) $this->kg_per_carton;
        $cartons = (int) floor($kg / $rate);
        $remainder = round($kg - ($cartons * $rate), 2);

        return ['kg' => $kg, 'cartons' => $cartons, 'remainder_kg' => $remainder];
    }

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
