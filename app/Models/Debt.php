<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Debt extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'client_id',
        'supplier_id',
        'amount',
        'type',
        'date',
        'notes',
        'reference',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'amount' => 'decimal:2',
        'date' => 'date',
    ];

    /**
     * Type constants
     */
    public const TYPE_CREDIT = 'credit';
    public const TYPE_DEBIT = 'debit';

    /**
     * Get the client that owns the debt.
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    /**
     * Get the supplier that owns the debt.
     */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    /**
     * Check if this is a credit (client owes money).
     */
    public function isCredit(): bool
    {
        return $this->type === self::TYPE_CREDIT;
    }

    /**
     * Check if this is a debit (supplier owes money).
     */
    public function isDebit(): bool
    {
        return $this->type === self::TYPE_DEBIT;
    }

    /**
     * Scope to filter by client.
     */
    public function scopeForClient($query, $clientId)
    {
        return $query->where('client_id', $clientId);
    }

    /**
     * Scope to filter by supplier.
     */
    public function scopeForSupplier($query, $supplierId)
    {
        return $query->where('supplier_id', $supplierId);
    }

    /**
     * Scope to get credits only.
     */
    public function scopeCredits($query)
    {
        return $query->where('type', self::TYPE_CREDIT);
    }

    /**
     * Scope to get debits only.
     */
    public function scopeDebits($query)
    {
        return $query->where('type', self::TYPE_DEBIT);
    }
}
