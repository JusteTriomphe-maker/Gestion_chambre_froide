<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Client extends Model
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
     * Get the stock exits for this client.
     */
    public function stockExits(): HasMany
    {
        return $this->hasMany(StockExit::class);
    }

    /**
     * Get the debts for this client.
     */
    public function debts(): HasMany
    {
        return $this->hasMany(Debt::class);
    }

    /**
     * Get the payments for this client.
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * Get unpaid stock exits for this client.
     */
    public function unpaidStockExits()
    {
        return $this->stockExits()->where('is_paid', false);
    }

    /**
     * Calculate total unpaid amount from client.
     */
    public function getUnpaidAmount(): float
    {
        return $this->unpaidStockExits()
            ->selectRaw('SUM(quantity * unit_price) as total')
            ->value('total') ?? 0;
    }
}
