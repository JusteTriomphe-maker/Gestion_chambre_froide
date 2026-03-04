<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Supplier extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'contact_info',
        'address',
        'phone',
        'email',
        'total_debt',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'total_debt' => 'decimal:2',
    ];

    /**
     * Get the stock entries for this supplier.
     */
    public function stockEntries(): HasMany
    {
        return $this->hasMany(StockEntry::class);
    }

    /**
     * Get the debts for this supplier.
     */
    public function debts(): HasMany
    {
        return $this->hasMany(Debt::class);
    }

    /**
     * Get unpaid stock entries for this supplier.
     */
    public function unpaidStockEntries()
    {
        return $this->stockEntries()->where('is_paid', false);
    }

    /**
     * Calculate total unpaid amount from supplier.
     */
    public function getUnpaidAmount(): float
    {
        return $this->unpaidStockEntries()
            ->selectRaw('SUM(quantity * unit_price) as total')
            ->value('total') ?? 0;
    }
}
